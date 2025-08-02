import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, Settings, Activity } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user, userRole, loading } = useAuth();

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Khu vực Super Admin</h1>
          <p className="text-muted-foreground">Quản lý toàn bộ hệ thống và cấu hình</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bảo mật</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">An toàn</div>
              <p className="text-xs text-muted-foreground">Tất cả hệ thống hoạt động bình thường</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cơ sở dữ liệu</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.9%</div>
              <p className="text-xs text-muted-foreground">Uptime hệ thống</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cấu hình</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Cài đặt hệ thống</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoạt động</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24/7</div>
              <p className="text-xs text-muted-foreground">Giám sát liên tục</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý vai trò</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Phân quyền và quản lý vai trò người dùng
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">Super Admin: 2</h4>
                  <p className="text-sm text-muted-foreground">Quyền cao nhất hệ thống</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">Admin: 5</h4>
                  <p className="text-sm text-muted-foreground">Quản trị viên</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">Seller: 89</h4>
                  <p className="text-sm text-muted-foreground">Người bán hàng</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">Customer: 1,188</h4>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cấu hình hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Cài đặt và cấu hình toàn bộ hệ thống
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">API Configuration</h4>
                  <p className="text-sm text-muted-foreground">Cấu hình API và webhook</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">Database Settings</h4>
                  <p className="text-sm text-muted-foreground">Cài đặt cơ sở dữ liệu</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">Security Policies</h4>
                  <p className="text-sm text-muted-foreground">Chính sách bảo mật</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}