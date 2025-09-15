import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Play, Bell, BellOff } from "lucide-react";

// New daily billing types matching edge function
interface BillingItem {
  type: "package" | "rental";
  ref_id: string;
  name: string;
  daily_price: number;
  quantity: number;
  days_elapsed: number;
  amount: number;
}

interface UserBillingRow {
  user_id: string;
  farm_id: string | null;
  email: string | null;
  full_name: string | null;
  balance: number;
  items: BillingItem[];
  total_amount: number;
}

export const BillingSettings = () => {
  const [rows, setRows] = useState<UserBillingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingUserId, setPayingUserId] = useState<string | null>(null);
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyInvoices, setHistoryInvoices] = useState<any[]>([]);
  const [balanceCheckEnabled, setBalanceCheckEnabled] = useState(false);
  const [balanceCheckLoading, setBalanceCheckLoading] = useState(false);

  const totalOutstanding = useMemo(() => rows.reduce((s, r) => s + (r.total_amount || 0), 0), [rows]);

  useEffect(() => {
    fetchPreview();
    checkBalanceCheckStatus();
  }, []);

  const formatVND = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("daily-billing-preview", { body: {} });
      if (error) throw error;
      setRows((data?.data as UserBillingRow[]) || []);
    } catch (e: any) {
      console.error("preview error", e);
      toast.error(`Không tải được dữ liệu: ${e?.message || "Unknown"}`);
    } finally {
      setLoading(false);
    }
  };

  const payNow = async (userId: string) => {
    try {
      setPayingUserId(userId);
      const { data, error } = await supabase.functions.invoke("daily-billing-pay", { body: { user_id: userId } });
      if (error) throw error;
      toast.success("Đã thanh toán thành công");
      await fetchPreview();
    } catch (e: any) {
      console.error("pay error", e);
      toast.error(e?.message || "Không thể thanh toán");
    } finally {
      setPayingUserId(null);
    }
  };

  const openHistory = async (userId: string) => {
    try {
      setHistoryUserId(userId);
      setHistoryOpen(true);
      const { data, error } = await supabase
        .from("invoices")
        .select("id, created_at, total_amount, balance_before, balance_after, metadata")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error as any;
      setHistoryInvoices(data || []);
    } catch (e: any) {
      console.error("history error", e);
      toast.error("Không tải được lịch sử");
    }
  };

  const checkBalanceCheckStatus = async () => {
    try {
      const { data, error } = await supabase.rpc("get_insufficient_balance_check_status");
      if (error) throw error;
      setBalanceCheckEnabled(data && data.length > 0 && data[0].active);
    } catch (e: any) {
      console.error("balance check status error", e);
    }
  };

  const toggleBalanceCheck = async (enabled: boolean) => {
    try {
      setBalanceCheckLoading(true);
      const functionName = enabled ? "enable_insufficient_balance_check" : "disable_insufficient_balance_check";
      const { error } = await supabase.rpc(functionName);
      if (error) throw error;
      setBalanceCheckEnabled(enabled);
      toast.success(enabled ? "Đã bật cảnh báo số dư tự động" : "Đã tắt cảnh báo số dư tự động");
    } catch (e: any) {
      console.error("toggle balance check error", e);
      toast.error(e?.message || "Không thể thay đổi cài đặt");
    } finally {
      setBalanceCheckLoading(false);
    }
  };

  const testBalanceCheck = async () => {
    try {
      setBalanceCheckLoading(true);
      const { data, error } = await supabase.functions.invoke("check-insufficient-balance", { 
        body: { force: true } 
      });
      if (error) throw error;
      toast.success(`Đã gửi ${data.notifications_sent || 0} thông báo cảnh báo số dư`);
    } catch (e: any) {
      console.error("test balance check error", e);
      toast.error(e?.message || "Không thể test cảnh báo số dư");
    } finally {
      setBalanceCheckLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Warning Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Cảnh báo Số dư Tự động</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Cảnh báo số dư không đủ</p>
              <p className="text-sm text-muted-foreground">
                Tự động gửi thông báo cho user khi số dư không đủ thanh toán trong 2 ngày cuối tháng
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={balanceCheckEnabled}
                onCheckedChange={toggleBalanceCheck}
                disabled={balanceCheckLoading}
              />
              {balanceCheckEnabled ? (
                <Bell className="w-4 h-4 text-green-500" />
              ) : (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testBalanceCheck}
              disabled={balanceCheckLoading}
            >
              Test ngay
            </Button>
            {balanceCheckEnabled && (
              <p className="text-xs text-muted-foreground flex items-center">
                Chạy tự động vào 18:00 các ngày 28, 29, 30, 31 hàng tháng
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Billing Management */}
      <Card>
        <CardHeader>
          <CardTitle>Quản lý Thanh toán hằng ngày</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Tổng nợ hiện tại: <span className="font-semibold text-foreground">{formatVND(totalOutstanding)}</span>
          </div>
          <Button variant="outline" onClick={fetchPreview} disabled={loading} className="flex items-center gap-2">
            <Eye className="w-4 h-4" /> Làm mới
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Số dư</TableHead>
                <TableHead>Chưa thanh toán</TableHead>
                <TableHead>Chi tiết</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Đang tải...</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Không có khoản nào cần thanh toán</TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.user_id}>
                    <TableCell className="font-medium">{row.full_name || row.email || row.user_id}</TableCell>
                    <TableCell>{row.email || "-"}</TableCell>
                    <TableCell>{formatVND(Number(row.balance || 0))}</TableCell>
                    <TableCell>{formatVND(Number(row.total_amount || 0))}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {row.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <span className="text-muted-foreground">{it.name}</span>
                            <span>
                              {it.quantity > 1 ? `${it.quantity} x ` : ""}
                              {formatVND(it.daily_price)} / ngày × {it.days_elapsed} = <span className="font-medium">{formatVND(it.amount)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openHistory(row.user_id)}>
                          Lịch sử
                        </Button>
                        <Button size="sm" onClick={() => payNow(row.user_id)} disabled={payingUserId === row.user_id} className="flex items-center gap-2">
                          <Play className="w-4 h-4" /> {payingUserId === row.user_id ? "Đang thanh toán..." : "Thanh toán ngay"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* History dialog */}
      <Dialog open={historyOpen} onOpenChange={(o) => { setHistoryOpen(o); if (!o) { setHistoryInvoices([]); setHistoryUserId(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lịch sử thanh toán</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {historyInvoices.length === 0 ? (
              <div className="text-sm text-muted-foreground">Không có dữ liệu</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Số dư trước</TableHead>
                      <TableHead>Số dư sau</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{new Date(inv.created_at).toLocaleString("vi-VN")}</TableCell>
                        <TableCell>{formatVND(Number(inv.total_amount || 0))}</TableCell>
                        <TableCell>{formatVND(Number(inv.balance_before || 0))}</TableCell>
                        <TableCell>{formatVND(Number(inv.balance_after || 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </Card>
    </div>
  );
};
