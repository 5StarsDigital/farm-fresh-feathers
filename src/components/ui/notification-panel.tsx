import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { linkifyText } from "@/lib/linkify";
interface NotificationRow {
  id: string;
  title: string;
  content: string;
  type: "balance_change" | "monthly_billing" | "package_expiry" | "custom" | string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
}

// Ẩn nội dung text URL đính kèm đã được chèn thêm vào cuối content (phục vụ email)
function stripAppended(text: string, hasMetadataReason?: boolean) {
  if (!text) return text;
  let result = text;
  // Xóa phần bắt đầu từ "Tệp đính kèm:" hoặc "Liên kết:" đến hết chuỗi
  result = result.replace(/\n?\s*Tệp đính kèm:\s*[\s\S]*$/i, "").replace(/\n?\s*Liên kết:\s*[\s\S]*$/i, "");
  // Nếu có metadata.reason thì xóa phần "Lý do: ..." trong content để tránh trùng lặp
  if (hasMetadataReason) {
    result = result.replace(/\n?\s*Lý do:\s*[^\n]*$/i, "");
  }
  return result.trim();
}

// Format thông báo biến động số dư với màu sắc
function formatBalanceChangeNotification(content: string) {
  if (!content.includes("Số dư thay đổi từ")) return content;
  
  // Regex để tìm format: "Số dư thay đổi từ [số cũ] thành [số mới]"
  const balanceRegex = /Số dư thay đổi từ ([\d,\.]+)đ thành ([\d,\.]+)đ/g;
  
  return content.replace(balanceRegex, (match, oldAmount, newAmount) => {
    const oldValue = parseFloat(oldAmount.replace(/[,\.]/g, ''));
    const newValue = parseFloat(newAmount.replace(/[,\.]/g, ''));
    const isIncrease = newValue > oldValue;
    
    const amountColor = isIncrease ? 'text-green-700 font-bold' : 'text-red-700 font-bold';
    
    return `Số dư thay đổi từ <span class="${amountColor}">${oldAmount}đ</span> thành <span class="${amountColor}">${newAmount}đ</span>`;
  });
}
// Helper: tạo khóa chuẩn hóa để loại trùng theo nội dung + thời điểm (độ chính xác đến giây)
function notificationKey(n: NotificationRow) {
  const timeKey = new Date(n.created_at).toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  const content = stripAppended(n.content || "", !!n.metadata?.reason).replace(/\s+/g, " ").trim();
  const title = (n.title || "").trim();
  const type = (n.type || "").toString();
  return `${type}|${title}|${content}|${timeKey}`;
}

