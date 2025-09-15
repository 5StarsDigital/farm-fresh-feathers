import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BillingItem {
  type: "package" | "rental";
  ref_id: string;
  name: string;
  daily_price: number;
  quantity: number;
  days_elapsed: number;
  amount: number;
}

interface UserBillingData {
  user_id: string;
  farm_id: string | null;
  email: string | null;
  full_name: string | null;
  balance: number;
  items: BillingItem[];
  total_amount: number;
}

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

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function isLastTwoDaysOfMonth(): boolean {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const currentDate = today.getDate();
  
  // Get last day of current month
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  
  // Check if today is 29th, 30th, or 31st (if exists)
  return currentDate >= Math.max(29, lastDayOfMonth - 1);
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    console.log("Checking insufficient balance notifications...");

    // Only run on last two days of month unless forced
    const { force } = await req.json().catch(() => ({ force: false }));
    if (!force && !isLastTwoDaysOfMonth()) {
      console.log("Not in last 2 days of month, skipping...");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Not in last 2 days of month",
        checked: false 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch active/suspended packages
    const { data: packages, error: pkErr } = await supabase
      .from("service_packages")
      .select(
        "id, user_id, farm_id, package_id, package_name, selected_chicken_quantity, last_billed_at, last_billing_date, service_start_date, purchased_at, status"
      )
      .in("status", ["active", "suspended"]);
    if (pkErr) throw pkErr;

    // Fetch package prices
    const { data: prices, error: priceErr } = await supabase
      .from("package_prices")
      .select("package_id, daily_price, is_active");
    if (priceErr) throw priceErr;
    const priceMap = new Map<string, number>();
    (prices || []).forEach((p: any) => {
      if (p && p.package_id) priceMap.set(p.package_id, Number(p.daily_price) || 0);
    });

    // Fetch rentals
    const { data: rentals, error: rentErr } = await supabase
      .from("farm_rentals")
      .select(`
        id, user_id, farm_id, monthly_cost, created_at, last_billed_at, status,
        available_farms!farm_rentals_available_farm_id_fkey(monthly_cost)
      `)
      .in("status", ["active", "suspended"]);
    if (rentErr) throw rentErr;

    // Collect user ids
    const userIds = Array.from(
      new Set([...(packages || []).map((p: any) => p.user_id), ...(rentals || []).map((r: any) => r.user_id)])
    ).filter(Boolean);

    if (userIds.length === 0) {
      console.log("No users with active packages/rentals found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No users to check",
        notifications_sent: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch profiles and farms
    const { data: profiles } = await supabase.from("profiles").select("id, email, full_name").in("id", userIds);
    const { data: userFarms } = await supabase
      .from("farms")
      .select("id, user_id, account_balance")
      .in("user_id", userIds);

    const profileMap = new Map<string, any>();
    (profiles || []).forEach((p: any) => profileMap.set(p.id, p));
    const farmByUser = new Map<string, any>();
    (userFarms || []).forEach((f: any) => farmByUser.set(f.user_id, f));

    const today = new Date();
    const resultsByUser = new Map<string, UserBillingData>();

    // Helper to ensure row exists
    const getRow = (uid: string): UserBillingData => {
      if (!resultsByUser.has(uid)) {
        const pf = profileMap.get(uid);
        const fm = farmByUser.get(uid);
        resultsByUser.set(uid, {
          user_id: uid,
          farm_id: fm?.id || null,
          email: pf?.email || null,
          full_name: pf?.full_name || null,
          balance: Number(fm?.account_balance || 0),
          items: [],
          total_amount: 0,
        });
      }
      return resultsByUser.get(uid)!;
    };

    // Calculate billing for packages
    for (const pkg of packages || []) {
      const uid = pkg.user_id as string;
      if (!uid) continue;
      const qty = Number(pkg.selected_chicken_quantity || 0);
      const daily = Number(priceMap.get(pkg.package_id) || 0) * qty;
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
      const row = getRow(uid);
      row.items.push({
        type: "package",
        ref_id: pkg.id,
        name: pkg.package_name || "Gói dịch vụ",
        daily_price: Number(priceMap.get(pkg.package_id) || 0),
        quantity: qty,
        days_elapsed: days,
        amount,
      });
      row.total_amount += amount;
    }

    // Calculate billing for rentals
    for (const r of rentals || []) {
      const uid = r.user_id as string;
      if (!uid) continue;
      
      let monthly = Number(r.monthly_cost || 0);
      if (monthly <= 0 && r.available_farms) {
        monthly = Number(r.available_farms.monthly_cost || 0);
      }
      
      const dailyUnit = Math.round(monthly / 30);
      if (dailyUnit <= 0) continue;

      const base = r.last_billed_at ? new Date(r.last_billed_at) : new Date(r.created_at);
      const days = diffDays(today, base);
      if (days <= 0) continue;

      const amount = Math.round(dailyUnit * days);
      const row = getRow(uid);
      row.items.push({
        type: "rental",
        ref_id: r.id,
        name: "Thuê chuồng",
        daily_price: dailyUnit,
        quantity: 1,
        days_elapsed: days,
        amount,
      });
      row.total_amount += amount;
    }

    // Find users with insufficient balance
    const usersWithInsufficientBalance = Array.from(resultsByUser.values())
      .filter(row => row.total_amount > 0 && row.balance < row.total_amount);

    console.log(`Found ${usersWithInsufficientBalance.length} users with insufficient balance`);

    let notificationsSent = 0;

    // Send notifications to users with insufficient balance
    for (const user of usersWithInsufficientBalance) {
      const shortage = user.total_amount - user.balance;
      const itemDetails = user.items.map(item => 
        `${item.name}: ${formatVND(item.amount)}`
      ).join('\n');

      const content = `Số dư tài khoản của bạn không đủ để thanh toán hóa đơn tháng tới.

Chi tiết cần thanh toán:
${itemDetails}

Tổng cần thanh toán: ${formatVND(user.total_amount)}
Số dư hiện tại: ${formatVND(user.balance)}
Còn thiếu: ${formatVND(shortage)}

Vui lòng nạp thêm tiền để đảm bảo thanh toán thành công vào đầu tháng tới.`;

      try {
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: user.user_id,
            title: "Cảnh báo: Số dư không đủ thanh toán",
            content: content,
            type: "balance_warning",
            send_email: false,
            status: "sent",
            metadata: {
              required_amount: user.total_amount,
              current_balance: user.balance,
              shortage: shortage,
              billing_items: user.items
            }
          });

        if (notifError) {
          console.error(`Failed to send notification to user ${user.user_id}:`, notifError);
        } else {
          notificationsSent++;
          console.log(`Sent insufficient balance notification to user ${user.user_id}`);
        }
      } catch (err) {
        console.error(`Error sending notification to user ${user.user_id}:`, err);
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      checked: true,
      users_checked: userIds.length,
      users_with_insufficient_balance: usersWithInsufficientBalance.length,
      notifications_sent: notificationsSent,
      date: today.toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("check-insufficient-balance error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || String(error),
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});