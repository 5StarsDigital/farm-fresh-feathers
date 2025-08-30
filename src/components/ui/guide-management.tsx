import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { RichTextEditor } from './rich-text-editor';

interface GuideSection {
  id: string;
  title: string;
  slug: string;
  content: {
    content: string;
    images: Array<{ url: string; caption: string }>;
    videos: Array<{ url: string; caption: string }>;
  };
  order_index: number;
  is_active: boolean;
  parent_id: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
}

const GuideManagement = () => {
  const [sections, setSections] = useState<GuideSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<GuideSection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: { content: '', images: [], videos: [] },
    icon: '📖',
    is_active: true,
    parent_id: null as string | null,
  });

  useEffect(() => {
    fetchGuideSections();
  }, []);

  const fetchGuideSections = async () => {
    try {
      const { data, error } = await supabase
        .from('guide_sections')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setSections((data || []).map(item => ({
        ...item,
        content: item.content as {
          content: string;
          images: Array<{ url: string; caption: string }>;
          videos: Array<{ url: string; caption: string }>;
        }
      })));
    } catch (error: any) {
      toast.error('Không thể tải danh sách hướng dẫn');
      console.error('Error fetching guide sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSection) {
        const { error } = await supabase
          .from('guide_sections')
          .update({
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            icon: formData.icon,
            is_active: formData.is_active,
            parent_id: formData.parent_id,
          })
          .eq('id', editingSection.id);

        if (error) throw error;
        toast.success('Cập nhật hướng dẫn thành công');
      } else {
        const { error } = await supabase
          .from('guide_sections')
          .insert({
            title: formData.title,
            slug: formData.slug,
            content: formData.content,
            icon: formData.icon,
            is_active: formData.is_active,
            parent_id: formData.parent_id,
            order_index: sections.length + 1,
          });

        if (error) throw error;
        toast.success('Tạo hướng dẫn mới thành công');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchGuideSections();
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi lưu hướng dẫn');
      console.error('Error saving guide section:', error);
    }
  };

  const handleEdit = (section: GuideSection) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      slug: section.slug,
      content: section.content,
      icon: section.icon,
      is_active: section.is_active,
      parent_id: section.parent_id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hướng dẫn này?')) return;

    try {
      const { error } = await supabase
        .from('guide_sections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Xóa hướng dẫn thành công');
      fetchGuideSections();
    } catch (error: any) {
      toast.error('Không thể xóa hướng dẫn');
      console.error('Error deleting guide section:', error);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('guide_sections')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(`${!isActive ? 'Kích hoạt' : 'Tắt'} hướng dẫn thành công`);
      fetchGuideSections();
    } catch (error: any) {
      toast.error('Không thể cập nhật trạng thái');
      console.error('Error updating section status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: { content: '', images: [], videos: [] },
      icon: '📖',
      is_active: true,
      parent_id: null,
    });
    setEditingSection(null);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  if (loading) {
    return <div className="p-4">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quản lý hướng dẫn</h2>
          <p className="text-muted-foreground">Tạo và chỉnh sửa nội dung hướng dẫn sử dụng</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm hướng dẫn
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSection ? 'Chỉnh sửa hướng dẫn' : 'Tạo hướng dẫn mới'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Tiêu đề</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon (Emoji)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="📖"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Hiển thị công khai</Label>
                </div>
              </div>

              <div>
                <Label>Nội dung hướng dẫn</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                  placeholder="Nhập nội dung hướng dẫn chi tiết..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingSection ? 'Cập nhật' : 'Tạo mới'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Hủy
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <span className="text-2xl">{section.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">/{section.slug}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={section.is_active ? 'default' : 'secondary'}>
                    {section.is_active ? 'Hiển thị' : 'Ẩn'}
                  </Badge>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(section.id, section.is_active)}
                  >
                    {section.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(section)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <div dangerouslySetInnerHTML={{ 
                  __html: section.content.content.substring(0, 200) + '...' 
                }} />
              </div>
              
              {(section.content.images?.length > 0 || section.content.videos?.length > 0) && (
                <div className="flex gap-2 mt-2">
                  {section.content.images?.length > 0 && (
                    <Badge variant="outline">{section.content.images.length} hình ảnh</Badge>
                  )}
                  {section.content.videos?.length > 0 && (
                    <Badge variant="outline">{section.content.videos.length} video</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GuideManagement;