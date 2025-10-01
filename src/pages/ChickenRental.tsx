import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bird, Egg, Beef, Crown, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import gaDongTao from '@/assets/ga-dong-tao.jpg';
import gaRi from '@/assets/ga-ri.jpg';
const ChickenRental = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [chickenTypes, setChickenTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rentingChickenId, setRentingChickenId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredChickenTypes, setFilteredChickenTypes] = useState<any[]>([]);

  // Load chicken types from database
  useEffect(() => {
    loadChickenTypes();
  }, []);

  // Filter chicken types based on category and search query
  useEffect(() => {
    let filtered = chickenTypes;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(chicken => chicken.chicken_category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chicken => 
        chicken.name.toLowerCase().includes(query) ||
        chicken.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredChickenTypes(filtered);
  }, [chickenTypes, selectedCategory, searchQuery]);
  const loadChickenTypes = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('chicken_types' as any).select('*').order('name');
      if (error) {
        console.error('Error loading chicken types:', error);
        // Use static data as fallback
        setChickenTypes(staticChickenTypes);
        return;
      }
      setChickenTypes(data || staticChickenTypes);
    } catch (error) {
      console.error('Error loading chicken types:', error);
      setChickenTypes(staticChickenTypes);
    } finally {
      setLoading(false);
    }
  };
  const handleRentChicken = async (chickenId: string) => {
    if (!user) {
      toast({
        title: "Cần đăng nhập",
        description: "Bạn cần đăng nhập để thuê gà",
        variant: "destructive"
      });
      return;
    }
    setRentingChickenId(chickenId);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('rent-chicken', {
        body: {
          chickenTypeId: chickenId,
          quantity: 1
        }
      });
      if (error) throw error;
      if (data.success) {
        toast({
          title: "Thuê thành công!",
          description: `Đã thuê ${data.chicken_name}. Số dư còn lại: ${formatCurrency(data.new_balance)}`
        });

        // Trigger balance update in navigation
        window.dispatchEvent(new CustomEvent('balanceUpdate'));
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
      setRentingChickenId(null);
    }
  };
  const staticChickenTypes = [{
    id: 1,
    name: "Gà Đông Tảo (Mái)",
    description: "Gà đặc sản Việt Nam",
    egg_production_rate: 0,
    eggs_per_period: 0,
    price: 150000,
    image_url: gaDongTao,
    chicken_category: 'meat',
    gender: 'hen'
  }, {
    id: 2,
    name: "Gà Rí (Mái)",
    description: "Gà lai, cho trứng nhiều",
    egg_production_rate: 250,
    eggs_per_period: 250,
    price: 120000,
    image_url: gaRi,
    chicken_category: 'egg_laying',
    gender: 'hen'
  }];
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'egg_laying':
        return { icon: Egg, label: 'Gà lấy trứng', color: 'bg-green-100 text-green-800' };
      case 'meat':
        return { icon: Beef, label: 'Gà lấy thịt', color: 'bg-orange-100 text-orange-800' };
      case 'royal':
        return { icon: Crown, label: 'Gà tiến vua', color: 'bg-purple-100 text-purple-800' };
      case 'other':
        return { icon: Bird, label: 'Gà khác', color: 'bg-gray-100 text-gray-800' };
      default:
        return { icon: Bird, label: 'Gà giống', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const categories = [
    { id: 'all', label: 'Tất cả', icon: Bird },
    { id: 'egg_laying', label: 'Gà lấy trứng', icon: Egg },
    { id: 'meat', label: 'Gà lấy thịt', icon: Beef },
    { id: 'royal', label: 'Gà tiến vua', icon: Crown },
    { id: 'other', label: 'Gà khác', icon: Bird },
  ];

  const getGenderInfo = (gender: string) => {
    switch (gender) {
      case 'hen':
        return { label: 'Mái', color: 'bg-pink-100 text-pink-800' };
      case 'rooster':
        return { label: 'Trống', color: 'bg-blue-100 text-blue-800' };
      default:
        return { label: 'Hỗn hợp', color: 'bg-gray-100 text-gray-800' };
    }
  };
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <nav className="flex justify-center gap-6 mb-8">
              <Link to="/shop" className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80">Trại gà Mini</Link>
              <Link to="/shop/chickens" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">Gà giống</Link>
            </nav>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Bird className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Giống gà</h1>
            </div>
            <p className="text-muted-foreground">Thuê gà để tăng sản lượng trứng cho trại của bạn</p>
          </div>
          
          {/* Category Filter and Search */}
          <div className="mb-8">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {categories.map(category => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="gap-2"
                  >
                    <IconComponent className="w-4 h-4" />
                    {category.label}
                  </Button>
                );
              })}
            </div>
            
            {/* Search Box */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm kiếm giống gà..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Đang tải danh sách gà giống...</p>
            </div>
          ) : filteredChickenTypes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Không tìm thấy gà giống phù hợp với bộ lọc'
                  : 'Chưa có gà giống nào'
                }
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredChickenTypes.map(chicken => (
                <Card key={chicken.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img src={chicken.image_url} alt={chicken.name} className="w-full h-full object-cover" />
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{chicken.name}</CardTitle>
                      <div className="flex gap-1">
                        {chicken.chicken_category && (
                          <Badge className={getCategoryInfo(chicken.chicken_category).color}>
                            {getCategoryInfo(chicken.chicken_category).label}
                          </Badge>
                        )}
                        {chicken.gender && (
                          <Badge className={getGenderInfo(chicken.gender).color}>
                            {getGenderInfo(chicken.gender).label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>{chicken.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {chicken.chicken_category === 'egg_laying' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Sản lượng trứng:</span>
                        <Badge variant="secondary">{chicken.eggs_per_period || chicken.egg_production_rate} trứng/năm</Badge>
                      </div>
                    )}
                    
                    {chicken.chicken_category === 'meat' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Loại:</span>
                        <Badge variant="outline">Gà thịt chất lượng cao</Badge>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Giá Trống:</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(chicken.rooster_price || chicken.price)}/con</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Giá Mái:</span>
                        <span className="font-semibold text-pink-600">{formatCurrency(chicken.hen_price || chicken.price)}/con</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/chicken-detail/${chicken.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Xem chi tiết
                        </Button>
                      </Link>
                      <Button 
                        className="flex-1" 
                        disabled={rentingChickenId === chicken.id?.toString()} 
                        onClick={() => {
                          navigate(`/checkout?chickenId=${chicken.id}`);
                        }}
                      >
                        Thuê ngay
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>;
};
export default ChickenRental;