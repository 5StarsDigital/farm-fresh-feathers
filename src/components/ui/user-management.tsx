import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronUp, Plus, Trash2, Edit } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FarmEditDialog, PackageEditDialog, ChickenEditDialog } from './super-admin-edit-dialogs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserData {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  role: string;
  uncollected_egg: number;
  farms: Farm[];
  packages: ServicePackage[];
  chickens: UserChicken[];
}

interface Farm {
  id: string;
  user_id: string;
  farm_name: string;
  account_balance: number;
  created_at: string;
}

interface ServicePackage {
  id: string;
  user_id: string;
  farm_id: string;
  package_name: string;
  package_id: string;
  selected_chicken_quantity: number;
  total_amount: number;
  status: string;
  coop_name: string | null;
  rtsp_url: string | null;
  created_at: string;
}

interface UserChicken {
  id: string;
  farm_id: string;
  chicken_type_id: string;
  quantity: number;
  leftover_time_minutes: number;
  last_egg_collection: string;
  chicken_type?: { name: string };
}

export function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [editDialogs, setEditDialogs] = useState({
    farm: { open: false, data: null as any },
    package: { open: false, data: null as any },
    chicken: { open: false, data: null as any }
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users with profiles and roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at, uncollected_egg');

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch farms
      const { data: farmsData } = await supabase
        .from('farms')
        .select('*');

      // Fetch service packages
      const { data: packagesData } = await supabase
        .from('service_packages')
        .select('*');

      // Fetch user chickens with chicken types
      const { data: chickensData } = await supabase
        .from('user_chickens')
        .select('*, chicken_types(name)');

      // Combine all data per user
      const usersWithData = profilesData?.map((profile: any) => {
        const userRole = rolesData?.find(role => role.user_id === profile.id);
        const userFarms = farmsData?.filter(farm => farm.user_id === profile.id) || [];
        const userPackages = packagesData?.filter(pkg => pkg.user_id === profile.id) || [];
        const userChickens = chickensData?.filter(chicken => {
          const farm = userFarms.find(f => f.id === chicken.farm_id);
          return farm !== undefined;
        }) || [];

        return {
          ...profile,
          role: userRole?.role || 'customer',
          farms: userFarms,
          packages: userPackages,
          chickens: userChickens
        };
      }) || [];

      setUsers(usersWithData);
      setFilteredUsers(usersWithData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu người dùng",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Thành công",
        description: "Đã cập nhật vai trò người dùng",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Lỗi", 
        description: "Không thể cập nhật vai trò",
        variant: "destructive",
      });
    }
  };

  const handleFarmSave = async (farmData: any) => {
    try {
      const { error } = await supabase
        .from('farms')
        .update({
          farm_name: farmData.farm_name,
          account_balance: farmData.account_balance,
        })
        .eq('id', farmData.id);

      if (error) throw error;

      await fetchUsers(); // Refresh data
      setEditDialogs({ ...editDialogs, farm: { open: false, data: null } });
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin trại",
      });
    } catch (error) {
      console.error('Error updating farm:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trại",
        variant: "destructive",
      });
    }
  };

  const handlePackageSave = async (packageData: any) => {
    try {
      const { error } = await supabase
        .from('service_packages')
        .update({
          package_name: packageData.package_name,
          selected_chicken_quantity: packageData.selected_chicken_quantity,
          total_amount: packageData.total_amount,
          status: packageData.status,
          coop_name: packageData.coop_name,
          rtsp_url: packageData.rtsp_url,
        })
        .eq('id', packageData.id);

      if (error) throw error;

      await fetchUsers(); // Refresh data
      setEditDialogs({ ...editDialogs, package: { open: false, data: null } });
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin gói",
      });
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật gói",
        variant: "destructive",
      });
    }
  };

  const handleChickenSave = async (chickenData: any) => {
    try {
      const { error } = await supabase
        .from('user_chickens')
        .update({
          quantity: chickenData.quantity,
          leftover_time_minutes: chickenData.leftover_time_minutes,
          last_egg_collection: chickenData.last_egg_collection,
        })
        .eq('id', chickenData.id);

      if (error) throw error;

      await fetchUsers(); // Refresh data
      setEditDialogs({ ...editDialogs, chicken: { open: false, data: null } });
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật thông tin gà",
      });
    } catch (error) {
      console.error('Error updating chicken:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật gà",
        variant: "destructive",
      });
    }
  };

  const deleteFarm = async (farmId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa trại này?')) return;
    
    try {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farmId);

      if (error) throw error;

      await fetchUsers();
      toast({
        title: "Thành công",
        description: "Đã xóa trại",
      });
    } catch (error) {
      console.error('Error deleting farm:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa trại",
        variant: "destructive",
      });
    }
  };

  const deletePackage = async (packageId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa gói này? Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn!')) return;
    
    try {
      console.log('Starting package deletion:', packageId);
      
      // Lấy thông tin package
      const { data: packageData, error: fetchError } = await supabase
        .from('service_packages')
        .select('farm_id, package_name, package_code, user_id')
        .eq('id', packageId)
        .single();

      if (fetchError) {
        console.error('Error fetching package:', fetchError);
        throw fetchError;
      }

      console.log('Package data:', packageData);

      // Xóa theo thứ tự để tránh vi phạm foreign key constraints
      
      // 1. Xóa invoice_items liên quan đến package
      console.log('Deleting invoice_items...');
      const { error: invoiceItemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('package_id', packageId);

      if (invoiceItemsError) {
        console.error('Error deleting invoice_items:', invoiceItemsError);
      } else {
        console.log('Invoice items deleted successfully');
      }

      // 2. Xóa monthly_bills liên quan đến package
      console.log('Deleting monthly_bills...');
      const { error: monthlyBillsError } = await supabase
        .from('monthly_bills')
        .delete()
        .eq('package_id', packageId);

      if (monthlyBillsError) {
        console.error('Error deleting monthly_bills:', monthlyBillsError);
      } else {
        console.log('Monthly bills deleted successfully');
      }

      // 3. Lấy danh sách invoices để xóa
      console.log('Finding related invoices...');
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('id')
        .eq('farm_id', packageData.farm_id);

      if (invoicesData && invoicesData.length > 0) {
        console.log('Deleting invoices:', invoicesData.length);
        for (const invoice of invoicesData) {
          // Xóa invoice_items của invoice trước
          await supabase
            .from('invoice_items')
            .delete()
            .eq('invoice_id', invoice.id);
          
          // Rồi xóa invoice
          await supabase
            .from('invoices')
            .delete()
            .eq('id', invoice.id);
        }
        console.log('Invoices deleted successfully');
      }

      // 4. Cuối cùng xóa service_package
      console.log('Deleting service_package...');
      const { error: packageError } = await supabase
        .from('service_packages')
        .delete()
        .eq('id', packageId);

      if (packageError) {
        console.error('Error deleting service_package:', packageError);
        throw packageError;
      }

      console.log('Service package deleted successfully');

      // Verify deletion
      const { data: verifyData } = await supabase
        .from('service_packages')
        .select('id')
        .eq('id', packageId);

      if (verifyData && verifyData.length > 0) {
        throw new Error('Package still exists after deletion');
      }

      console.log('Package deletion verified');
      await fetchUsers();
      
      toast({
        title: "Thành công", 
        description: `Đã xóa hoàn toàn gói ${packageData.package_code || packageData.package_name}`,
      });
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa gói: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const deleteChicken = async (chickenId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa gà này?')) return;
    
    try {
      const { error } = await supabase
        .from('user_chickens')
        .delete()
        .eq('id', chickenId);

      if (error) throw error;

      await fetchUsers();
      toast({
        title: "Thành công",
        description: "Đã xóa gà",
      });
    } catch (error) {
      console.error('Error deleting chicken:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa gà",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'super_admin': 'destructive',
      'admin': 'default',
      'seller': 'secondary',
      'customer': 'outline',
    };
    return <Badge variant={variants[role] || 'outline'}>{role}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <Collapsible
              open={expandedUsers.has(user.id)}
              onOpenChange={() => toggleUserExpansion(user.id)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <CardTitle className="text-lg">{user.full_name || 'Không có tên'}</CardTitle>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div>Trại: {user.farms.length}</div>
                        <div>Gói: {user.packages.length}</div>
                        <div>Trứng: {user.uncollected_egg}</div>
                      </div>
                      {expandedUsers.has(user.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Vai trò người dùng */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Vai trò:</span>
                          <Select
                            value={user.role}
                            onValueChange={(value) => updateUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer">Customer</SelectItem>
                              <SelectItem value="seller">Seller</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Trứng chưa thu:</span>
                          <span>{user.uncollected_egg}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Ngày tạo:</span>
                          <span className="text-sm">{new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Trại gà */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Trại gà</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {user.farms.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Chưa có trại nào</p>
                        ) : (
                          <div className="space-y-2">
                            {user.farms.map((farm) => (
                              <div key={farm.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-medium">{farm.farm_name}</div>
                                  <div className="text-sm text-green-600">{formatCurrency(farm.account_balance)}</div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditDialogs({ ...editDialogs, farm: { open: true, data: farm } })}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteFarm(farm.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Gói nuôi gà */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Gói nuôi gà</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {user.packages.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Chưa có gói nào</p>
                        ) : (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {user.packages.map((pkg) => (
                              <div key={pkg.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-medium text-sm">{pkg.package_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {pkg.selected_chicken_quantity} con - {formatCurrency(pkg.total_amount)}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditDialogs({ ...editDialogs, package: { open: true, data: pkg } })}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deletePackage(pkg.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Gà giống */}
                    {user.chickens.length > 0 && (
                      <Card className="lg:col-span-3">
                        <CardHeader>
                          <CardTitle className="text-base">Gà giống</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {user.chickens.map((chicken) => (
                              <div key={chicken.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-medium text-sm">{chicken.chicken_type?.name || 'Không rõ'}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Số lượng: {chicken.quantity}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditDialogs({ ...editDialogs, chicken: { open: true, data: chicken } })}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteChicken(chicken.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Edit Dialogs */}
      {editDialogs.farm.open && (
        <FarmEditDialog
          farm={editDialogs.farm.data}
          users={users}
          onSave={handleFarmSave}
          onClose={() => setEditDialogs({ ...editDialogs, farm: { open: false, data: null } })}
        />
      )}

      {editDialogs.package.open && (
        <PackageEditDialog
          package={editDialogs.package.data}
          onSave={handlePackageSave}
          onClose={() => setEditDialogs({ ...editDialogs, package: { open: false, data: null } })}
        />
      )}

      {editDialogs.chicken.open && (
        <ChickenEditDialog
          chicken={editDialogs.chicken.data}
          onSave={handleChickenSave}
          onClose={() => setEditDialogs({ ...editDialogs, chicken: { open: false, data: null } })}
        />
      )}
    </div>
  );
}