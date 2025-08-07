import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PackagePrice {
  id: string;
  package_id: string;
  package_name: string;
  daily_price: number;
  original_daily_price: number;
  discount_percentage: number;
  description: string;
  subtitle: string;
  emoji: string;
  bg_gradient: string;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
}

interface PackageFormProps {
  package?: PackagePrice | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const PackageForm = ({ package: pkg, onSave, onCancel }: PackageFormProps) => {
  const [formData, setFormData] = useState({
    package_id: pkg?.package_id || '',
    package_name: pkg?.package_name || '',
    daily_price: pkg?.daily_price || 0,
    original_daily_price: pkg?.original_daily_price || 0,
    discount_percentage: pkg?.discount_percentage || 0,
    description: pkg?.description || '',
    subtitle: pkg?.subtitle || '',
    emoji: pkg?.emoji || '🐣',
    bg_gradient: pkg?.bg_gradient || 'from-blue-400 to-blue-500',
    features: pkg?.features?.join('\n') || '',
    is_popular: pkg?.is_popular || false,
    is_active: pkg?.is_active !== undefined ? pkg.is_active : true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      features: formData.features.split('\n').filter(f => f.trim()),
      daily_price: Number(formData.daily_price),
      original_daily_price: Number(formData.original_daily_price),
      discount_percentage: Number(formData.discount_percentage)
    };

    onSave(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="package_id">Mã gói</Label>
          <Input
            id="package_id"
            value={formData.package_id}
            onChange={(e) => setFormData({ ...formData, package_id: e.target.value })}
            required
            disabled={!!pkg}
          />
        </div>
        <div>
          <Label htmlFor="package_name">Tên gói</Label>
          <Input
            id="package_name"
            value={formData.package_name}
            onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="daily_price">Giá theo ngày</Label>
          <Input
            id="daily_price"
            type="number"
            value={formData.daily_price}
            onChange={(e) => setFormData({ ...formData, daily_price: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="original_daily_price">Giá gốc</Label>
          <Input
            id="original_daily_price"
            type="number"
            value={formData.original_daily_price}
            onChange={(e) => setFormData({ ...formData, original_daily_price: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="discount_percentage">% Giảm giá</Label>
          <Input
            id="discount_percentage"
            type="number"
            value={formData.discount_percentage}
            onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="subtitle">Khẩu hiệu</Label>
        <Input
          id="subtitle"
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          placeholder='"Chăm chỉ mỗi ngày"'
        />
      </div>

      <div>
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="emoji">Emoji</Label>
          <Input
            id="emoji"
            value={formData.emoji}
            onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="bg_gradient">Gradient nền</Label>
          <Input
            id="bg_gradient"
            value={formData.bg_gradient}
            onChange={(e) => setFormData({ ...formData, bg_gradient: e.target.value })}
            placeholder="from-blue-400 to-blue-500"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="features">Tính năng (mỗi dòng một tính năng)</Label>
        <Textarea
          id="features"
          value={formData.features}
          onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          rows={5}
          placeholder="Ăn 2 bữa/ngày thức ăn thô sạch&#10;Nước uống sạch mỗi ngày"
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_popular"
            checked={formData.is_popular}
            onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
          />
          <Label htmlFor="is_popular">Phổ biến</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Kích hoạt</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit">
          {pkg ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </form>
  );
};

export const PackageManagement = () => {
  const [packages, setPackages] = useState<PackagePrice[]>([]);
  const [editingPackage, setEditingPackage] = useState<PackagePrice | null>(null);
  const [isAddingPackage, setIsAddingPackage] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('package_prices')
        .select('*')
        .order('daily_price', { ascending: true });

      if (error) throw error;

      const transformedData = (data || []).map(pkg => ({
        id: pkg.id,
        package_id: pkg.package_id,
        package_name: pkg.package_name,
        daily_price: pkg.daily_price,
        original_daily_price: pkg.original_daily_price,
        discount_percentage: pkg.discount_percentage || 0,
        description: pkg.description || '',
        subtitle: pkg.subtitle || '',
        emoji: pkg.emoji || '🐣',
        bg_gradient: pkg.bg_gradient || 'from-blue-400 to-blue-500',
        features: Array.isArray(pkg.features) ? pkg.features.map(f => String(f)) : [],
        is_popular: pkg.is_popular,
        is_active: pkg.is_active
      }));

      setPackages(transformedData);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Lỗi khi tải danh sách gói');
    }
  };

  const handleSavePackage = async (packageData: any) => {
    try {
      if (editingPackage) {
        // Update existing package
        const { error } = await supabase
          .from('package_prices')
          .update(packageData)
          .eq('id', editingPackage.id);

        if (error) throw error;
        toast.success('Cập nhật gói thành công');
      } else {
        // Add new package
        const { error } = await supabase
          .from('package_prices')
          .insert(packageData);

        if (error) throw error;
        toast.success('Thêm gói mới thành công');
      }

      setEditingPackage(null);
      setIsAddingPackage(false);
      fetchPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Lỗi khi lưu gói');
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    try {
      const { error } = await supabase
        .from('package_prices')
        .delete()
        .eq('id', packageId);

      if (error) throw error;
      toast.success('Xóa gói thành công');
      fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Lỗi khi xóa gói');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý Gói gà</h2>
        <Dialog open={isAddingPackage} onOpenChange={setIsAddingPackage}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddingPackage(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm gói mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm gói mới</DialogTitle>
            </DialogHeader>
            <PackageForm onSave={handleSavePackage} onCancel={() => setIsAddingPackage(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gói</TableHead>
                <TableHead>Giá/ngày</TableHead>
                <TableHead>Giảm giá</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{pkg.emoji}</span>
                      <div>
                        <div className="font-medium">{pkg.package_name}</div>
                        <div className="text-sm text-muted-foreground">{pkg.subtitle}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatCurrency(pkg.daily_price)}</div>
                      {pkg.original_daily_price > pkg.daily_price && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatCurrency(pkg.original_daily_price)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {pkg.discount_percentage > 0 && (
                      <Badge variant="secondary">{pkg.discount_percentage}%</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {pkg.is_popular && <Badge>Phổ biến</Badge>}
                      <Badge variant={pkg.is_active ? "default" : "outline"}>
                        {pkg.is_active ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingPackage(pkg)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Chỉnh sửa gói</DialogTitle>
                          </DialogHeader>
                          <PackageForm 
                            package={pkg} 
                            onSave={handleSavePackage} 
                            onCancel={() => setEditingPackage(null)} 
                          />
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeletePackage(pkg.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};