// Supabase Edge Function: process-monthly-billing
// Tính phí định kỳ theo BillingDate do admin cấu hình
// - Tính riêng từng gói: cost = daily_price * selected_chicken_quantity * days_used (days_used capped 30)
// - Ghi bản ghi vào monthly_bills cho từng gói
// - Cộng tổng theo farm và trừ một lần vào farms.account_balance
// - Cập nhật last_billing_date trên service_packages
// - Tùy chọn body: { force?: boolean, dryRun?: boolean }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helpers
function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(a: Date, b: Date) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utc2 - utc1) / MS_PER_DAY);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { force = false, dryRun = false } = (await req.json().catch(() => ({}))) as {
      force?: boolean;
      dryRun?: boolean;
    };

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment config" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1) Lấy BillingDate
    const { data: billingData, error: billingErr } = await anon
      .from("billing_settings")
      .select("monthly_billing_date")
      .maybeSingle();

    if (billingErr) throw billingErr;

    const billingDate = billingData?.monthly_billing_date ?? 1; // default 1 nếu chưa cấu hình

    const today = startOfDay(new Date());
    const todayDOM = today.getDate();

    if (!force && todayDOM !== billingDate) {
      return new Response(
        JSON.stringify({
          success: false,
          reason: "Not billing day",
          billingDate,
          todayDOM,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2) Lấy danh sách gói đang active
    const { data: packages, error: pkgErr } = await service
      .from("service_packages")
      .select(
        "id, package_id, package_name, user_id, farm_id, status, selected_chicken_quantity, service_start_date, purchased_at, last_billing_date"
      )
      .eq("status", "active");

    if (pkgErr) throw pkgErr;

    if (!packages || packages.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active packages to bill" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3) Lấy daily_price cho các package_id liên quan
    const uniquePackageIds = Array.from(new Set(packages.map((p) => p.package_id).filter(Boolean)));

    let packagePriceMap = new Map<string, number>();
    if (uniquePackageIds.length > 0) {
      const { data: priceRows, error: priceErr } = await anon
        .from("package_prices")
        .select("package_id, daily_price, is_active")
        .in("package_id", uniquePackageIds);

      if (priceErr) throw priceErr;

      for (const row of priceRows ?? []) {
        // ưu tiên lấy cả khi không active? theo yêu cầu là daily price hiện hành
        // Ở đây vẫn lấy hàng đầu tiên theo package_id
        if (typeof row.daily_price === "number") {
          packagePriceMap.set(row.package_id, Number(row.daily_price));
        }
      }
    }

    // 4) Duyệt từng gói => tính chi phí, tạo monthly_bills theo gói
    type BillRow = {
      farm_id: string;
      package_id: string;
      package_name: string;
      daily_price: number;
      chicken_qty: number;
      days_used: number;
      amount: number;
      billing_period_start: string; // YYYY-MM-DD
      billing_period_end: string;   // YYYY-MM-DD
      service_package_id: string;   // id của service_packages
    };

    const bills: BillRow[] = [];
    const perFarmTotals = new Map<string, number>();

    for (const pkg of packages) {
      const pkgId: string = pkg.id;
      const farmId: string = pkg.farm_id;
      const packageCode: string = pkg.package_id;
      const packageName: string = pkg.package_name ?? "Gói dịch vụ";
      const chickenQty: number = Number(pkg.selected_chicken_quantity ?? 0);

      if (!farmId || !packageCode || chickenQty <= 0) {
        continue; // bỏ qua gói không hợp lệ
      }

      const dailyPrice = packagePriceMap.get(packageCode);
      if (typeof dailyPrice !== "number") {
        // Không tìm thấy daily_price => bỏ qua, tránh tính sai
        continue;
      }

      // Xác định period start từ last_billing_date -> service_start_date -> purchased_at -> today
      const startDateRaw = pkg.last_billing_date || pkg.service_start_date || pkg.purchased_at;
      const startDate = startDateRaw ? startOfDay(new Date(startDateRaw)) : startOfDay(new Date());

      // Nếu đã chốt trong ngày (last_billing_date >= today) => skip để tránh double charge
      if (pkg.last_billing_date) {
        const last = startOfDay(new Date(pkg.last_billing_date));
        if (diffDays(last, today) <= 0) {
          continue;
        }
      }

      let daysUsed = Math.max(0, diffDays(startDate, today));
      daysUsed = Math.min(daysUsed, 30); // cap 30 ngày
      if (daysUsed <= 0) continue;

      const amount = Number(dailyPrice) * chickenQty * daysUsed;

      const bill: BillRow = {
        farm_id: farmId,
        package_id: packageCode,
        package_name: packageName,
        daily_price: Number(dailyPrice),
        chicken_qty: chickenQty,
        days_used: daysUsed,
        amount,
        billing_period_start: startDate.toISOString().slice(0, 10),
        billing_period_end: today.toISOString().slice(0, 10),
        service_package_id: pkgId,
      };

      bills.push(bill);
      perFarmTotals.set(farmId, Number((perFarmTotals.get(farmId) ?? 0)) + amount);
    }

    if (bills.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No packages require billing today" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun: true,
          billingDate,
          todayDOM,
          bills,
          perFarmTotals: Array.from(perFarmTotals.entries()).map(([farm_id, total]) => ({ farm_id, total })),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5) Ghi monthly_bills (insert từng gói)
    // Lưu ý: chèn theo batches để tránh payload quá lớn. Ở đây làm đơn giản theo nhóm 50.
    const chunkSize = 50;
    for (let i = 0; i < bills.length; i += chunkSize) {
      const chunk = bills.slice(i, i + chunkSize);
      const insertRows = chunk.map((b) => ({
        farm_id: b.farm_id,
        package_id: b.package_id,
        package_name: b.package_name,
        daily_price: b.daily_price,
        chicken_quantity: b.chicken_qty,
        days_in_period: b.days_used,
        total_amount: b.amount,
        billing_period_start: b.billing_period_start,
        billing_period_end: b.billing_period_end,
        status: "pending", // có thể thêm logic paid/success nếu cần
      }));

      const { error: insertErr } = await service.from("monthly_bills").insert(insertRows);
      if (insertErr) throw insertErr;
    }

    // 6) Trừ tổng vào số dư theo từng farm và ghi transactions
    for (const [farm_id, total] of perFarmTotals.entries()) {

      const { data: farmRow, error: farmErr } = await service
        .from("farms")
        .select("account_balance")
        .eq("id", farm_id)
        .single();
      if (farmErr) throw farmErr;

      const currentBalance = Number(farmRow?.account_balance ?? 0);
      const newBalance = currentBalance - Number(total);

      const { error: setErr } = await service
        .from("farms")
        .update({ account_balance: newBalance })
        .eq("id", farm_id);
      if (setErr) throw setErr;

      // Ghi transaction tổng hợp
      const { error: txErr } = await service.from("transactions").insert({
        farm_id,
        transaction_type: "monthly_billing",
        amount: -Number(total),
        description: `Thanh toán gói dịch vụ đến ${today.toISOString().slice(0, 10)} (tổng hợp)`,
      });
      if (txErr) throw txErr;
    }

    // 7) Cập nhật last_billing_date cho các gói đã tính
    const pkgIdsToUpdate = Array.from(new Set(bills.map((b) => b.service_package_id)));
    for (let i = 0; i < pkgIdsToUpdate.length; i += 100) {
      const chunk = pkgIdsToUpdate.slice(i, i + 100);
      const { error: updPkgErr } = await service
        .from("service_packages")
        .update({ last_billing_date: today.toISOString().slice(0, 10) })
        .in("id", chunk);
      if (updPkgErr) throw updPkgErr;
    }

    const totalBilled = bills.reduce((sum, b) => sum + b.amount, 0);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Monthly billing processed",
        packages_billed: bills.length,
        farms_charged: perFarmTotals.size,
        total_billed: totalBilled,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-monthly-billing error:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
