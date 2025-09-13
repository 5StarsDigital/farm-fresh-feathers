import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bird } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import gaDongTao from '@/assets/ga-dong-tao.jpg';
import gaRi from '@/assets/ga-ri.jpg';

const ChickenTypesSection = () => {
  const [chickenTypes, setChickenTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const staticChickenTypes = [{
    id: '1',
    name: "Gà Đông Tảo",
    description: "Gà đặc sản Việt Nam với chân to, thịt thơm ngon",
    eggs_per_period: 280,
    days_per_period: 365,
    price: 150000,
    image_url: gaDongTao
  }, {
    id: '2',
    name: "Gà Rí",
    description: "Gà lai năng suất cao, cho trứng nhiều",
    eggs_per_period: 250,
    days_per_period: 365,
    price: 120000,
    image_url: gaRi
  }];

  useEffect(() => {
    loadTopChickenTypes();
  }, []);

  const loadTopChickenTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('chicken_types')
        .select('*')
        .order('price', { ascending: false })
        .limit(4);
      
      if (error) {
        console.error('Error loading chicken types:', error);
        setChickenTypes(staticChickenTypes);
        return;
      }
      
      // Use database data if available, otherwise fallback to static
      setChickenTypes(data && data.length > 0 ? data : staticChickenTypes);
    } catch (error) {
      console.error('Error loading chicken types:', error);
      setChickenTypes(staticChickenTypes);
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
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Bird className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Gà Giống Chất Lượng
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Lựa chọn những giống gà tốt nhất để tối ưu hóa sản lượng trứng cho trang trại của bạn
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Đang tải danh sách gà giống...</p>
          </div>
        ) : chickenTypes.length === 0 ? (
          <div className="text-center py-8">
            <p>Chưa có gà giống nào có sẵn.</p>
            <Link to="/shop/chickens" className="inline-block mt-4 text-primary hover:underline">
              Xem tất cả gà giống →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {chickenTypes.map((chicken) => (
              <Card key={chicken.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img 
                    src={chicken.image_url || '/placeholder.svg'} 
                    alt={chicken.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl">{chicken.name}</CardTitle>
                  <CardDescription>{chicken.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sản lượng trứng:</span>
                      <Badge variant="secondary">
                        {chicken.eggs_per_period || chicken.egg_production_rate} trứng/năm
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sản lượng hàng ngày:</span>
                      <span className="font-medium text-primary">
                        {Math.round(((chicken.eggs_per_period || chicken.egg_production_rate) / (chicken.days_per_period || 365)) * 100) / 100} trứng/ngày
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Giá thuê:</span>
                      <span className="font-semibold text-lg text-primary">
                        {formatCurrency(chicken.price)}/con/tháng
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link to={`/chicken-detail/${chicken.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Xem chi tiết
                      </Button>
                    </Link>
                    <Link to="/checkout" className="flex-1">
                      <Button className="w-full">
                        Thuê ngay
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link to="/shop/chickens">
            <Button variant="outline" size="lg" className="gap-2">
              <Bird className="w-4 h-4" />
              Xem tất cả gà giống
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ChickenTypesSection;