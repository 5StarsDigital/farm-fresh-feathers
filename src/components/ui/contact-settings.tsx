import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface ContactSetting {
  id: string;
  contact_type: string;
  label: string;
  value: string;
  icon: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

const ContactSettings = () => {
  const [contacts, setContacts] = useState<ContactSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContact, setEditingContact] = useState<ContactSetting | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const contactTypes = [
    { value: 'phone', label: 'Điện thoại', icon: 'Phone' },
    { value: 'zalo', label: 'Zalo', icon: 'MessageCircle' },
    { value: 'facebook', label: 'Facebook', icon: 'Facebook' },
    { value: 'telegram', label: 'Telegram', icon: 'Send' },
    { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageSquare' },
    { value: 'email', label: 'Email', icon: 'Mail' },
  ];

  const colorOptions = [
    { value: '#10b981', label: 'Xanh lá' },
    { value: '#3b82f6', label: 'Xanh dương' },
    { value: '#8b5cf6', label: 'Tím' },
    { value: '#f59e0b', label: 'Vàng' },
    { value: '#ef4444', label: 'Đỏ' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#84cc16', label: 'Xanh lime' },
    { value: '#f97316', label: 'Cam' },
  ];

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Không thể tải danh sách liên hệ');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: Partial<ContactSetting>) => {
    try {
      if (editingContact) {
        // Update existing contact
        const { error } = await supabase
          .from('contact_settings')
          .update(formData)
          .eq('id', editingContact.id);

        if (error) throw error;
        toast.success('Cập nhật liên hệ thành công');
      } else {
        // Create new contact
        const maxOrder = Math.max(...contacts.map(c => c.display_order), 0);
        const { error } = await supabase
          .from('contact_settings')
          .insert({
            contact_type: formData.contact_type,
            label: formData.label,
            value: formData.value,
            icon: formData.icon,
            color: formData.color,
            is_active: formData.is_active,
            display_order: maxOrder + 1,
          });

        if (error) throw error;
        toast.success('Thêm liên hệ thành công');
      }

      fetchContacts();
      setIsDialogOpen(false);
      setEditingContact(null);
    } catch (error: any) {
      console.error('Error saving contact:', error);
      toast.error('Lỗi khi lưu liên hệ: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa liên hệ này?')) return;

    try {
      const { error } = await supabase
        .from('contact_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Xóa liên hệ thành công');
      fetchContacts();
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast.error('Lỗi khi xóa liên hệ: ' + error.message);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('contact_settings')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success(`${isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} liên hệ thành công`);
      fetchContacts();
    } catch (error: any) {
      console.error('Error toggling contact:', error);
      toast.error('Lỗi khi cập nhật trạng thái: ' + error.message);
    }
  };

  const openEditDialog = (contact?: ContactSetting) => {
    setEditingContact(contact || null);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt liên hệ</CardTitle>
          <CardDescription>Đang tải...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cài đặt liên hệ</CardTitle>
            <CardDescription>
              Quản lý các nút liên hệ hiển thị trên website
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openEditDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm liên hệ
              </Button>
            </DialogTrigger>
            <ContactDialog
              contact={editingContact}
              contactTypes={contactTypes}
              colorOptions={colorOptions}
              onSave={handleSave}
              onClose={() => setIsDialogOpen(false)}
            />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: contact.color }}
                >
                  {contact.icon.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{contact.label}</span>
                    <Badge variant={contact.is_active ? "default" : "secondary"}>
                      {contact.is_active ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{contact.value}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={contact.is_active}
                  onCheckedChange={(checked) => handleToggleActive(contact.id, checked)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(contact)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(contact.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có liên hệ nào. Thêm liên hệ đầu tiên!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ContactDialogProps {
  contact: ContactSetting | null;
  contactTypes: Array<{ value: string; label: string; icon: string }>;
  colorOptions: Array<{ value: string; label: string }>;
  onSave: (data: Partial<ContactSetting>) => void;
  onClose: () => void;
}

const ContactDialog = ({ contact, contactTypes, colorOptions, onSave, onClose }: ContactDialogProps) => {
  const [formData, setFormData] = useState({
    contact_type: contact?.contact_type || 'phone',
    label: contact?.label || '',
    value: contact?.value || '',
    icon: contact?.icon || 'Phone',
    color: contact?.color || '#10b981',
    is_active: contact?.is_active ?? true,
  });

  const selectedContactType = contactTypes.find(type => type.value === formData.contact_type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label || !formData.value) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    onSave({
      ...formData,
      icon: selectedContactType?.icon || 'Phone',
    });
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {contact ? 'Chỉnh sửa liên hệ' : 'Thêm liên hệ mới'}
        </DialogTitle>
        <DialogDescription>
          Cấu hình thông tin liên hệ hiển thị trên website
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact_type">Loại liên hệ</Label>
          <Select
            value={formData.contact_type}
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              contact_type: value,
              icon: contactTypes.find(type => type.value === value)?.icon || 'Phone'
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contactTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="label">Nhãn hiển thị</Label>
          <Input
            id="label"
            value={formData.label}
            onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
            placeholder="Ví dụ: Gọi điện hỗ trợ"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">
            {formData.contact_type === 'phone' ? 'Số điện thoại' : 'Đường dẫn'}
          </Label>
          <Input
            id="value"
            value={formData.value}
            onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
            placeholder={
              formData.contact_type === 'phone' 
                ? '0123456789' 
                : 'https://...'
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Màu nút</Label>
          <Select
            value={formData.color}
            onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: color.value }}
                    />
                    <span>{color.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
          <Label htmlFor="is_active">Kích hoạt</Label>
        </div>

        <Separator />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit">
            {contact ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

export default ContactSettings;