function dedupeNotifications(list: NotificationRow[]) {
  const map = new Map<string, NotificationRow>();
  for (const n of list) {
    const key = notificationKey(n);
    if (!map.has(key)) {
      map.set(key, n);
    } else {
      const existing = map.get(key)!;
      // Giữ bản mới hơn; đồng thời hợp nhất trạng thái đã đọc để không bị đánh dấu chưa đọc lại
      const pick = new Date(n.created_at).getTime() > new Date(existing.created_at).getTime() ? n : existing;
      const merged = { ...pick, is_read: existing.is_read && n.is_read };
      map.set(key, merged);
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function NotificationPanel() {
  const {
    user
  } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<NotificationRow | null>(null);
  // Viewer for attachments
  const [mediaOpen, setMediaOpen] = useState(false);
  const [media, setMedia] = useState<{
    url: string;
    type: 'image' | 'video';
  } | null>(null);
  const unreadCount = useMemo(() => items.filter(n => !n.is_read).length, [items]);
  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const {
        data,
        error
      } = await (supabase as any).from("notifications").select("id,title,content,type,is_read,created_at,metadata").eq("user_id", user.id).neq("status", "revoked").order("created_at", {
        ascending: false
      }).limit(50);
      if (error) throw error;
      
      // Deduplicate theo id và theo nội dung + thời điểm (phòng khi backend chèn 2 bản ghi khác id)
      const uniqueById = data ? Array.from(new Map(data.map((item: NotificationRow) => [item.id, item])).values()) as NotificationRow[] : [];
      const deduped = dedupeNotifications(uniqueById);
      setItems(deduped);
    } catch (err) {
      console.error("Load notifications error:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open]);
  useEffect(() => {
    if (!user) return;
    // Periodic refresh
    const id = setInterval(fetchNotifications, 30000);
    return () => clearInterval(id);
  }, [user?.id]);

  // Realtime updates for instant reflection of edits/revokes (with debounce)
  useEffect(() => {
    if (!user) return;
    
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    
    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        fetchNotifications();
      }, 300); // Wait 300ms before fetching to avoid rapid successive calls
    };
    
    const channel = (supabase as any).channel('notifications').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, () => {
      debouncedFetch();
    }).subscribe();
    
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      (supabase as any).removeChannel(channel);
    };
  }, [user?.id]);
  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setItems(prev => prev.map(n => n.id === id ? {
        ...n,
        is_read: true
      } : n));
      const {
        error
      } = await (supabase as any).from("notifications").update({
        is_read: true,
        read_at: new Date().toISOString()
      }).eq("id", id);
      if (error) throw error;
    } catch (err) {
      console.warn("Mark read failed, rollback", err);
      // Rollback
      setItems(prev => prev.map(n => n.id === id ? {
        ...n,
        is_read: false
      } : n));
    }
  };
  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    const unreadIds = items.filter(n => !n.is_read).map(n => n.id);
    // Optimistic
    setItems(prev => prev.map(n => ({
      ...n,
      is_read: true
    })));
    try {
      const {
        error
      } = await (supabase as any).from("notifications").update({
        is_read: true,
        read_at: new Date().toISOString()
      }).in("id", unreadIds);
      if (error) throw error;
    } catch (err) {
      console.error("Mark all read failed", err);
      // Reload from server
      fetchNotifications();
    }
  };
  const renderItem = (n: NotificationRow) => <button key={n.id} onClick={() => {
    setSelected(n);
    setDetailOpen(true);
    setOpen(false);
    if (!n.is_read) markAsRead(n.id);
  }} className={cn("w-full text-left rounded-md px-3 py-2 border border-border/60 hover:bg-muted transition", !n.is_read ? "bg-accent/20" : "bg-card")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">{n.title}</div>
          <div className="text-sm text-muted-foreground line-clamp-2 break-words" dangerouslySetInnerHTML={{
            __html: linkifyText(formatBalanceChangeNotification(stripAppended(n.content, !!n.metadata?.reason)))
          }} />
        </div>
        {!n.is_read && <span className="mt-0.5 inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden />}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {new Date(n.created_at).toLocaleString("vi-VN")}
      </div>
    </button>;
  return <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[5px] rounded-full bg-primary text-primary-foreground text-[10px] leading-[18px] text-center" aria-label={`${unreadCount} thông báo chưa đọc`}>
                {unreadCount}
              </span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0 bg-popover text-popover-foreground border border-border shadow-lg" align="end">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="font-semibold">Thông báo</div>
            <Button variant="secondary" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
              Đánh dấu đã đọc
            </Button>
          </div>
          <div className="max-h-96 overflow-auto p-3 space-y-2">
            {loading ? <div className="text-sm text-muted-foreground">Đang tải...</div> : items.length === 0 ? <div className="text-sm text-muted-foreground">Chưa có thông báo</div> : items.map(renderItem)}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected ? new Date(selected.created_at).toLocaleString("vi-VN") : ""}
            </DialogDescription>
          </DialogHeader>
        <div className="whitespace-pre-line text-sm leading-relaxed text-foreground space-y-3">
  <div dangerouslySetInnerHTML={{
    __html: selected ? linkifyText(formatBalanceChangeNotification(stripAppended(selected.content, !!selected.metadata?.reason))) : ""
  }} />
  {selected?.metadata?.reason && (
    <div className="p-3 bg-muted rounded-lg border border-border">
      <div className="text-sm font-medium text-foreground mb-1">Lý do:</div>
      <div className="text-sm text-muted-foreground">{selected.metadata.reason}</div>
    </div>
  )}
  {selected?.metadata?.attachments?.length ? <div className="space-y-2">
      
      <div className="grid grid-cols-2 gap-2">
              {selected.metadata.attachments.map((a: any, i: number) => a.type === 'image' ? <button key={i} type="button" onClick={() => {
                setMedia({
                  url: a.url,
                  type: 'image'
                });
                setMediaOpen(true);
              }} className="block focus:outline-none" title="Nhấn để mở lớn">
      <img src={a.url} alt={`Ảnh đính kèm ${i + 1}`} loading="lazy" className="w-full h-32 object-cover rounded border border-border cursor-zoom-in" />
    </button> : <button key={i} type="button" onClick={() => {
                setMedia({
                  url: a.url,
                  type: 'video'
                });
                setMediaOpen(true);
              }} className="block focus:outline-none" title="Nhấn để mở lớn">
      <video src={a.url} className="w-full h-32 rounded border border-border object-cover cursor-zoom-in" />
    </button>)}
      </div>
    </div> : null}
  {selected?.metadata?.links?.length ? <div className="space-y-1">
      <div className="text-sm font-medium">Liên kết</div>
      <ul className="list-disc pl-5 text-sm">
        {selected.metadata.links.map((l: string, i: number) => <li key={i}><a href={l} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{l}</a></li>)}
      </ul>
    </div> : null}
        </div>
        <DialogFooter>
  <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mediaOpen} onOpenChange={setMediaOpen}>
        <DialogContent className="sm:max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Xem tệp đính kèm</DialogTitle>
          </DialogHeader>
          {media?.type === 'image' ? <img src={media.url} alt="Xem tệp đính kèm" className="max-h-[80vh] w-auto mx-auto rounded border border-border" loading="eager" /> : media?.type === 'video' ? <video src={media.url} controls className="w-full max-h-[80vh] rounded border border-border" /> : null}
        </DialogContent>
      </Dialog>
    </>;
}