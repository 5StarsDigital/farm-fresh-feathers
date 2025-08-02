import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, DollarSign, Users, TrendingUp } from 'lucide-react';

export default function SellerDashboard() {
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

  if (!user || userRole !== 'seller') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Khu vực Người bán</h1>
          <p className="text-muted-foreground">Quản lý sản phẩm và bán hàng của bạn</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng sản phẩm</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+2 từ tháng trước</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15,200,000 ₫</div>
              <p className="text-xs text-muted-foreground">+12% từ tháng trước</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Khách hàng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142</div>
              <p className="text-xs text-muted-foreground">+5 khách hàng mới</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tăng trưởng</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+8.2%</div>
              <p className="text-xs text-muted-foreground">So với tháng trước</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Thêm, chỉnh sửa và quản lý các sản phẩm của bạn
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">Gà Đông Tảo</h4>
                  <p className="text-sm text-muted-foreground">Còn lại: 5 con</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">Gà Ri</h4>
                  <p className="text-sm text-muted-foreground">Còn lại: 8 con</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Theo dõi các đơn hàng mới nhất
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">Đơn hàng #001</h4>
                  <p className="text-sm text-muted-foreground">2 con gà Đông Tảo - 3,000,000 ₫</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">Đơn hàng #002</h4>
                  <p className="text-sm text-muted-foreground">1 con gà Ri - 800,000 ₫</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}