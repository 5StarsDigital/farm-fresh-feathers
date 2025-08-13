import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // client để xác thực user từ JWT đính kèm (Authorization header)
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    // service client để thực thi các bước cập nhật mang tính “giao dịch”/rollback
    const supabaseService = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const packageId: string = body?.packageId;
    const additionalQuantity: number = Number(body?.additionalQuantity ?? 0);

    if (!packageId || !Number.isFinite(additionalQuantity) || additionalQuantity <= 0) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Xác thực người dùng
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lấy gói dịch vụ (người dùng sở hữu)
    const { data: pkg, error: pkgErr } = await supabase
      .from("service_packages")
      .select("id, farm_id, selected_chicken_type_id, selected_chicken_quantity, coop_name")
      .eq("id", packageId)
      .single();

    if (pkgErr || !pkg) {
      return new Response(JSON.stringify({ error: "Package not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Lấy trang trại & số dư của user (ràng buộc sở hữu)
    const { data: farm, error: farmErr } = await supabase
      .from("farms")
      .select("id, user_id, account_balance")
      .eq("id", pkg.farm_id)
      .single();

    if (farmErr || !farm || farm.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Giá gà & chu kỳ trứng để tham chiếu
    const { data: chickenType, error: chickenErr } = await supabase
      .from("chicken_types")
      .select("id, name, price, eggs_per_period, days_per_period")
      .eq("id", pkg.selected_chicken_type_id)
      .single();

    if (chickenErr || !chickenType) {
      return new Response(JSON.stringify({ error: "Chicken type not found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Giới hạn chuồng (nếu có cấu hình trong available_farms)
    const { data: coop, error: coopErr } = await supabase
      .from("available_farms")
      .select("min_chickens_per_coop, max_chickens_per_coop")
      .eq("name", pkg.coop_name)
      .maybeSingle();

    const minChickens = coop?.min_chickens_per_coop ?? 1;
    const maxChickens = coop?.max_chickens_per_coop ?? 999999;

    const newTotal = (pkg.selected_chicken_quantity || 0) + additionalQuantity;
    if (newTotal < minChickens || newTotal > maxChickens) {
      return new Response(
        JSON.stringify({
          error: `Giới hạn chuồng: ${minChickens}–${maxChickens} con.`,
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Tính tiền & kiểm tra số dư
    const totalCost = (chickenType.price || 0) * additionalQuantity;
    if ((farm.account_balance || 0) < totalCost) {
      return new Response(JSON.stringify({ error: "Số dư không đủ" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // “Giao dịch” thủ công: cập nhật số dư → cập nhật gói → cộng số gà user_chickens → ghi transaction
    const currentBalance = farm.account_balance;

    // 1) Trừ tiền
    const { error: balanceErr } = await supabaseService
      .from("farms")
      .update({ account_balance: currentBalance - totalCost })
      .eq("id", farm.id);
    if (balanceErr) throw balanceErr;

    try {
      // 2) Cập nhật gói (số lượng gà)
      const { error: pkgUpdateErr } = await supabaseService
        .from("service_packages")
        .update({ selected_chicken_quantity: newTotal })
        .eq("id", packageId);
      if (pkgUpdateErr) throw pkgUpdateErr;

      // 3) Cộng số gà vào user_chickens (cùng type)
      //    nếu đã có row cho (farm_id, chicken_type_id) thì tăng; nếu chưa thì insert
      const { data: ucExisting, error: ucSelectErr } = await supabaseService
        .from("user_chickens")
        .select("id, quantity")
        .eq("farm_id", farm.id)
        .eq("chicken_type_id", chickenType.id)
        .maybeSingle();
      if (ucSelectErr) throw ucSelectErr;

      if (ucExisting?.id) {
        const { error: ucUpdateErr } = await supabaseService
          .from("user_chickens")
          .update({ quantity: (ucExisting.quantity || 0) + additionalQuantity })
          .eq("id", ucExisting.id);
        if (ucUpdateErr) throw ucUpdateErr;
      } else {
        const { error: ucInsertErr } = await supabaseService
          .from("user_chickens")
          .insert({
            farm_id: farm.id,
            chicken_type_id: chickenType.id,
            quantity: additionalQuantity,
            last_egg_collection: new Date().toISOString(),
          });
        if (ucInsertErr) throw ucInsertErr;
      }

      // 4) Ghi transaction (payment/chi)
      const { error: txnErr } = await supabaseService
        .from("transactions")
        .insert({
          farm_id: farm.id,
          transaction_type: "purchase_chicken",
          amount: -totalCost,
          quantity: additionalQuantity,
          description: `Mua thêm ${additionalQuantity} gà (${chickenType.name}) cho gói ${packageId}`,
        });
      if (txnErr) throw txnErr;
    } catch (e) {
      // Rollback số dư nếu các bước sau trừ tiền bị lỗi
      await supabaseService
        .from("farms")
        .update({ account_balance: currentBalance })
        .eq("id", farm.id);
      throw e;
    }

    return new Response(
      JSON.stringify({
        success: true,
        packageId,
        additionalQuantity,
        totalCost,
        balance_before: currentBalance,
        balance_after: currentBalance - totalCost,
        new_balance: currentBalance - totalCost
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Add chickens error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
