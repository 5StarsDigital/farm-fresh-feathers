import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, Clipboard, BarChart3 } from 'lucide-react';

export default function StaffDashboard() {
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

  if (!user || userRole !== 'staff') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Khu vực Staff</h1>
          <p className="text-muted-foreground">Quản lý công việc và hỗ trợ khách hàng</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hỗ trợ khách hàng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">Yêu cầu hỗ trợ hôm nay</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quản lý đơn hàng</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48</div>
              <p className="text-xs text-muted-foreground">Đơn hàng cần xử lý</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Báo cáo</CardTitle>
              <Clipboard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Báo cáo tuần này</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hiệu suất</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">95%</div>
              <p className="text-xs text-muted-foreground">Điểm đánh giá trung bình</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Nhiệm vụ hôm nay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">Kiểm tra đơn hàng #1234</h4>
                  <p className="text-sm text-muted-foreground">Xác nhận và chuẩn bị giao hàng</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Đang xử lý</span>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">Hỗ trợ khách hàng VIP</h4>
                  <p className="text-sm text-muted-foreground">Giải đáp thắc mắc về sản phẩm</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Ưu tiên cao</span>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">Cập nhật kho hàng</h4>
                  <p className="text-sm text-muted-foreground">Kiểm tra và cập nhật số lượng tồn kho</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Thường xuyên</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thống kê công việc</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Đơn hàng đã xử lý</span>
                  <span className="text-lg font-bold">156</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Khách hàng đã hỗ trợ</span>
                  <span className="text-lg font-bold">89</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Báo cáo đã tạo</span>
                  <span className="text-lg font-bold">23</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Đánh giá trung bình</span>
                  <span className="text-lg font-bold">4.8/5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}