import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';

interface NotificationRow {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  metadata: any;
}

interface BatchItem {
  batch_id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  count: number;
}

export default function AdminNotificationsManager() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<NotificationRow[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('id,title,content,status,created_at,metadata')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      console.error('Load notifications failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const batches: BatchItem[] = useMemo(() => {
    const map = new Map<string, BatchItem & { _created_at_num: number }>();
    for (const r of rows) {
      const bid = r.metadata?.batch_id || r.id;
      const existing = map.get(bid);
      const createdNum = new Date(r.created_at).getTime();
      if (!existing || createdNum > existing._created_at_num) {
        map.set(bid, {
          batch_id: bid,
          title: r.title,
          content: r.content,
          status: r.status,
          created_at: r.created_at,
          count: 1,
          _created_at_num: createdNum,
        });
      } else {
        existing.count += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) => b._created_at_num - a._created_at_num).map(({ _created_at_num, ...rest }) => rest);
  }, [rows]);

  const sendAll = async () => {
    if (!title || !content) return;
    try {
      setLoading(true);
      const { error } = await (supabase as any).functions.invoke('admin-broadcast-notifications', {
        body: { title, content, send_email: sendEmail }
      });
      if (error) throw error;
      setTitle('');
      setContent('');
      setSendEmail(false);
      await load();
    } catch (e) {
      console.error('Send to all failed', e);
      alert('Gửi thông báo thất bại');
    } finally {
      setLoading(false);
    }
  };

  const editBatch = async (batch_id: string, current: { title: string; content: string }) => {
    const newTitle = window.prompt('Tiêu đề mới', current.title);
    if (newTitle === null) return;
    const newContent = window.prompt('Nội dung mới', current.content);
    if (newContent === null) return;
    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ title: newTitle, content: newContent })
        .contains('metadata', { batch_id });
      if (error) throw error;
      await load();
    } catch (e) {
      console.error('Edit batch failed', e);
      alert('Sửa thông báo thất bại');
    } finally {
      setLoading(false);
    }
  };

  const revokeBatch = async (batch_id: string) => {
    if (!confirm('Thu hồi thông báo này cho toàn bộ người dùng?')) return;
    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ status: 'revoked' })
        .contains('metadata', { batch_id });
      if (error) throw error;
      await load();
    } catch (e) {
      console.error('Revoke failed', e);
      alert('Thu hồi thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold">Quản lý Thông báo</h2>
        <p className="text-muted-foreground">Gửi đến tất cả người dùng. Có thể chọn gửi kèm email.</p>
      </header>

      <section className="grid md:grid-cols-3 gap-4 items-start">
        <div className="md:col-span-2 p-4 rounded-lg border border-border bg-card space-y-4">
          <div>
            <label className="text-sm font-medium">Tiêu đề</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tiêu đề" />
          </div>
          <div>
            <label className="text-sm font-medium">Nội dung</label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Nhập nội dung" rows={6} />
          </div>
          <div className="flex items-center gap-2">
            <input id="sendEmail" type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
            <label htmlFor="sendEmail" className="text-sm">Gửi qua email</label>
          </div>
          <Button onClick={sendAll} disabled={!title || !content || loading}>Gửi tới tất cả</Button>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="font-semibold mb-2">Trạng thái</div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Đang xử lý...</div>
          ) : (
            <div className="text-sm text-muted-foreground">Sẵn sàng</div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="font-semibold">Thông báo đã gửi</div>
        <div className="grid gap-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Đang tải...</div>
          ) : batches.length === 0 ? (
            <div className="text-sm text-muted-foreground">Chưa có thông báo</div>
          ) : (
            batches.map(b => (
              <div key={b.batch_id} className="grid grid-cols-12 gap-3 items-center px-3 py-2 rounded border border-border bg-background/50">
                <div className="col-span-3 text-sm font-medium truncate" title={b.title}>{b.title}</div>
                <div className="col-span-4 text-sm truncate" title={b.content}>{b.content}</div>
                <div className="col-span-2 text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString('vi-VN')}</div>
                <div className="col-span-1 text-xs">{b.count}</div>
                <div className="col-span-2 flex items-center gap-2 justify-end">
                  <Badge variant={b.status === 'sent' ? 'default' : b.status === 'pending' ? 'secondary' : b.status === 'revoked' ? 'outline' : 'destructive'}>
                    {b.status}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => editBatch(b.batch_id, { title: b.title, content: b.content })}>Sửa</Button>
                  <Button size="sm" variant="destructive" onClick={() => revokeBatch(b.batch_id)}>Thu hồi</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
