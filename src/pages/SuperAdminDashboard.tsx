import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, Settings, Activity, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [yearlyRevenue, setYearlyRevenue] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

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
      
      // Fetch users with profiles and roles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          created_at,
          user_roles!inner(role)
        `)
        .order('created_at', { ascending: false });

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
      
      // Transform users data
      const usersWithRoles = profilesData?.map((profile: any) => ({
        ...profile,
        role: (profile.user_roles as any)?.[0]?.role || 'customer'
      })) || [];
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
      'staff': 'outline',
      'customer': 'outline',
    };
    return <Badge variant={variants[role] || 'outline'}>{role}</Badge>;
  };

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activities">Hoạt động</TabsTrigger>
            <TabsTrigger value="payments">Thanh toán</TabsTrigger>
            <TabsTrigger value="users">Người dùng</TabsTrigger>
            <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          </TabsList>

          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle>Hoạt động giao dịch</CardTitle>
                <p className="text-muted-foreground">Tất cả hoạt động mua bán, thu hoạch trứng</p>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Thời gian</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <Badge variant="outline">{transaction.transaction_type}</Badge>
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.quantity || '-'}</TableCell>
                          <TableCell>{transaction.amount ? formatCurrency(Number(transaction.amount)) : '-'}</TableCell>
                          <TableCell>{new Date(transaction.created_at).toLocaleString('vi-VN')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Giao dịch thanh toán</CardTitle>
                <p className="text-muted-foreground">Tất cả hoạt động nạp tiền, rút tiền</p>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Phương thức</TableHead>
                        <TableHead>Mã giao dịch</TableHead>
                        <TableHead>Thời gian</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>{payment.payment_method || 'N/A'}</TableCell>
                          <TableCell className="font-mono text-sm">{payment.id.slice(0, 8)}...</TableCell>
                          <TableCell>{new Date(payment.created_at).toLocaleString('vi-VN')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý người dùng</CardTitle>
                <p className="text-muted-foreground">Thay đổi vai trò và quản lý người dùng</p>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Tên</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead>Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.full_name || 'Chưa cập nhật'}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString('vi-VN')}</TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) => updateUserRole(user.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="seller">Seller</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                    {['super_admin', 'admin', 'seller', 'staff', 'customer'].map(role => {
                      const count = users.filter(u => u.role === role).length;
                      return (
                        <div key={role} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                          <div>
                            <h4 className="font-medium capitalize">{role.replace('_', ' ')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {role === 'super_admin' && 'Quyền cao nhất hệ thống'}
                              {role === 'admin' && 'Quản trị viên'}
                              {role === 'seller' && 'Người bán hàng'}
                              {role === 'staff' && 'Nhân viên hỗ trợ'}
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