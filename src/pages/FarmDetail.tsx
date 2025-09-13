import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Star, Home, ArrowLeft, Camera, Ruler, Calendar, Shield, Image, Video, FileText } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const FarmDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [renting, setRenting] = useState(false);

  useEffect(() => {
    if (id) {
      loadFarmDetail();
    }
  }, [id]);

  const loadFarmDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('available_farms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading farm detail:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin trang trại",
          variant: "destructive"
        });
        navigate('/shop');
        return;
      }

      setFarm(data);
    } catch (error) {
      console.error('Error:', error);
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const handleRentFarm = async () => {
    if (!user) {
      toast({
        title: "Cần đăng nhập",
        description: "Bạn cần đăng nhập để thuê trang trại",
        variant: "destructive"
      });
      return;
    }

    setRenting(true);
    try {
      const { data, error } = await supabase.functions.invoke('rent-farm', {
        body: { availableFarmId: id }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Thuê thành công!",
          description: `Đã thuê ${farm.name}. Số dư còn lại: ${formatCurrency(data.new_balance)}`
        });
        navigate('/farm');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error renting farm:', error);
      toast({
        title: "Lỗi thuê trang trại",
        description: error.message || "Có lỗi xảy ra khi thuê trang trại",
        variant: "destructive"
      });
    } finally {
      setRenting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <p>Đang tải thông tin trang trại...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <p>Không tìm thấy trang trại</p>
              <Link to="/shop">
                <Button className="mt-4">Quay lại trang shop</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <div className="mb-6">
            <Link to="/shop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách trang trại
            </Link>
          </div>

          {/* Main Image */}
          <div className="mb-8">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img 
                src={farm.image_url || '/placeholder.svg'} 
                alt={farm.name} 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

          {/* Farm Info */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-4">{farm.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{farm.location}</span>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{farm.rating}</span>
                    <span className="text-muted-foreground">({farm.review_count} đánh giá)</span>
                  </div>
                  <Badge variant={farm.available_coops > 0 ? "default" : "secondary"}>
                    {farm.available_coops > 0 ? "Còn chỗ trống" : "Hết chỗ"}
                  </Badge>
                </div>
              </div>

              {/* Detailed Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Thông tin chi tiết
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Display rich content from database */}
                  {farm.detailed_content?.content && (
                    <div className="prose prose-sm max-w-none mb-4">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: farm.detailed_content.content
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
                            .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
                            .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
                            .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
                            .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
                            .replace(/\n/g, '<br>')
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Basic farm info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tổng số chuồng</p>
                        <p className="font-semibold">{farm.total_coops} chuồng</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">Còn trống</p>
                        <p className="font-semibold text-green-600">{farm.available_coops} chuồng</p>
                      </div>
                    </div>
                  </div>

                  {farm.min_chickens_per_coop && farm.max_chickens_per_coop && (
                    <div className="flex items-center gap-2">
                      <span>🐔</span>
                      <div>
                        <p className="text-sm text-muted-foreground">Sức chứa mỗi chuồng</p>
                        <p className="font-semibold">{farm.min_chickens_per_coop}-{farm.max_chickens_per_coop} con gà</p>
                      </div>
                    </div>
                  )}

                  {/* Default description if no custom content */}
                  {!farm.detailed_content?.content && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-2">Mô tả trang trại</h4>
                      <p className="text-muted-foreground">
                        Trang trại {farm.name} được trang bị đầy đủ tiện nghi hiện đại, 
                        hệ thống chuồng trại được thiết kế theo tiêu chuẩn quốc tế, 
                        đảm bảo môi trường sống tối ưu cho đàn gà. Hệ thống camera giám sát 24/7, 
                        hệ thống thông gió tự động và kiểm soát nhiệt độ.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Images from detailed content */}
              {farm.detailed_content?.images && farm.detailed_content.images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="w-5 h-5" />
                      Hình ảnh chi tiết
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {farm.detailed_content.images.map((img: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <img 
                            src={img.url} 
                            alt={img.caption || `Hình ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          {img.caption && (
                            <p className="text-xs text-muted-foreground">{img.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Videos from detailed content */}
              {farm.detailed_content?.videos && farm.detailed_content.videos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Video giới thiệu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {farm.detailed_content.videos.map((video: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                            {video.url.includes('youtube.com') || video.url.includes('youtu.be') ? (
                              <iframe
                                src={video.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                className="w-full h-full"
                                frameBorder="0"
                                allowFullScreen
                              />
                            ) : (
                              <video 
                                src={video.url} 
                                controls 
                                className="w-full h-full"
                              />
                            )}
                          </div>
                          {video.caption && (
                            <p className="text-sm text-muted-foreground">{video.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Tiện ích và dịch vụ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {farm.features && farm.features.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {farm.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Camera giám sát 24/7</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Hệ thống an ninh</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">Chăm sóc hằng ngày</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ruler className="w-4 h-4 text-orange-500" />
                        <span className="text-sm">Môi trường chuẩn hóa</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pricing Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Thông tin giá</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Giá thuê chuồng:</span>
                      <span className="font-semibold text-lg text-primary">
                        {formatCurrency(farm.rental_price)}/tháng
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Chi phí duy trì:</span>
                      <span className="font-medium">
                        {formatCurrency(farm.monthly_cost)}/tháng
                      </span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Tổng chi phí:</span>
                        <span className="font-bold text-lg text-primary">
                          {formatCurrency(farm.rental_price + farm.monthly_cost)}/tháng
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link to={`/checkout?farmId=${farm.id}`}>
                    <Button 
                      className="w-full" 
                      size="lg"
                      disabled={farm.available_coops === 0}
                    >
                      {farm.available_coops === 0 ? 'Hết chỗ' : 'Thuê ngay'}
                    </Button>
                  </Link>

                  <p className="text-xs text-muted-foreground text-center">
                    Bạn có thể hủy thuê bất cứ lúc nào
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FarmDetail;