import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Star, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
const Shop = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availableFarms, setAvailableFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rentingFarmId, setRentingFarmId] = useState<string | null>(null);

  // Load farms from database
  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    try {
      const { data, error } = await supabase
        .from('available_farms')
        .select('*')
        .order('rating', { ascending: false })
        .order('name');
      
      if (error) {
        console.error('Error loading farms:', error);
        setAvailableFarms([]);
        return;
      }
      
      setAvailableFarms(data || []);
    } catch (error) {
      console.error('Error loading farms:', error);
      setAvailableFarms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRentFarm = async (farmId: string) => {
    if (!user) {
      toast({
        title: "Cần đăng nhập",
        description: "Bạn cần đăng nhập để thuê trang trại",
        variant: "destructive"
      });
      return;
    }

    setRentingFarmId(farmId);
    
    try {
      const { data, error } = await supabase.functions.invoke('rent-farm', {
        body: { availableFarmId: farmId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Thuê thành công!",
          description: `Đã thuê ${data.farm_name}. Số dư còn lại: ${formatCurrency(data.new_balance)}`,
        });
        
        // Reload farms to update available coops
        loadFarms();
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
      setRentingFarmId(null);
    }
  };


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
              <Link to="/shop" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                Trại gà cho thuê
              </Link>
              <Link to="/shop/chickens" className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80">
                Thuê gà
              </Link>
              <Link to="/shop/accessories" className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80">
                Mua phụ kiện
              </Link>
            </nav>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Trại gà cho thuê</h1>
            </div>
            <p className="text-muted-foreground">Thuê không gian trại gà để nuôi gà của bạn</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <p>Đang tải danh sách trang trại...</p>
              </div>
            ) : availableFarms.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p>Chưa có trang trại nào được thêm bởi quản trị viên.</p>
              </div>
            ) : (
              availableFarms.map(farm => {
                const farmData = {
                  id: farm.id,
                  name: farm.name || 'Unknown Farm',
                  location: farm.location || 'Unknown Location',
                  availableCoops: farm.available_coops || farm.availableCoops || 0,
                  totalCoops: farm.total_coops || farm.totalCoops || 0,
                  rentalPrice: farm.rental_price || farm.rentalPrice || 0,
                  monthlyCost: farm.monthly_cost || farm.monthlyCost || 0,
                  rating: farm.rating || 4.5,
                  reviewCount: farm.review_count || farm.reviewCount || 0,
                  image: farm.image_url || farm.image || '/placeholder.svg'
                };

                return (
                  <Card key={farmData.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img src={farmData.image} alt={farmData.name} className="w-full h-full object-cover" />
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{farmData.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {farmData.location}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>Còn trống: <strong>{farmData.availableCoops}/{farmData.totalCoops}</strong></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span><strong>{farmData.rating}</strong> ({farmData.reviewCount})</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Giá thuê:</span>
                          <span className="font-semibold text-primary">{formatCurrency(farmData.rentalPrice)}/tháng</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Chi phí phát sinh:</span>
                          <span className="text-sm">{formatCurrency(farmData.monthlyCost)}/tháng</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full mt-4" 
                        disabled={farmData.availableCoops === 0 || rentingFarmId === farmData.id.toString()}
                        onClick={() => handleRentFarm(farmData.id.toString())}
                      >
                        {farmData.availableCoops === 0 ? 'Hết chỗ' : 
                         rentingFarmId === farmData.id.toString() ? 'Đang thuê...' : 'Thuê ngay'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
export default Shop;