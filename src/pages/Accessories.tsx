import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import cameraMonitor from '@/assets/camera-monitor.jpg';
import heatLamp from '@/assets/heat-lamp.jpg';

const Accessories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [accessories, setAccessories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingAccessoryId, setBuyingAccessoryId] = useState<string | null>(null);

  // Load accessories from database
  useEffect(() => {
    loadAccessories();
  }, []);

  const loadAccessories = async () => {
    try {
      const { data, error } = await supabase
        .from('accessories' as any)
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error loading accessories:', error);
        // Use static data as fallback
        setAccessories(staticAccessories);
        return;
      }
      
      setAccessories(data || staticAccessories);
    } catch (error) {
      console.error('Error loading accessories:', error);
      setAccessories(staticAccessories);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyAccessory = async (accessoryId: string) => {
    if (!user) {
      toast({
        title: "Cần đăng nhập",
        description: "Bạn cần đăng nhập để mua phụ kiện",
        variant: "destructive"
      });
      return;
    }

    setBuyingAccessoryId(accessoryId);
    
    try {
      const { data, error } = await supabase.functions.invoke('buy-accessory', {
        body: { accessoryId: accessoryId, quantity: 1 }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Mua thành công!",
          description: `Đã mua ${data.accessory_name}. Số dư còn lại: ${formatCurrency(data.new_balance)}`,
        });
        
        // Trigger balance update in navigation
        window.dispatchEvent(new CustomEvent('balanceUpdate'));
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error buying accessory:', error);
      toast({
        title: "Lỗi mua phụ kiện",
        description: error.message || "Có lỗi xảy ra khi mua phụ kiện",
        variant: "destructive"
      });
    } finally {
      setBuyingAccessoryId(null);
    }
  };

  const staticAccessories = [{
    id: 1,
    name: "Camera quan sát",
    description: "Theo dõi gà từ xa",
    price: 150000,
    effect_type: "monitoring",
    effect_value: 1,
    image_url: cameraMonitor
  }, {
    id: 2,
    name: "Đèn sưởi ấm",
    description: "Giữ ấm cho gà, tăng sức khỏe",
    price: 50000,
    effect_type: "health_boost",
    effect_value: 1,
    image_url: heatLamp
  }];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <nav className="flex justify-center gap-6 mb-8">
              <Link to="/shop" className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80">
                Trại gà cho thuê
              </Link>
              <Link to="/shop/chickens" className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80">
                Thuê gà
              </Link>
              <Link to="/shop/accessories" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                Mua phụ kiện
              </Link>
            </nav>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Mua phụ kiện</h1>
            </div>
            <p className="text-muted-foreground">Mua các phụ kiện để nâng cao hiệu quả trại gà</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {accessories.map(accessory => (
              <Card key={accessory.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img src={accessory.image_url} alt={accessory.name} className="w-full h-full object-cover" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{accessory.name}</CardTitle>
                  <CardDescription>{accessory.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Hiệu ứng:</span>
                    <Badge variant="outline">{accessory.effect_type}: +{accessory.effect_value}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Giá bán:</span>
                    <span className="font-semibold text-primary">{formatCurrency(accessory.price)}</span>
                  </div>
                  <Button 
                    className="w-full"
                    disabled={buyingAccessoryId === accessory.id?.toString()}
                    onClick={() => handleBuyAccessory(accessory.id?.toString() || accessory.id)}
                  >
                    {buyingAccessoryId === accessory.id?.toString() ? 'Đang mua...' : 'Mua ngay'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Accessories;