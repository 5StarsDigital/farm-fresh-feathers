
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function startOfDayTZ(d: Date, offsetHours = 7) {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const tz = new Date(utc + offsetHours * 3600000);
  return new Date(Date.UTC(tz.getUTCFullYear(), tz.getUTCMonth(), tz.getUTCDate()));
}

function diffDays(a: Date, b: Date, offsetHours = 7) {
  const A = startOfDayTZ(a, offsetHours).getTime();
  const B = startOfDayTZ(b, offsetHours).getTime();
  return Math.max(0, Math.floor((A - B) / 86400000));
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json().catch(() => ({ user_id: null }));
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const userClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin, error: adminErr } = await userClient.rpc("is_admin");
    if (adminErr || !isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load required data for the target user
    const today = new Date();

    const [{ data: pkgList, error: pkErr }, { data: rentals, error: rErr }, { data: farm, error: farmErr }, { data: profile }] = await Promise.all([
      supabase
        .from("service_packages")
        .select(
          "id, user_id, farm_id, package_id, package_name, selected_chicken_quantity, last_billed_at, last_billing_date, service_start_date, purchased_at, status"
        )
        .eq("user_id", user_id)
        .in("status", ["active", "suspended"]),
      supabase
        .from("farm_rentals")
        .select("id, user_id, farm_id, monthly_cost, created_at, last_billed_at, status")
        .eq("user_id", user_id)
        .in("status", ["active", "suspended"]),
      supabase.from("farms").select("id, user_id, account_balance").eq("user_id", user_id).maybeSingle(),
      supabase.from("profiles").select("id, email, full_name").eq("id", user_id).maybeSingle(),
    ]);

    if (pkErr) throw pkErr;
    if (rErr) throw rErr;
    if (farmErr) throw farmErr;

    if (!farm) {
      return new Response(JSON.stringify({ error: "Farm not found for user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prices, error: priceErr } = await supabase
      .from("package_prices")
      .select("package_id, daily_price");
    if (priceErr) throw priceErr;
    const priceMap = new Map<string, number>();
    (prices || []).forEach((p: any) => priceMap.set(p.package_id, Number(p.daily_price) || 0));

    // Build invoice items
    type Item = {
      type: "package" | "rental";
      package_id?: string | null;
      package_name: string;
      daily_price: number;
      quantity: number;
      days_elapsed: number;
      amount: number;
      ref_id: string; // package or rental id
    };

    const items: Item[] = [];

    for (const pkg of pkgList || []) {
      const qty = Number(pkg.selected_chicken_quantity || 0);
      const unit = Number(priceMap.get(pkg.package_id) || 0);
      const daily = unit * qty;
      if (daily <= 0) continue;
      const base = pkg.last_billed_at
        ? new Date(pkg.last_billed_at)
        : pkg.last_billing_date
        ? new Date(pkg.last_billing_date)
        : pkg.service_start_date
        ? new Date(pkg.service_start_date)
        : new Date(pkg.purchased_at || today);
      const days = diffDays(today, base);
      if (days <= 0) continue;
      const amount = Math.round(daily * days);
      items.push({
        type: "package",
        package_id: pkg.id,
        package_name: pkg.package_name || "Gói dịch vụ",
        daily_price: unit,
        quantity: qty,
        days_elapsed: days,
        amount,
        ref_id: pkg.id,
      });
    }

    for (const r of rentals || []) {
      const monthly = Number(r.monthly_cost || 0);
      const unit = Math.round(monthly / 30);
      const base = r.last_billed_at ? new Date(r.last_billed_at) : new Date(r.created_at);
      const days = diffDays(today, base);
      if (unit <= 0 || days <= 0) continue;
      const amount = Math.round(unit * days);
      items.push({
        type: "rental",
        package_id: null,
        package_name: "Thuê chuồng",
        daily_price: unit,
        quantity: 1,
        days_elapsed: days,
        amount,
        ref_id: r.id,
      });
    }

    const total = items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    if (total <= 0) {
      return new Response(JSON.stringify({ error: "Không có khoản nào cần thanh toán" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const balanceBefore = Number(farm.account_balance || 0);
    const balanceAfter = balanceBefore - total;
    if (balanceAfter < 0) {
      return new Response(JSON.stringify({ error: "Số dư không đủ" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Start writes
    const runId = crypto.randomUUID();

    // Ensure a billing run exists to satisfy invoices.run_id FK
    const { error: runErr } = await supabase
      .from("billing_runs")
      .insert({
        id: runId,
        initiated_by: userData.user.id,
        type: "daily_pay_now",
        status: "completed",
        dry_run: false,
        summary_json: { daily_billing: true, item_count: items.length, total_amount: total, user_id },
      });
    if (runErr) throw runErr;

    // Create invoice
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .insert({
        run_id: runId,
        farm_id: farm.id,
        user_id,
        total_amount: total,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        status: "paid",
        metadata: { daily_billing: true, item_count: items.length },
      })
      .select()
      .single();
    if (invErr) throw invErr;

    // Create invoice items
    const { error: itemsErr } = await supabase.from("invoice_items").insert(
      items.map((it) => ({
        invoice_id: invoice.id,
        package_id: it.type === "package" ? it.package_id : null,
        package_name: it.package_name,
        daily_price: it.daily_price,
        quantity: it.quantity,
        days_elapsed: it.days_elapsed,
        amount: it.amount,
      }))
    );
    if (itemsErr) throw itemsErr;

    // Update balances
    const { error: balErr } = await supabase
      .from("farms")
      .update({ account_balance: balanceAfter })
      .eq("id", farm.id);
    if (balErr) throw balErr;

    // Update last_billed_at for packages and rentals that were billed
    const nowIso = new Date().toISOString();

    const billedPkgIds = items.filter((it) => it.type === "package").map((it) => it.ref_id);
    if (billedPkgIds.length > 0) {
      const { error: upPkgErr } = await supabase
        .from("service_packages")
        .update({ last_billed_at: nowIso, last_billing_date: nowIso.slice(0, 10) })
        .in("id", billedPkgIds);
      if (upPkgErr) throw upPkgErr;
    }

    const billedRentalIds = items.filter((it) => it.type === "rental").map((it) => it.ref_id);
    if (billedRentalIds.length > 0) {
      const { error: upRentErr } = await supabase
        .from("farm_rentals")
        .update({ last_billed_at: nowIso })
        .in("id", billedRentalIds);
      if (upRentErr) throw upRentErr;
    }

    // Record transaction
    const { error: txErr } = await supabase.from("transactions").insert({
      farm_id: farm.id,
      transaction_type: "daily_billing",
      amount: -total,
      description: `Thanh toán ngay ${items.length} mục (gói & thuê chuồng)`,
    });
    if (txErr) throw txErr;

    // Send notification with a valid type = 'custom'
    const message = `Đã thanh toán ${total.toLocaleString("vi-VN")} VND. Số dư còn lại: ${balanceAfter.toLocaleString("vi-VN")} VND.`;
    const { error: notifErr } = await supabase.from("notifications").insert({
      user_id,
      title: "Thanh toán thành công",
      content: message,
      type: "custom", // was "success" -> violates notifications_type_check
      send_email: false,
      status: "sent",
      metadata: { daily_billing: true, invoice_id: invoice.id },
    });
    if (notifErr) throw notifErr;

    return new Response(
      JSON.stringify({ success: true, invoice_id: invoice.id, total, balance_before: balanceBefore, balance_after: balanceAfter }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("daily-billing-pay error:", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
