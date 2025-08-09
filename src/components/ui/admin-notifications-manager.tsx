import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { linkifyText } from '@/lib/linkify';


interface NotificationRow {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  metadata: any;
}

interface AttachmentInfo {
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
  mime: string;
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

  // New: attachments and links
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [linkPreview, setLinkPreview] = useState<{ url: string; image?: string; title?: string; description?: string } | null>(null);

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

  const normalizeUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
  const fetchPreview = async (raw: string) => {
    try {
      const href = normalizeUrl(raw);
      const { data, error } = await (supabase as any).functions.invoke('link-preview', { body: { url: href } });
      if (error) throw error;
      setLinkPreview({ url: href, image: data?.image, title: data?.title, description: data?.description });
    } catch (e) {
      console.warn('Link preview fetch failed', e);
      setLinkPreview(null);
    }
  };

const sendAll = async () => {
  if (!title || !content) return;
  try {
    setLoading(true);

    // 1) Upload selected files first
    let uploaded: AttachmentInfo[] = [];
    if (files.length > 0) {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const ext = file.name.split('.').pop() || 'bin';
          const path = `attachments/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await (supabase as any).storage.from('notifications').upload(path, file, { upsert: false, contentType: file.type });
          if (upErr) throw upErr;
          const { data: pub } = (supabase as any).storage.from('notifications').getPublicUrl(path);
          return {
            url: pub.publicUrl as string,
            type: file.type.startsWith('image') ? 'image' : 'video',
            name: file.name,
            size: file.size,
            mime: file.type,
          } as AttachmentInfo;
        })
      );
      uploaded = uploads;
    }

    // Auto-attach link preview thumbnail when exactly 1 link is provided
    if (links.length === 1 && linkPreview?.image) {
      uploaded = [
        ...uploaded,
        { url: linkPreview.image, type: 'image', name: 'link-preview', size: 0, mime: 'image/*' } as AttachmentInfo,
      ];
    }

    // 2) Build email-safe appended content (keep function unchanged)
    const attachmentsText = uploaded.length > 0 ? `\n\nTệp đính kèm:\n${uploaded.map(a => `- ${a.url}`).join('\n')}` : '';
    const linksText = links.length > 0 ? `\n\nLiên kết:\n${links.map(l => `- ${l}`).join('\n')}` : '';
    const finalContent = `${content}${attachmentsText}${linksText}`;

    // 3) Call existing edge function as-is
    const { data, error } = await (supabase as any).functions.invoke('admin-broadcast-notifications', {
      body: { title, content: finalContent, send_email: sendEmail }
    });
    if (error) throw error;

    // 4) Enrich metadata for in-app rendering
    const batchId = data?.batch_id as string | undefined;
    if (batchId && (uploaded.length > 0 || links.length > 0)) {
      const newMeta = (bid: string) => ({ batch_id: bid, attachments: uploaded, links });
      const { error: updErr } = await (supabase as any)
        .from('notifications')
        .update({ metadata: newMeta(batchId) })
        .contains('metadata', { batch_id: batchId });
      if (updErr) throw updErr;
    }

    // Reset
    setTitle('');
    setContent('');
    setSendEmail(false);
    setFiles([]);
    setLinks([]);
    setLinkInput('');
    setLinkPreview(null);

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
<div className="space-y-3">
  <div>
    <label className="text-sm font-medium">Đính kèm ảnh/video</label>
    <input
      type="file"
      accept="image/*,video/*"
      multiple
      onChange={(e) => {
        const selected = Array.from(e.target.files || []);
        if (selected.length) setFiles((prev) => [...prev, ...selected]);
      }}
      className="block w-full text-sm"
    />
    {files.length > 0 && (
      <div className="mt-2 space-y-2">
        {files.map((f, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs border border-border/60 rounded px-2 py-1">
            <span className="truncate" title={`${f.name} (${(f.size/1024/1024).toFixed(2)} MB)`}>
              {f.type.startsWith('image') ? '🖼️' : '🎬'} {f.name}
            </span>
            <button type="button" className="text-destructive hover:underline" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}>
              Xóa
            </button>
          </div>
        ))}
      </div>
    )}
  </div>

  <div>
    <label className="text-sm font-medium">Thêm liên kết</label>
    <div className="flex gap-2">
      <Input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="https://..." />
      <Button type="button" variant="secondary" onClick={() => {
        const v = linkInput.trim();
        if (!v) return;
        const next = [...links, v];
        setLinks(next);
        setLinkInput('');
        if (next.length === 1) {
          fetchPreview(v);
        } else {
          setLinkPreview(null);
        }
      }}>Thêm</Button>
    </div>
    {links.length > 0 && (
      <ul className="mt-2 space-y-1 text-xs">
        {links.map((l, i) => (
          <li key={i} className="flex items-center justify-between border border-border/60 rounded px-2 py-1">
            <span className="truncate" title={l}>{l}</span>
            <button type="button" className="text-destructive hover:underline" onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}>Xóa</button>
          </li>
        ))}
      </ul>
    )}
    {links.length === 1 && linkPreview?.image ? (
      <div className="mt-3 flex items-center gap-3 border border-border rounded p-2">
        <img src={linkPreview.image} alt="Link preview" className="w-24 h-16 object-cover rounded border border-border" />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{linkPreview.title || linkPreview.url}</div>
          {linkPreview.description && <div className="text-xs text-muted-foreground truncate">{linkPreview.description}</div>}
        </div>
      </div>
    ) : null}
  </div>
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
                <div className="col-span-4 text-sm truncate break-words" title={b.content}>{linkifyText(b.content)}</div>
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
