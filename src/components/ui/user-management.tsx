import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronUp, Plus, Trash2, Edit, UserX } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FarmEditDialog, PackageEditDialog, ChickenEditDialog } from './super-admin-edit-dialogs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
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

      // Fetch farm rentals with available farm details
      const { data: farmRentalsData } = await supabase
        .from('farm_rentals')
        .select('*, available_farms(name, rental_price, monthly_cost)');

      // Fetch user chickens with chicken types
      const { data: chickensData } = await supabase
        .from('user_chickens')
        .select('*, chicken_types(name)');

      // Combine all data per user
      const usersWithData = profilesData?.map((profile: any) => {
        const userRole = rolesData?.find(role => role.user_id === profile.id);
        const userFarms = farmsData?.filter(farm => farm.user_id === profile.id) || [];
        const userPackages = packagesData?.filter(pkg => pkg.user_id === profile.id) || [];
        const userFarmRentals = farmRentalsData?.filter(rental => rental.user_id === profile.id) || [];
        const userChickens = chickensData?.filter(chicken => {
          const farm = userFarms.find(f => f.id === chicken.farm_id);
          return farm !== undefined;
        }) || [];

        return {
          ...profile,
          role: userRole?.role || 'customer',
          farms: userFarms,
          packages: userPackages,
          farmRentals: userFarmRentals,
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
      console.log('Starting package deletion with function:', packageId);
      
      // Use the secure database function to delete package
      const { data, error } = await supabase.rpc('delete_service_package', {
        p_package_id: packageId
      });

      if (error) {
        console.error('Database function error:', error);
        throw error;
      }

      console.log('Database function result:', data);

      const result = data as any;
      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      // Refresh the user list
      await fetchUsers();
      
      // Log resync information if available
      if (result.resync) {
        console.log('Resync completed:', result.resync);
      }
      
      toast({
        title: "Thành công", 
        description: `Đã xóa gói và đồng bộ số lượng gà thành công!`,
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

  const deleteUser = async (userId: string) => {
    try {
      setDeletingUser(userId);
      
      console.log('Calling delete-user function for user:', userId);
      
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) {
        console.error('Error calling delete-user function:', error);
        throw error;
      }

      console.log('Delete user response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      // Refresh the user list
      await fetchUsers();
      
      toast({
        title: "Thành công",
        description: "Đã xóa người dùng và toàn bộ dữ liệu liên quan",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa người dùng: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setDeletingUser(null);
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
                        <div className="pt-4 border-t">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="w-full"
                                disabled={deletingUser === user.id}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                {deletingUser === user.id ? 'Đang xóa...' : 'Xóa người dùng'}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Bạn có chắc chắn muốn xóa người dùng này?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu của người dùng bao gồm:
                                  <br />• Thông tin cá nhân và tài khoản
                                  <br />• Tất cả trại gà và số dư
                                  <br />• Gói nuôi gà và lịch sử thanh toán
                                  <br />• Gà giống và phụ kiện
                                  <br />• Lịch sử giao dịch và thông báo
                                  <br /><br />
                                  <strong>Hành động này không thể hoàn tác!</strong>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteUser(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Xóa vĩnh viễn
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Trại gà */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Trại gà cá nhân</CardTitle>
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

                    {/* Trại gà thuê (Farm Rentals) */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Trại gà thuê</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {user.farmRentals.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Chưa thuê trại nào</p>
                        ) : (
                          <div className="space-y-2">
                            {user.farmRentals.map((rental) => (
                              <div key={rental.id} className="flex items-center justify-between p-2 border rounded bg-blue-50">
                                <div>
                                  <div className="font-medium">{rental.available_farms?.name || 'Trại không xác định'}</div>
                                  <div className="text-sm text-blue-600">
                                    Thuê: {formatCurrency(rental.rental_price)} | Hàng tháng: {formatCurrency(rental.monthly_cost)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Trạng thái: {rental.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(rental.created_at).toLocaleDateString('vi-VN')}
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