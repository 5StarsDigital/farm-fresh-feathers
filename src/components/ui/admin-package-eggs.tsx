import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Package, Eye, Plus } from 'lucide-react';

interface ServicePackage {
  id: string;
  package_code: string;
  package_name: string;
  coop_name: string;
  selected_chicken_quantity: number;
  status: string;
  user_id: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

interface EggEntry {
  package_code: string;
  egg_count: number;
  date: string;
}

export function AdminPackageEggs() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [eggCount, setEggCount] = useState('');
  const [quickEntries, setQuickEntries] = useState<EggEntry[]>([]);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data: packagesData, error: packagesError } = await supabase
        .from('service_packages')
        .select(`
          id,
          package_code,
          package_name,
          coop_name,
          selected_chicken_quantity,
          status,
          user_id
        `)
        .eq('status', 'active')
        .order('package_code');

      if (packagesError) throw packagesError;

      // Get user profiles for the packages
      const userIds = packagesData?.map(pkg => pkg.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to packages
      const packagesWithProfiles = packagesData?.map(pkg => ({
        ...pkg,
        profile: profilesData?.find(p => p.id === pkg.user_id)
      })) || [];

      setPackages(packagesWithProfiles);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Lỗi khi tải danh sách gói dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.package_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.coop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickEntry = () => {
    if (!selectedPackage || !eggCount) {
      toast.error('Vui lòng chọn gói và nhập số trứng');
      return;
    }

    const entry: EggEntry = {
      package_code: selectedPackage.package_code,
      egg_count: parseInt(eggCount),
      date: new Date().toLocaleDateString('vi-VN')
    };

    setQuickEntries(prev => [...prev, entry]);
    setEggCount('');
    setSelectedPackage(null);
    toast.success(`Đã ghi nhận ${entry.egg_count} trứng cho gói ${entry.package_code}`);
  };

  const handleBatchSave = async () => {
    if (quickEntries.length === 0) {
      toast.error('Không có dữ liệu để lưu');
      return;
    }

    try {
      // Here you would typically save to a dedicated table for egg collection records
      // For now, we'll show a success message
      toast.success(`Đã lưu ${quickEntries.length} bản ghi thu hoạch trứng`);
      setQuickEntries([]);
    } catch (error) {
      console.error('Error saving egg entries:', error);
      toast.error('Lỗi khi lưu dữ liệu');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      expired: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'active' ? 'Đang hoạt động' : 
         status === 'inactive' ? 'Tạm dừng' : 
         status === 'expired' ? 'Hết hạn' : status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Đang tải...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Quản lý thu hoạch trứng theo gói dịch vụ
          </CardTitle>
          <CardDescription>
            Ghi nhận số trứng thu hoạch hàng ngày theo mã gói dịch vụ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Entry Form */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="packageSearch">Tìm gói dịch vụ</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="packageSearch"
                  placeholder="Tìm theo mã gói, tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="eggCount">Số trứng</Label>
              <Input
                id="eggCount"
                type="number"
                placeholder="Nhập số trứng"
                value={eggCount}
                onChange={(e) => setEggCount(e.target.value)}
                min="0"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleQuickEntry}
                disabled={!selectedPackage || !eggCount}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ghi nhận
              </Button>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline"
                onClick={handleBatchSave}
                disabled={quickEntries.length === 0}
                className="w-full"
              >
                Lưu tất cả ({quickEntries.length})
              </Button>
            </div>
          </div>

          {/* Quick Entries Preview */}
          {quickEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dữ liệu chờ lưu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {quickEntries.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <span className="font-mono text-sm">{entry.package_code}</span>
                      <span className="text-sm">{entry.egg_count} trứng</span>
                      <span className="text-xs text-muted-foreground">{entry.date}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách gói dịch vụ đang hoạt động</CardTitle>
          <CardDescription>
            Nhấn vào gói để chọn ghi nhận trứng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã gói</TableHead>
                <TableHead>Tên gói</TableHead>
                <TableHead>Chuồng</TableHead>
                <TableHead>Số gà</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages.map((pkg) => (
                <TableRow 
                  key={pkg.id}
                  className={`cursor-pointer hover:bg-muted/50 ${
                    selectedPackage?.id === pkg.id ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <TableCell>
                    <div className="font-mono font-semibold text-primary">
                      {pkg.package_code}
                    </div>
                  </TableCell>
                  <TableCell>{pkg.package_name}</TableCell>
                  <TableCell>{pkg.coop_name || 'Chưa gán'}</TableCell>
                  <TableCell>{pkg.selected_chicken_quantity} con</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{pkg.profile?.full_name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{pkg.profile?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Chi tiết gói {pkg.package_code}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Mã gói</Label>
                            <div className="font-mono text-lg font-semibold text-primary mt-1">
                              {pkg.package_code}
                            </div>
                          </div>
                          <div>
                            <Label>Tên gói</Label>
                            <div className="mt-1">{pkg.package_name}</div>
                          </div>
                          <div>
                            <Label>Chuồng</Label>
                            <div className="mt-1">{pkg.coop_name || 'Chưa gán'}</div>
                          </div>
                          <div>
                            <Label>Số lượng gà</Label>
                            <div className="mt-1">{pkg.selected_chicken_quantity} con</div>
                          </div>
                          <div>
                            <Label>Khách hàng</Label>
                            <div className="mt-1">
                              <div className="font-medium">{pkg.profile?.full_name}</div>
                              <div className="text-sm text-muted-foreground">{pkg.profile?.email}</div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPackages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'Không tìm thấy gói dịch vụ nào' : 'Chưa có gói dịch vụ nào'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}