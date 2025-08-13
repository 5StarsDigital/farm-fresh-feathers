import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, Play } from "lucide-react";

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

  const totalOutstanding = useMemo(() => rows.reduce((s, r) => s + (r.total_amount || 0), 0), [rows]);

  useEffect(() => {
    fetchPreview();
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

  return (
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
  );
};
