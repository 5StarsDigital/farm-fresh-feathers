import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { RichTextEditor } from './rich-text-editor';
import { Plus, Edit, Trash2, Save, Eye, FileText, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PolicyPage {
  id: string;
  slug: string;
  title: string;
  content: {
    content: string;
    images: any[];
    videos: any[];
  };
  meta_description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PolicyManagement = () => {
  const [policyPages, setPolicyPages] = useState<PolicyPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<PolicyPage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: { content: '', images: [], videos: [] },
    meta_description: '',
    is_active: true
  });

  const fetchPolicyPages = async () => {
    try {
      const { data, error } = await supabase
        .from('policy_pages')
        .select('*')
        .order('slug', { ascending: true });

      if (error) {
        toast.error('Lỗi khi tải danh sách trang chính sách');
        return;
      }

      setPolicyPages((data as unknown as PolicyPage[]) || []);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicyPages();
  }, []);

  const handleEdit = (page: PolicyPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      meta_description: page.meta_description || '',
      is_active: page.is_active
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingPage(null);
    setFormData({
      title: '',
      slug: '',
      content: { content: '', images: [], videos: [] },
      meta_description: '',
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error('Vui lòng nhập đầy đủ tiêu đề và slug');
      return;
    }

    try {
      if (editingPage) {
        const { error } = await supabase
          .from('policy_pages')
          .update({
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            meta_description: formData.meta_description,
            is_active: formData.is_active
          })
          .eq('id', editingPage.id);

        if (error) {
          toast.error('Lỗi khi cập nhật trang chính sách');
          return;
        }

        toast.success('Đã cập nhật trang chính sách');
      } else {
        const { error } = await supabase
          .from('policy_pages')
          .insert({
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            meta_description: formData.meta_description,
            is_active: formData.is_active
          });

        if (error) {
          toast.error('Lỗi khi thêm trang chính sách mới');
          return;
        }

        toast.success('Đã thêm trang chính sách mới');
      }

      setIsDialogOpen(false);
      fetchPolicyPages();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu');
    }
  };

  const handleDelete = async (pageId: string) => {
    try {
      const { error } = await supabase
        .from('policy_pages')
        .delete()
        .eq('id', pageId);

      if (error) {
        toast.error('Lỗi khi xóa trang chính sách');
        return;
      }

      toast.success('Đã xóa trang chính sách');
      fetchPolicyPages();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa');
    }
  };

  const getIcon = (slug: string) => {
    switch (slug) {
      case 'privacy':
        return <Shield className="w-5 h-5" />;
      case 'warranty':
        return <AlertTriangle className="w-5 h-5" />;
      case 'terms':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/\n/g, '<br>');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý trang chính sách</h2>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm trang mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policyPages.map((page) => (
          <Card key={page.id} className="relative">
            <CardHeader>
              <div className="flex items-center gap-3">
                {getIcon(page.slug)}
                <div>
                  <CardTitle className="text-lg">{page.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">/{page.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={page.is_active ? 'default' : 'secondary'}>
                  {page.is_active ? 'Hoạt động' : 'Tạm ẩn'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {page.meta_description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(page)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/${page.slug}`, '_blank')}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn xóa trang "{page.title}"? 
                          Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(page.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                
                <span className="text-xs text-muted-foreground">
                  {new Date(page.updated_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? 'Chỉnh sửa trang chính sách' : 'Thêm trang chính sách mới'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
              <TabsTrigger value="content">Nội dung</TabsTrigger>
              <TabsTrigger value="preview">Xem trước</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="VD: Chính sách quyền riêng tư"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    placeholder="VD: privacy"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Mô tả SEO</Label>
                <Input
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                  placeholder="Mô tả ngắn gọn cho SEO..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label>Hiển thị công khai</Label>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({...formData, content: value})}
                placeholder="Nhập nội dung trang chính sách..."
              />
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {getIcon(formData.slug)}
                    {formData.title || 'Tiêu đề trang'}
                  </CardTitle>
                  {formData.meta_description && (
                    <p className="text-muted-foreground">{formData.meta_description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: renderMarkdown(formData.content.content) 
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {editingPage ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PolicyManagement;