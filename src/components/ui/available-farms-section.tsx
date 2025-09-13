import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, DollarSign, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const AvailableFarmsSection = () => {
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopFarms();
  }, []);

  const loadTopFarms = async () => {
    try {
      const { data, error } = await supabase
        .from('available_farms')
        .select('*')
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(6);
      
      if (error) {
        console.error('Error loading farms:', error);
        setFarms([]);
        return;
      }
      
      setFarms(data || []);
    } catch (error) {
      console.error('Error loading farms:', error);
      setFarms([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trang Trại Mini Có Sẵn
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Khám phá các trang trại mini được thiết kế chuyên nghiệp, sẵn sàng cho việc nuôi gà của bạn
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Đang tải danh sách trang trại...</p>
          </div>
        ) : farms.length === 0 ? (
          <div className="text-center py-8">
            <p>Chưa có trang trại nào được thêm bởi quản trị viên.</p>
            <Link to="/shop" className="inline-block mt-4 text-primary hover:underline">
              Xem tất cả trang trại →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {farms.map((farm) => (
              <Card key={farm.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative">
                  <img 
                    src={farm.image_url || '/placeholder.svg'} 
                    alt={farm.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge variant={farm.available_coops > 0 ? "default" : "secondary"}>
                      {farm.available_coops > 0 ? "Có sẵn" : "Hết chỗ"}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl">{farm.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {farm.location}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-primary" />
                      <span>Còn trống: <span className="font-semibold">{farm.available_coops}/{farm.total_coops}</span></span>
                    </div>

                    {farm.min_chickens_per_coop !== undefined && farm.max_chickens_per_coop !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <span>🐔</span>
                        <span>Số lượng gà/chuồng: <span className="font-semibold text-primary">{farm.min_chickens_per_coop}-{farm.max_chickens_per_coop} con</span></span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span><span className="font-semibold">{farm.rating}</span> ({farm.review_count || 0} đánh giá)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>💰</span>
                        <span className="text-muted-foreground">Giá thuê:</span>
                      </div>
                      <span className="font-semibold text-primary">{formatCurrency(farm.rental_price)}/tháng</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>📊</span>
                        <span className="text-muted-foreground">Chi phí phát sinh:</span>
                      </div>
                      <span className="font-medium">{formatCurrency(farm.monthly_cost)}/tháng</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link to={`/farm-detail/${farm.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Xem chi tiết
                      </Button>
                    </Link>
                    <Link to="/checkout" className="flex-1">
                      <Button 
                        className="w-full" 
                        disabled={farm.available_coops === 0}
                        variant={farm.available_coops > 0 ? "default" : "secondary"}
                      >
                        {farm.available_coops > 0 ? "Thuê Ngay" : "Hết chỗ"}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AvailableFarmsSection;