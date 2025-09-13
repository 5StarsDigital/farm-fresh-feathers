import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bird, ArrowLeft, Award, TrendingUp, Clock, Heart, Image, Video, FileText } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import gaDongTao from '@/assets/ga-dong-tao.jpg';
import gaRi from '@/assets/ga-ri.jpg';

const ChickenDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [chicken, setChicken] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [renting, setRenting] = useState(false);

  // Static data as fallback
  const staticChickenData = {
    '1': {
      id: '1',
      name: "Gà Đông Tảo",
      description: "Gà đặc sản Việt Nam với chân to, thịt thơm ngon",
      eggs_per_period: 280,
      days_per_period: 365,
      price: 150000,
      image_url: gaDongTao,
      detailed_description: "Gà Đông Tảo là giống gà đặc sản của Việt Nam, nổi tiếng với đôi chân to, vảy chân dày và thịt thơm ngon. Đây là giống gà quý hiếm, được nuôi chủ yếu ở vùng Đông Tảo, Hưng Yên.",
      characteristics: [
        "Chân to, vảy chân dày đặc trưng",
        "Thịt thơm ngon, mềm ngọt",
        "Kháng bệnh tốt, thích nghi cao",
        "Trứng có kích thước lớn, dinh dưỡng cao"
      ],
      care_requirements: [
        "Cần không gian rộng rãi",
        "Chế độ dinh dưỡng đặc biệt",
        "Kiểm tra sức khỏe định kỳ",
        "Môi trường sạch sẽ, thoáng mát"
      ]
    },
    '2': {
      id: '2',
      name: "Gà Rí",
      description: "Gà lai năng suất cao, cho trứng nhiều",
      eggs_per_period: 250,
      days_per_period: 365,
      price: 120000,
      image_url: gaRi,
      detailed_description: "Gà Rí là giống gà lai được chọn lọc từ các giống gà tốt, có năng suất đẻ trứng cao và thích nghi tốt với điều kiện khí hậu Việt Nam.",
      characteristics: [
        "Năng suất đẻ trứng cao",
        "Thích nghi tốt với khí hậu",
        "Tăng trọng nhanh",
        "Kháng bệnh tương đối tốt"
      ],
      care_requirements: [
        "Dễ chăm sóc, ít đòi hỏi",
        "Thức ăn đa dạng",
        "Vệ sinh chuồng trại thường xuyên",
        "Tiêm phòng đầy đủ"
      ]
    }
  };

  useEffect(() => {
    if (id) {
      loadChickenDetail();
    }
  }, [id]);

  const loadChickenDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('chicken_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        // Use static data as fallback
        const staticData = staticChickenData[id as keyof typeof staticChickenData];
        if (staticData) {
          setChicken(staticData);
        } else {
          toast({
            title: "Lỗi",
            description: "Không thể tải thông tin gà giống",
            variant: "destructive"
          });
          navigate('/shop/chickens');
          return;
        }
      } else {
        setChicken(data);
      }
    } catch (error) {
      console.error('Error:', error);
      // Try static data
      const staticData = staticChickenData[id as keyof typeof staticChickenData];
      if (staticData) {
        setChicken(staticData);
      } else {
        navigate('/shop/chickens');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRentChicken = async () => {
    if (!user) {
      toast({
        title: "Cần đăng nhập",
        description: "Bạn cần đăng nhập để thuê gà",
        variant: "destructive"
      });
      return;
    }

    setRenting(true);
    try {
      const { data, error } = await supabase.functions.invoke('rent-chicken', {
        body: {
          chickenTypeId: id,
          quantity: 1
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Thuê thành công!",
          description: `Đã thuê ${chicken.name}. Số dư còn lại: ${formatCurrency(data.new_balance)}`
        });
        navigate('/farm');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error renting chicken:', error);
      toast({
        title: "Lỗi thuê gà",
        description: error.message || "Có lỗi xảy ra khi thuê gà",
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

  const calculateDailyEggs = () => {
    if (!chicken) return 0;
    return Math.round((chicken.eggs_per_period / chicken.days_per_period) * 100) / 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <p>Đang tải thông tin gà giống...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!chicken) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <p>Không tìm thấy thông tin gà giống</p>
              <Link to="/shop/chickens">
                <Button className="mt-4">Quay lại danh sách gà giống</Button>
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
            <Link to="/shop/chickens" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách gà giống
            </Link>
          </div>

          {/* Main Image */}
          <div className="mb-8">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img 
                src={chicken.image_url || '/placeholder.svg'} 
                alt={chicken.name} 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

          {/* Chicken Info */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-4">{chicken.name}</h1>
                <p className="text-lg text-muted-foreground mb-6">{chicken.description}</p>
                
                <div className="flex items-center gap-4 mb-6">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {chicken.eggs_per_period || chicken.egg_production_rate} trứng/năm
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {calculateDailyEggs()} trứng/ngày
                  </Badge>
                </div>
              </div>

              {/* Detailed Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bird className="w-5 h-5" />
                    Mô tả chi tiết
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chicken.detailed_content?.content ? (
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: chicken.detailed_content.content
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
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      {chicken.detailed_description || `${chicken.name} là một trong những giống gà được ưa chuộng nhất hiện nay với khả năng sản xuất trứng ổn định và chất lượng cao. Giống gà này có khả năng thích nghi tốt với điều kiện khí hậu Việt Nam và dễ dành chăm sóc.`}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Images from detailed content */}
              {chicken.detailed_content?.images && chicken.detailed_content.images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="w-5 h-5" />
                      Hình ảnh chi tiết
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {chicken.detailed_content.images.map((img: any, index: number) => (
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
              {chicken.detailed_content?.videos && chicken.detailed_content.videos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Video giới thiệu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {chicken.detailed_content.videos.map((video: any, index: number) => (
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

              {/* Characteristics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Đặc điểm nổi bật
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(chicken.characteristics && chicken.characteristics.length > 0 ? chicken.characteristics : [
                      "Năng suất đẻ trứng cao và ổn định",
                      "Thích nghi tốt với khí hậu nhiệt đới",
                      "Kháng bệnh tốt, ít bị ốm",
                      "Trứng có chất lượng dinh dưỡng cao"
                    ]).map((characteristic: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-muted-foreground">{characteristic}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Care Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Yêu cầu chăm sóc
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(chicken.care_requirements && chicken.care_requirements.length > 0 ? chicken.care_requirements : [
                      "Cung cấp thức ăn đầy đủ dinh dưỡng",
                      "Đảm bảo nguồn nước sạch thường xuyên",
                      "Vệ sinh chuồng trại định kỳ",
                      "Kiểm tra sức khỏe và tiêm phòng"
                    ]).map((requirement: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-muted-foreground">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Thông tin thuê</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="text-center">
                      <span className="text-3xl font-bold text-primary">
                        {formatCurrency(chicken.price)}
                      </span>
                      <p className="text-muted-foreground text-sm">per con/tháng</p>
                    </div>
                    
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sản lượng năm:</span>
                        <span className="font-medium">{chicken.eggs_per_period || chicken.egg_production_rate} trứng</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Sản lượng ngày:</span>
                        <span className="font-medium">{calculateDailyEggs()} trứng</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Chu kỳ:</span>
                        <span className="font-medium">{chicken.days_per_period || 365} ngày</span>
                      </div>
                    </div>
                  </div>

                  <Link to={`/checkout?chickenId=${chicken.id}`}>
                    <Button 
                      className="w-full" 
                      size="lg"
                    >
                      Thuê ngay
                    </Button>
                  </Link>

                  <p className="text-xs text-muted-foreground text-center">
                    Miễn phí vận chuyển và bảo hành sức khỏe
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

export default ChickenDetail;