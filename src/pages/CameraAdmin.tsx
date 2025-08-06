import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Search, Edit, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ServicePackage {
  id: string;
  user_id: string;
  farm_id: string;
  package_name: string;
  package_price: number;
  selected_chicken_type_name: string;
  selected_chicken_quantity: number;
  coop_name: string;
  total_amount: number;
  purchased_at: string;
  status: string;
  rtsp_url: string | null;
  user_email?: string;
  user_name?: string;
}

export default function CameraAdmin() {
  const { user, userRole, loading } = useAuth();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRtsp, setEditingRtsp] = useState<string | null>(null);
  const [rtspValue, setRtspValue] = useState('');

  useEffect(() => {
    if (user && (userRole === 'admin' || userRole === 'super_admin')) {
      fetchServicePackages();
    }
  }, [user, userRole]);

  const fetchServicePackages = async () => {
    try {
      console.log('Fetching service packages...');
      // Get service packages first
      const { data: packagesData, error: packagesError } = await supabase
        .from('service_packages')
        .select('*')
        .order('purchased_at', { ascending: false });

      if (packagesError) {
        console.error('Error fetching packages:', packagesError);
        throw packagesError;
      }

      console.log('Packages found:', packagesData?.length);

      // Get user info for each package
      const packagesWithUserInfo = await Promise.all(
        (packagesData || []).map(async (pkg) => {
          try {
            console.log('Processing package:', pkg.id, 'farm_id:', pkg.farm_id);
            
            // Get farm owner info
            const { data: farmData, error: farmError } = await supabase
              .from('farms')
              .select('user_id')
              .eq('id', pkg.farm_id)
              .single();

            console.log('Farm data for package', pkg.id, ':', farmData, 'Error:', farmError);

            if (farmError || !farmData?.user_id) {
              console.log('No farm found or no user_id for package:', pkg.id);
              return {
                ...pkg,
                user_email: 'No farm found',
                user_name: 'No farm found'
              };
            }

            // Get user profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', farmData.user_id)
              .single();

            console.log('Profile data for user', farmData.user_id, ':', profileData, 'Error:', profileError);

            if (profileError) {
              console.log('Profile error for user:', farmData.user_id, profileError);
              return {
                ...pkg,
                user_email: `Profile error: ${profileError.message}`,
                user_name: `Profile error: ${profileError.message}`
              };
            }

            const result = {
              ...pkg,
              user_email: profileData?.email || 'No email',
              user_name: profileData?.full_name || 'No name'
            };

            console.log('Final result for package:', pkg.id, result.user_name, result.user_email);
            return result;
          } catch (error) {
            console.error('Error fetching user info for package:', pkg.id, error);
            return {
              ...pkg,
              user_email: `Error: ${error}`,
              user_name: `Error: ${error}`
            };
          }
        })
      );

      console.log('Final packages with user info:', packagesWithUserInfo);
      setPackages(packagesWithUserInfo);
    } catch (error) {
      console.error('Error fetching service packages:', error);
      toast.error('Lỗi khi tải dữ liệu gói dịch vụ');
    }
  };

  const handleUpdateRtsp = async (packageId: string) => {
    try {
      const { error } = await supabase
        .from('service_packages')
        .update({ rtsp_url: rtspValue || null })
        .eq('id', packageId);

      if (error) throw error;

      // Log admin activity
      await logAdminActivity('rtsp_update', `Cập nhật RTSP cho gói ${packageId}`, {
        packageId,
        rtspUrl: rtspValue
      }, 'service_packages', packageId);

      toast.success('Cập nhật RTSP thành công');
      setEditingRtsp(null);
      setRtspValue('');
      fetchServicePackages();
    } catch (error) {
      console.error('Error updating RTSP:', error);
      toast.error('Lỗi khi cập nhật RTSP');
    }
  };

  const logAdminActivity = async (actionType: string, description: string, details: any = {}, targetTable?: string, targetId?: string) => {
    try {
      await supabase.rpc('log_admin_activity', {
        p_action_type: actionType,
        p_description: description,
        p_details: details,
        p_target_table: targetTable,
        p_target_id: targetId
      });
    } catch (error) {
      console.error('Error logging admin activity:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPackages = packages.filter(pkg => 
    pkg.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.package_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (!user || (userRole !== 'admin' && userRole !== 'super_admin')) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Camera className="h-8 w-8" />
            Quản lý Camera
          </h1>
          <p className="text-muted-foreground">Quản lý RTSP cho các gói dịch vụ</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng gói dịch vụ</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packages.length}</div>
              <p className="text-xs text-muted-foreground">Gói đã bán</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Có RTSP</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packages.filter(p => p.rtsp_url).length}</div>
              <p className="text-xs text-muted-foreground">Gói có camera</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chưa có RTSP</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{packages.filter(p => !p.rtsp_url).length}</div>
              <p className="text-xs text-muted-foreground">Gói chưa setup</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Tìm kiếm theo email, tên khách hàng hoặc tên gói..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid gap-4">
          {filteredPackages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Không tìm thấy gói dịch vụ nào</p>
              </CardContent>
            </Card>
          ) : (
            filteredPackages.map((pkg) => (
              <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Package Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{pkg.package_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {pkg.user_name} ({pkg.user_email})
                          </p>
                        </div>
                        <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                          {pkg.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Giống gà:</span>
                          <p className="font-medium">{pkg.selected_chicken_type_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Số lượng:</span>
                          <p className="font-medium">{pkg.selected_chicken_quantity} con</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Chuồng:</span>
                          <p className="font-medium">{pkg.coop_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tổng tiền:</span>
                          <p className="font-medium">{formatCurrency(pkg.total_amount)}</p>
                        </div>
                      </div>

                      <div className="mt-4 text-sm text-muted-foreground">
                        Mua ngày: {formatDate(pkg.purchased_at)}
                      </div>
                    </div>

                    {/* RTSP Section */}
                    <div className="md:w-80 border-l md:pl-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">RTSP Camera</h4>
                        {editingRtsp !== pkg.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingRtsp(pkg.id);
                              setRtspValue(pkg.rtsp_url || '');
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Chỉnh sửa
                          </Button>
                        )}
                      </div>

                      {editingRtsp === pkg.id ? (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="rtsp">RTSP URL</Label>
                            <Input
                              id="rtsp"
                              value={rtspValue}
                              onChange={(e) => setRtspValue(e.target.value)}
                              placeholder="rtsp://example.com/stream"
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateRtsp(pkg.id)}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Lưu
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingRtsp(null);
                                setRtspValue('');
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Hủy
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {pkg.rtsp_url ? (
                            <div className="space-y-2">
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm font-mono break-all">{pkg.rtsp_url}</p>
                              </div>
                              <Badge variant="default" className="text-xs">
                                <Camera className="h-3 w-3 mr-1" />
                                Đã cấu hình
                              </Badge>
                            </div>
                          ) : (
                            <div className="p-3 bg-muted rounded-lg text-center">
                              <p className="text-sm text-muted-foreground">Chưa cấu hình RTSP</p>
                              <Badge variant="secondary" className="text-xs mt-2">
                                Chưa setup
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}