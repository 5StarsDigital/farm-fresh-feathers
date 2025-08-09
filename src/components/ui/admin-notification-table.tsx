import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Profile { id: string; full_name: string | null; email: string | null }
interface NotificationRow { id: string; title: string; content: string; user_id: string; created_at: string; status: string; send_email: boolean; type: string }

export default function AdminNotificationTable() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [list, setList] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'balance_change'|'monthly_billing'|'package_expiry'|'custom'>('custom');
  const [sendEmail, setSendEmail] = useState(true);

  const loadProfiles = async () => {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('id,full_name,email')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error) setProfiles(data || []);
  };

  const loadNotifications = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('notifications')
      .select('id,title,content,user_id,created_at,status,send_email,type')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error) setList(data || []);
    setLoading(false);
  };

  useEffect(() => { loadProfiles(); loadNotifications(); }, []);

  const selectedProfiles = useMemo(() => profiles.filter(p => selected.includes(p.id)), [selected, profiles]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const send = async () => {
    if (!title || !content || selected.length === 0) return;
    const { data: session } = await (supabase as any).auth.getSession();
    const token = session?.session?.access_token;
    try {
      const res = await fetch(`${(supabase as any).url}/functions/v1/send-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content, type, user_ids: selected, send_email: sendEmail })
      });
      if (!res.ok) throw new Error(await res.text());
      setTitle(''); setContent(''); setSelected([]);
      await loadNotifications();
    } catch (e) {
      console.error('Send notification failed', e);
      alert('Gửi thông báo thất bại');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Quản lý thông báo</h1>
        <p className="text-muted-foreground">Tạo và gửi thông báo cho người dùng. Chọn gửi qua email nếu cần.</p>
      </header>

      <section className="grid md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
          <div>
            <label className="text-sm font-medium">Tiêu đề</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề" />
          </div>
          <div>
            <label className="text-sm font-medium">Nội dung</label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nhập nội dung" rows={6} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Loại</label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance_change">Biến động số dư</SelectItem>
                  <SelectItem value="monthly_billing">Nộp tiền hàng tháng</SelectItem>
                  <SelectItem value="package_expiry">Gói sắp hết hạn</SelectItem>
                  <SelectItem value="custom">Đặc biệt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Checkbox id="sendEmail" checked={sendEmail} onCheckedChange={(v) => setSendEmail(!!v)} />
              <label htmlFor="sendEmail" className="text-sm">Gửi qua email</label>
            </div>
          </div>
          <Button onClick={send} disabled={!title || !content || selected.length === 0}>Gửi thông báo</Button>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card max-h-[420px] overflow-auto">
          <div className="font-medium mb-2">Chọn người nhận</div>
          <div className="space-y-2">
            {profiles.map(p => (
              <button key={p.id} onClick={() => toggleSelect(p.id)} className={`w-full flex items-center justify-between px-3 py-2 rounded border ${selected.includes(p.id) ? 'bg-accent/20 border-accent' : 'border-border'} text-left`}>
                <div>
                  <div className="text-sm font-medium">{p.full_name || p.email || p.id}</div>
                  <div className="text-xs text-muted-foreground">{p.email}</div>
                </div>
                {selected.includes(p.id) && <Badge>Đã chọn</Badge>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="font-semibold">Lịch sử thông báo</div>
        <div className="grid gap-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Đang tải...</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-muted-foreground">Chưa có thông báo</div>
          ) : (
            list.map(row => (
              <div key={row.id} className="grid grid-cols-12 gap-3 items-center px-3 py-2 rounded border border-border bg-background/50">
                <div className="col-span-3 text-sm font-medium truncate">{row.title}</div>
                <div className="col-span-4 text-sm truncate" title={row.content}>{row.content}</div>
                <div className="col-span-2 text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString('vi-VN')}</div>
                <div className="col-span-1 text-xs">{row.send_email ? 'Email' : 'Web'}</div>
                <div className="col-span-2">
                  <Badge variant={row.status === 'sent' ? 'default' : row.status === 'pending' ? 'secondary' : 'destructive'}>
                    {row.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
