import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, Pencil, History, X, Copy, Upload, Download } from "lucide-react";

interface ProfileRow {
  id: string;
  username?: string | null;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  created_at: string;
  uncollected_egg: number;
}

interface AdjustmentRow {
  id: string;
  user_id: string;
  admin_id: string;
  before_value: number;
  change_amount: number;
  after_value: number;
  reason: string | null;
  created_at: string;
}

function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function AdminEggsManager() {
  const { user, userRole } = useAuth();
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const dUserId = useDebounced(userId);
  const dUsername = useDebounced(username);

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: "uncollected_egg" | "created_at"; dir: "asc" | "desc" }>({ key: "created_at", dir: "desc" });
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Modal state
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ProfileRow | null>(null);
  const [mode, setMode] = useState<"set" | "add" | "subtract">("set");
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<AdjustmentRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    document.title = "Trứng tồn - Admin";
    // Meta description for SEO
    const desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = "Quản lý trứng tồn (uncollected egg) cho người dùng - Admin";
      document.head.appendChild(m);
    } else {
      desc.setAttribute("content", "Quản lý trứng tồn (uncollected egg) cho người dùng - Admin");
    }
  }, []);

  const canAccess = user && (userRole === "admin" || userRole === "super_admin");

  const fetchUsers = async () => {
    if (!canAccess) return;
    setLoading(true);
    try {
      let query = (supabase as any)
        .from("profiles")
        .select("id, username, full_name, email, avatar_url, created_at, uncollected_egg", { count: "exact" });

      if (dUserId) query = query.eq("id", dUserId.trim());
      if (dUsername) query = query.ilike("username", `%${dUsername.trim()}%`);

      query = query.order(sort.key, { ascending: sort.dir === "asc" })
                   .range(page * pageSize, page * pageSize + pageSize - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      setRows(data || []);
      setTotal(count || 0);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Lỗi tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dUserId, dUsername, page, sort.key, sort.dir]);

  const openEdit = (row: ProfileRow) => {
    setCurrent(row);
    setMode("set");
    setAmount(String(row.uncollected_egg));
    setReason("");
    setOpen(true);
  };

  const calculateAfter = () => {
    const num = parseInt(amount, 10);
    const before = current?.uncollected_egg ?? 0;
    if (Number.isNaN(num)) return before;
    if (mode === "set") return num;
    if (mode === "add") return before + num;
    return before - num;
  };

  const handleConfirm = async () => {
    if (!current) return;
    const parsed = parseInt(amount, 10);
    if (Number.isNaN(parsed)) {
      toast.error("Giá trị phải là số nguyên");
      return;
    }

    const after = calculateAfter();
    if (after < 0) {
      toast.error("Giá trị sau điều chỉnh không được âm");
      return;
    }

    setSaving(true);
    try {
      const payload: any = { p_user_id: current.id, p_mode: mode, p_reason: reason || null };
      if (mode === "set") payload.p_set_value = parsed; else payload.p_amount = parsed;

      const { data, error } = await (supabase as any).rpc("adjust_uncollected_egg", payload);
      if (error) throw error;

      const after_value = (data as any)?.after_value ?? after;
      // optimistic update
      setRows(prev => prev.map(r => r.id === current.id ? { ...r, uncollected_egg: after_value } : r));
      toast.success(`Đã cập nhật trứng tồn cho ${current.username || current.full_name || current.id} từ ${current.uncollected_egg} → ${after_value}`);
      setOpen(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async (userId: string) => {
    setHistoryLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("egg_adjustments")
        .select("id, user_id, admin_id, before_value, change_amount, after_value, reason, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      setHistory(data || []);
      setHistoryOpen(true);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Không tải được lịch sử");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Bulk editing (simple variant)
  const [bulkIds, setBulkIds] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [bulkMode, setBulkMode] = useState<"set" | "add" | "subtract">("add");
  const [bulkValue, setBulkValue] = useState("0");
  const [bulkReason, setBulkReason] = useState("");
  const [bulkRunning, setBulkRunning] = useState(false);
  const bulkList = useMemo(() => bulkIds.split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 500), [bulkIds]);

  const handleCsv = async (file: File) => {
    const text = await file.text();
    // very simple parser: get first column as user_id
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const ids: string[] = [];
    for (const line of lines) {
      const [id] = line.split(/,|;|\t/);
      if (id) ids.push(id.trim());
      if (ids.length >= 500) break;
    }
    setBulkIds(ids.join("\n"));
    toast.info(`Đã nạp ${ids.length} ID từ CSV`);
  };

  const runBulk = async () => {
    const val = parseInt(bulkValue, 10);
    if (Number.isNaN(val)) {
      toast.error("Giá trị phải là số nguyên");
      return;
    }
    if (bulkList.length === 0) {
      toast.error("Danh sách trống");
      return;
    }

    setBulkRunning(true);
    let ok = 0, fail = 0;
    for (const id of bulkList) {
      try {
        const payload: any = { p_user_id: id, p_mode: bulkMode, p_reason: bulkReason || null };
        if (bulkMode === "set") payload.p_set_value = val; else payload.p_amount = val;
        const { error } = await (supabase as any).rpc("adjust_uncollected_egg", payload);
        if (error) throw error;
        ok++;
      } catch {
        fail++;
      }
    }
    toast.success(`Hoàn tất: ${ok} thành công, ${fail} thất bại`);
    setBulkRunning(false);
    fetchUsers();
  };

  const [histRows, setHistRows] = useState<AdjustmentRow[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histPage, setHistPage] = useState(0);
  const [histKeyword, setHistKeyword] = useState("");
  const [histFrom, setHistFrom] = useState("");
  const [histTo, setHistTo] = useState("");

  const loadSystemHistory = async () => {
    if (!canAccess) return;
    setHistLoading(true);
    try {
      let query = (supabase as any)
        .from("egg_adjustments")
        .select("id, user_id, admin_id, before_value, change_amount, after_value, reason, created_at")
        .order("created_at", { ascending: false })
        .range(histPage * pageSize, histPage * pageSize + pageSize - 1);

      if (histFrom) query = query.gte("created_at", histFrom);
      if (histTo) query = query.lte("created_at", histTo);
      // keyword filter will be client-side after resolving names (to keep query simple)
      const { data, error } = await query;
      if (error) throw error;
      setHistRows(data || []);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Không tải được lịch sử hệ thống");
    } finally {
      setHistLoading(false);
    }
  };

  useEffect(() => {
    loadSystemHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [histPage, histFrom, histTo]);

  const exportCsv = () => {
    const header = ["time","user_id","admin_id","before","change","after","reason"];
    const lines = histRows.map(r => [r.created_at, r.user_id, r.admin_id, r.before_value, r.change_amount, r.after_value, (r.reason||"").replace(/\n/g," ")].join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `egg_adjustments_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã sao chép ID");
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  if (!canAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bạn không có quyền truy cập</CardTitle>
        </CardHeader>
        <CardContent>
          Chỉ tài khoản admin mới có thể sử dụng mục này.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Trứng tồn</h2>

      {/* A - Tìm kiếm */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc & Tìm kiếm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="uid">User ID</Label>
              <Input id="uid" placeholder="e.g., 6f6f6c6d-1234-5678-aaaa-bbbbccccdddd" value={userId} onChange={e=>{ setUserId(e.target.value); setPage(0); }} />
            </div>
            <div>
              <Label htmlFor="uname">Username</Label>
              <Input id="uname" placeholder="e.g., nguyenvana" value={username} onChange={e=>{ setUsername(e.target.value); setPage(0); }} />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={fetchUsers} disabled={loading}>
                <Search className="w-4 h-4 mr-2" /> Tìm
              </Button>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Sắp xếp:</span>
              <Button variant="outline" size="sm" onClick={()=> setSort(s=>({ key:"uncollected_egg", dir: s.dir === "asc" ? "desc" : "asc"}))}>Trứng tồn</Button>
              <Button variant="outline" size="sm" onClick={()=> setSort(s=>({ key:"created_at", dir: s.dir === "asc" ? "desc" : "asc"}))}>Ngày tạo</Button>
            </div>
          </div>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avatar</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>uncollectedEgg</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt={r.username || r.full_name || r.id} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">👤</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs">{r.id}</code>
                        <Button variant="outline" size="icon" onClick={()=>copy(r.id)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{r.username || "—"}</TableCell>
                    <TableCell>{r.email || "—"}</TableCell>
                    <TableCell><Badge>{r.uncollected_egg}</Badge></TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleString("vi-VN")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={()=>openEdit(r)}>
                          <Pencil className="w-4 h-4 mr-1"/> Chỉnh sửa
                        </Button>
                        <Button variant="outline" size="sm" onClick={()=>loadHistory(r.id)}>
                          <History className="w-4 h-4 mr-1"/> Lịch sử
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">Không có dữ liệu</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-3 text-sm">
              <div>Tổng: {total}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>Trước</Button>
                <span>Trang {page+1}</span>
                <Button variant="outline" size="sm" disabled={(page+1)*pageSize>=total} onClick={()=>setPage(p=>p+1)}>Sau</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* C - Chỉnh sửa hàng loạt (nhẹ) */}
      <Card>
        <CardHeader>
          <CardTitle>Chỉnh sửa hàng loạt (tối đa 500 ID)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label>Danh sách User ID (mỗi dòng 1 ID)</Label>
              <Textarea value={bulkIds} onChange={e=>setBulkIds(e.target.value)} rows={6} placeholder="uuid-1\nuuid-2" />
            </div>
            <div className="space-y-2">
              <Label>CSV (user_id, ...)</Label>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if (f) handleCsv(f); }} />
              <Button variant="outline" onClick={()=>fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2"/> Tải CSV
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={bulkMode==='add'? 'default':'outline'} onClick={()=>setBulkMode('add')}>Cộng</Button>
                <Button variant={bulkMode==='subtract'? 'default':'outline'} onClick={()=>setBulkMode('subtract')}>Trừ</Button>
                <Button className="col-span-2" variant={bulkMode==='set'? 'default':'outline'} onClick={()=>setBulkMode('set')}>Đặt về giá trị</Button>
              </div>
              <Label className="mt-2">Giá trị</Label>
              <Input value={bulkValue} onChange={e=>setBulkValue(e.target.value)} />
              <Label className="mt-2">Reason (tùy chọn)</Label>
              <Textarea rows={3} value={bulkReason} onChange={e=>setBulkReason(e.target.value)} />
              <Button onClick={runBulk} disabled={bulkRunning}>
                {bulkRunning && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                Áp dụng cho {bulkList.length} ID
              </Button>
            </div>
            <div>
              <Label>Preview</Label>
              <div className="text-sm bg-muted rounded-md p-3 h-[180px] overflow-auto">
                {bulkList.slice(0,5).map((id,i)=> <div key={i}>{id}</div>)}
                {bulkList.length>5 && <div className="text-muted-foreground">... {bulkList.length-5} dòng nữa</div>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* D - Lịch sử toàn hệ thống */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử điều chỉnh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label>Từ ngày</Label>
              <Input type="datetime-local" value={histFrom} onChange={e=>{ setHistFrom(e.target.value); setHistPage(0); }} />
            </div>
            <div>
              <Label>Đến ngày</Label>
              <Input type="datetime-local" value={histTo} onChange={e=>{ setHistTo(e.target.value); setHistPage(0); }} />
            </div>
            <div className="md:col-span-2">
              <Label>Từ khóa (lọc client-side)</Label>
              <Input value={histKeyword} onChange={e=>setHistKeyword(e.target.value)} placeholder="username/id" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">Hiển thị {histRows.length} bản ghi</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-2"/>Xuất CSV</Button>
              <Button variant="outline" onClick={loadSystemHistory}><Search className="w-4 h-4 mr-2"/>Làm mới</Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Thay đổi</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {histRows
                .filter(r => !histKeyword || r.user_id.includes(histKeyword) || r.admin_id.includes(histKeyword))
                .map(r => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.created_at).toLocaleString("vi-VN")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs">{r.email}</code>
                      <Button variant="outline" size="icon" onClick={()=>copy(r.email)}><Copy className="w-4 h-4"/></Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs">{r.admin_id}</code>
                      <Button variant="outline" size="icon" onClick={()=>copy(r.admin_id)}><Copy className="w-4 h-4"/></Button>
                    </div>
                  </TableCell>
                  <TableCell>{r.before_value} → {r.change_amount >= 0 ? `+${r.change_amount}` : r.change_amount} → {r.after_value}</TableCell>
                  <TableCell className="max-w-[320px] truncate" title={r.reason || ''}>{r.reason || "—"}</TableCell>
                </TableRow>
              ))}
              {histRows.length === 0 && !histLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Không có dữ liệu</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center mt-3 text-sm">
            <div></div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={histPage===0} onClick={()=>setHistPage(p=>Math.max(0,p-1))}>Trước</Button>
              <span>Trang {histPage+1}</span>
              <Button variant="outline" size="sm" onClick={()=>setHistPage(p=>p+1)}>Sau</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal chỉnh sửa */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Điều chỉnh trứng tồn</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">User: {current.username || current.full_name || current.id}</div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Chế độ</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={mode==='set'?'default':'outline'} onClick={()=>setMode('set')}>Đặt</Button>
                    <Button variant={mode==='add'?'default':'outline'} onClick={()=>setMode('add')}>Cộng</Button>
                    <Button variant={mode==='subtract'?'default':'outline'} onClick={()=>setMode('subtract')}>Trừ</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Giá trị</Label>
                    <Input value={amount} onChange={e=>setAmount(e.target.value)} />
                  </div>
                  <div>
                    <Label>Hiệu lực sau điều chỉnh</Label>
                    <Input value={String(calculateAfter())} readOnly />
                  </div>
                </div>
              </div>
              <div>
                <Label>Lý do (tuỳ chọn)</Label>
                <Textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)} />
              </div>
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={()=>current && loadHistory(current.id)}>
                  <History className="w-4 h-4 mr-2"/> Xem lịch sử
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={()=>setOpen(false)}><X className="w-4 h-4 mr-1"/>Huỷ</Button>
                  <Button onClick={handleConfirm} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}Xác nhận</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal lịch sử người dùng */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lịch sử điều chỉnh (10 gần nhất)</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {historyLoading ? (
              <div className="flex items-center gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin"/> Đang tải...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trước</TableHead>
                    <TableHead>Thay đổi</TableHead>
                    <TableHead>Sau</TableHead>
                    <TableHead>Lý do</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(h => (
                    <TableRow key={h.id}>
                      <TableCell>{new Date(h.created_at).toLocaleString('vi-VN')}</TableCell>
                      <TableCell>{h.before_value}</TableCell>
                      <TableCell>{h.change_amount >= 0 ? `+${h.change_amount}` : h.change_amount}</TableCell>
                      <TableCell>{h.after_value}</TableCell>
                      <TableCell className="max-w-[280px] truncate" title={h.reason || ''}>{h.reason || '—'}</TableCell>
                    </TableRow>
                  ))
                  }
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">Không có dữ liệu</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
