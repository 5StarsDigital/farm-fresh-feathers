import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, Settings, Activity, DollarSign, Users, TrendingUp, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  amount: number | null;
  transaction_type: string;
  description: string | null;
  created_at: string;
  farm_id: string;
  quantity: number | null;
}

interface Farm {
  id: string;
  user_id: string;
  farm_name: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  user_id: string;
}

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  role: string;
  user_roles?: Array<{ role: string }>;
}

export default function SuperAdminDashboard() {
  const { user, userRole, loading } = useAuth();

  // Handle loading and authentication BEFORE any other hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || userRole !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return <SuperAdminContent />;
}

// Separate component for the actual dashboard content
function SuperAdminContent() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [yearlyRevenue, setYearlyRevenue] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && userRole === 'super_admin') {
      fetchAllData();
    }
  }, [user, userRole]);

  const fetchAllData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch transactions
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Fetch payment transactions
      const { data: paymentsData } = await supabase
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Fetch users with profiles and roles separately for better error handling
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      console.log('Profiles data:', profilesData);
      console.log('Profiles error:', profilesError);

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      console.log('Roles data:', rolesData);
      console.log('Roles error:', rolesError);

      // Fetch farms to connect transactions to users
      const { data: farmsData } = await supabase
        .from('farms')
        .select('id, user_id, farm_name');

      // Calculate revenue
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { data: monthlyData } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`);
      
      const { data: yearlyData } = await supabase
        .from('payment_transactions')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', `${currentYear}-01-01`);

      setTransactions(transactionsData || []);
      setPayments(paymentsData || []);
      setFarms(farmsData || []);
      
      // Transform users data by combining profiles and roles
      const usersWithRoles = profilesData?.map((profile: any) => {
        const userRole = rolesData?.find(role => role.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'customer'
        };
      }) || [];
      
      console.log('Users with roles:', usersWithRoles);
      setUsers(usersWithRoles);
      
      setMonthlyRevenue(monthlyData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0);
      setYearlyRevenue(yearlyData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'completed': 'default',
      'pending': 'secondary',
      'failed': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
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

  // Helper functions
  const getUserFromTransaction = (transaction: Transaction) => {
    const farm = farms.find(f => f.id === transaction.farm_id);
    return farm ? users.find(u => u.id === farm.user_id) : null;
  };

  const getUserFromPayment = (payment: Payment) => {
    return users.find(u => u.id === payment.user_id);
  };

  // Filter transactions and payments based on search
  const filteredTransactions = transactions.filter(transaction => {
    const user = getUserFromTransaction(transaction);
    const searchLower = searchQuery.toLowerCase();
    
    return (
      transaction.id.toLowerCase().includes(searchLower) ||
      transaction.description?.toLowerCase().includes(searchLower) ||
      user?.email?.toLowerCase().includes(searchLower) ||
      user?.full_name?.toLowerCase().includes(searchLower) ||
      transaction.transaction_type.toLowerCase().includes(searchLower)
    );
  });

  const filteredPayments = payments.filter(payment => {
    const user = getUserFromPayment(payment);
    const searchLower = searchQuery.toLowerCase();
    
    return (
      payment.id.toLowerCase().includes(searchLower) ||
      user?.email?.toLowerCase().includes(searchLower) ||
      user?.full_name?.toLowerCase().includes(searchLower) ||
      payment.payment_method?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Khu vực Super Admin</h1>
          <p className="text-muted-foreground">Quản lý toàn bộ hệ thống và cấu hình</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doanh thu tháng</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">Tháng hiện tại</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doanh thu năm</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(yearlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">Năm {new Date().getFullYear()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">Tổng số người dùng</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giao dịch</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length + payments.length}</div>
              <p className="text-xs text-muted-foreground">Tổng giao dịch</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bảo mật</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">An toàn</div>
              <p className="text-xs text-muted-foreground">Hệ thống hoạt động bình thường</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="activities">Hoạt động</TabsTrigger>
            <TabsTrigger value="customer-activities">Hoạt động Customer</TabsTrigger>
            <TabsTrigger value="seller-activities">Hoạt động Seller</TabsTrigger>
            <TabsTrigger value="users">Quản lý Role</TabsTrigger>
            <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          </TabsList>

          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle>Hoạt động giao dịch</CardTitle>
                <p className="text-muted-foreground">Tất cả hoạt động mua bán, thu hoạch trứng với thông tin người dùng</p>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="flex items-center space-x-2">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Tìm kiếm theo tên, email, mã giao dịch, loại giao dịch..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md"
                      />
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{filteredTransactions.length}</div>
                          <p className="text-sm text-muted-foreground">Giao dịch được tìm thấy</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">
                            {formatCurrency(
                              filteredTransactions
                                .filter(t => t.amount && t.amount < 0)
                                .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">Tổng chi tiêu</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">
                            {new Set(filteredTransactions.map(t => getUserFromTransaction(t)?.id).filter(Boolean)).size}
                          </div>
                          <p className="text-sm text-muted-foreground">Người dùng hoạt động</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Transactions Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã giao dịch</TableHead>
                          <TableHead>Người dùng</TableHead>
                          <TableHead>Loại</TableHead>
                          <TableHead>Mô tả</TableHead>
                          <TableHead>Số lượng</TableHead>
                          <TableHead>Số tiền</TableHead>
                          <TableHead>Thời gian</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((transaction) => {
                          const user = getUserFromTransaction(transaction);
                          return (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-mono text-sm">
                                {transaction.id.slice(0, 8)}...
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{user?.email || 'Không xác định'}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {user?.full_name || 'Chưa cập nhật'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{transaction.transaction_type}</Badge>
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>{transaction.quantity || '-'}</TableCell>
                              <TableCell className={transaction.amount && transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                                {transaction.amount ? formatCurrency(Number(transaction.amount)) : '-'}
                              </TableCell>
                              <TableCell>{new Date(transaction.created_at).toLocaleString('vi-VN')}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    
                    {filteredTransactions.length === 0 && searchQuery && (
                      <div className="text-center py-8 text-muted-foreground">
                        Không tìm thấy giao dịch nào với từ khóa "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customer-activities">
            <Card>
              <CardHeader>
                <CardTitle>Hoạt động của Customer</CardTitle>
                <p className="text-muted-foreground">Theo dõi hoạt động mua sắm và giao dịch của khách hàng</p>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{users.filter(u => u.role === 'customer').length}</div>
                          <p className="text-sm text-muted-foreground">Tổng Customer</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{payments.filter(p => users.find(u => u.id === p.user_id)?.role === 'customer').length}</div>
                          <p className="text-sm text-muted-foreground">Giao dịch thanh toán</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">
                            {formatCurrency(
                              payments
                                .filter(p => users.find(u => u.id === p.user_id)?.role === 'customer' && p.status === 'completed')
                                .reduce((sum, p) => sum + Number(p.amount), 0)
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">Tổng chi tiêu</p>
                        </CardContent>
                      </Card>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead>Tổng chi tiêu</TableHead>
                          <TableHead>Giao dịch</TableHead>
                          <TableHead>Ngày tham gia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users
                          .filter(user => user.role === 'customer')
                          .map((customer) => {
                            const customerPayments = payments.filter(p => p.user_id === customer.id && p.status === 'completed');
                            const totalSpent = customerPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                            return (
                              <TableRow key={customer.id}>
                                <TableCell>{customer.email}</TableCell>
                                <TableCell>{customer.full_name || 'Chưa cập nhật'}</TableCell>
                                <TableCell>{formatCurrency(totalSpent)}</TableCell>
                                <TableCell>{customerPayments.length}</TableCell>
                                <TableCell>{new Date(customer.created_at).toLocaleDateString('vi-VN')}</TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seller-activities">
            <Card>
              <CardHeader>
                <CardTitle>Hoạt động của Seller</CardTitle>
                <p className="text-muted-foreground">Theo dõi hoạt động bán hàng và doanh thu của người bán</p>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{users.filter(u => u.role === 'seller').length}</div>
                          <p className="text-sm text-muted-foreground">Tổng Seller</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">
                            {transactions.filter(t => t.transaction_type === 'egg_collection').length}
                          </div>
                          <p className="text-sm text-muted-foreground">Thu hoạch trứng</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">
                            {transactions.filter(t => t.transaction_type === 'chicken_purchase').length}
                          </div>
                          <p className="text-sm text-muted-foreground">Mua gà</p>
                        </CardContent>
                      </Card>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead>Shop</TableHead>
                          <TableHead>Hoạt động</TableHead>
                          <TableHead>Ngày tham gia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users
                          .filter(user => user.role === 'seller')
                          .map((seller) => {
                            const sellerTransactions = transactions.filter(t => 
                              users.find(u => u.id === seller.id)
                            );
                            return (
                              <TableRow key={seller.id}>
                                <TableCell>{seller.email}</TableCell>
                                <TableCell>{seller.full_name || 'Chưa cập nhật'}</TableCell>
                                <TableCell>Shop của {seller.full_name || 'Seller'}</TableCell>
                                <TableCell>{sellerTransactions.length} giao dịch</TableCell>
                                <TableCell>{new Date(seller.created_at).toLocaleDateString('vi-VN')}</TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý vai trò người dùng</CardTitle>
                <p className="text-muted-foreground">Thay đổi vai trò và quản lý quyền hạn người dùng</p>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{users.length}</div>
                          <p className="text-sm text-muted-foreground">Tổng người dùng</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{users.filter(u => u.role === 'customer').length}</div>
                          <p className="text-sm text-muted-foreground">Customer</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{users.filter(u => u.role === 'seller').length}</div>
                          <p className="text-sm text-muted-foreground">Seller</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}</div>
                          <p className="text-sm text-muted-foreground">Admin</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Users Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Tên</TableHead>
                          <TableHead>Vai trò hiện tại</TableHead>
                          <TableHead>Ngày tham gia</TableHead>
                          <TableHead>Thay đổi vai trò</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.full_name || 'Chưa cập nhật'}</TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>{new Date(user.created_at).toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(value) => updateUserRole(user.id, value)}
                              >
                                <SelectTrigger className="w-40 bg-background border border-border">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border shadow-lg z-50">
                                  <SelectItem value="customer">Khách hàng</SelectItem>
                                  <SelectItem value="seller">Người bán</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {users.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Không có người dùng nào
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thống kê doanh thu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium text-lg">Doanh thu tháng {new Date().getMonth() + 1}</h4>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(monthlyRevenue)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium text-lg">Doanh thu năm {new Date().getFullYear()}</h4>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(yearlyRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Phân tích người dùng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['super_admin', 'admin', 'seller', 'customer'].map(role => {
                      const count = users.filter(u => u.role === role).length;
                      return (
                        <div key={role} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                          <div>
                            <h4 className="font-medium capitalize">{role.replace('_', ' ')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {role === 'super_admin' && 'Quyền cao nhất hệ thống'}
                              {role === 'admin' && 'Quản trị viên'}
                              {role === 'seller' && 'Người bán hàng'}
                              {role === 'customer' && 'Khách hàng'}
                            </p>
                          </div>
                          <div className="text-xl font-bold">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}