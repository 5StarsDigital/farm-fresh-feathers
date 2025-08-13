import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/ui/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { Home, Camera, History, Egg, Wallet, ShoppingCart, Trophy, MessageCircle, MapPin, Truck, User as UserIcon } from 'lucide-react';
import UserPackagesSection from '@/components/ui/user-packages-section';
import AnimatedFarm from '@/components/ui/animated-farm';
import CameraMonitoring from '@/components/ui/camera-monitoring';
import { AddChickensDialog } from '@/components/ui/add-chickens-dialog';
import farmBackground from '@/assets/farm-background.jpg';

// Using any types temporarily until Supabase types are updated
interface Farm {
  id: string;
  farm_name: string;
  account_balance: number;
}
interface ChickenType {
  id: string;
  name: string;
  eggs_per_period: number;
  days_per_period: number;
  price: number;
  description: string;
}
interface UserChicken {
  id: string;
  quantity: number;
  chicken_types: ChickenType;
}
interface EggInventory {
  total_eggs: number;
}
interface Transaction {
  id: string;
  transaction_type: string;
  amount: number | null;
  quantity: number | null;
  description: string | null;
  created_at: string;
}
interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  shop_name: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
}
interface ProfileFormData {
  full_name: string;
  shop_name: string;
  date_of_birth: string;
  email: string;
}
interface ServicePackage {
  id: string;
  package_name: string;
  package_price: number;
  coop_name: string;
  coop_price: number;
  selected_chicken_type_name: string;
  selected_chicken_quantity: number;
  total_amount: number;
  purchased_at: string;
  status: string;
  selected_chicken_type_id: string;
}

interface CoopLimits {
  [coopName: string]: {
    min_chickens: number;
    max_chickens: number;
  };
}
const Farm = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [chickens, setChickens] = useState<UserChicken[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [coopLimits, setCoopLimits] = useState<CoopLimits>({});
  const [eggInventory, setEggInventory] = useState<EggInventory>({
    total_eggs: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [addingChickens, setAddingChickens] = useState<string | null>(null);
  const [selectedPackageForAddChickens, setSelectedPackageForAddChickens] = useState<ServicePackage | null>(null);
  const form = useForm<ProfileFormData>({
    defaultValues: {
      full_name: '',
      shop_name: '',
      date_of_birth: '',
      email: ''
    }
  });
  useEffect(() => {
    const initializeFarm = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      await loadUserProfile(user.id);
      await loadFarmData(user.id);
    };
    initializeFarm();

    // Auto refresh every 30 seconds to catch admin refunds
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
      if (user?.id) loadFarmData(user.id);
    }, 30000);
    return () => clearInterval(interval);
  }, [navigate]);
  const loadUserProfile = async (userId: string) => {
    try {
      let {
        data: profileData,
        error: profileError
      } = await (supabase as any).from('profiles').select('*').eq('id', userId).single();
      if (profileError && profileError.code === 'PGRST116') {
        // Create profile if doesn't exist
        const {
          data: newProfile,
          error: createError
        } = await (supabase as any).from('profiles').insert({
          id: userId,
          email: user?.email || '',
          full_name: '',
          shop_name: '',
          date_of_birth: null,
          avatar_url: null
        }).select().single();
        if (createError) throw createError;
        profileData = newProfile;
      } else if (profileError) {
        throw profileError;
      }
      setProfile(profileData);

      // Update form with loaded data
      form.reset({
        full_name: profileData.full_name || '',
        shop_name: profileData.shop_name || '',
        date_of_birth: profileData.date_of_birth || '',
        email: profileData.email || user?.email || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin cá nhân",
        variant: "destructive"
      });
    }
  };
  const saveProfile = async (data: ProfileFormData) => {
    if (!user || !profile) return;
    try {
      const {
        error
      } = await (supabase as any).from('profiles').update({
        full_name: data.full_name,
        shop_name: data.shop_name,
        date_of_birth: data.date_of_birth || null,
        email: data.email
      }).eq('id', user.id);
      if (error) throw error;
      setProfile(prev => prev ? {
        ...prev,
        full_name: data.full_name,
        shop_name: data.shop_name,
        date_of_birth: data.date_of_birth,
        email: data.email
      } : null);
      toast({
        title: "Thành công!",
        description: "Thông tin cá nhân đã được lưu"
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu thông tin cá nhân",
        variant: "destructive"
      });
    }
  };
  const loadFarmData = async (userId: string) => {
    try {
      // Get or create farm using any type to bypass TypeScript errors
      let {
        data: farmData,
        error: farmError
      } = await (supabase as any).from('farms').select('*').eq('user_id', userId).single();
      if (farmError && farmError.code === 'PGRST116') {
        // Create farm if doesn't exist
        const {
          data: newFarm,
          error: createError
        } = await (supabase as any).from('farms').insert({
          user_id: userId,
          farm_name: `Trang trại của ${user?.email?.split('@')[0] || 'bạn'}`,
          account_balance: 100000 // Starting balance
        }).select().single();
        if (createError) throw createError;
        farmData = newFarm;
      } else if (farmError) {
        throw farmError;
      }
      setFarm(farmData);

      // Get service packages
      const {
        data: servicePackageData,
        error: servicePackageError
      } = await (supabase as any).from('service_packages').select('*').eq('farm_id', farmData.id).eq('status', 'active').order('purchased_at', {
        ascending: false
      });
      if (servicePackageError) throw servicePackageError;
      setServicePackages(servicePackageData || []);

      // Load coop limits for service packages
      if (servicePackageData && servicePackageData.length > 0) {
        await loadCoopLimits(servicePackageData);
      }

      // Get chickens
      const {
        data: chickenData,
        error: chickenError
      } = await (supabase as any).from('user_chickens').select(`
          *,
          chicken_types (*)
        `).eq('farm_id', farmData.id);
      if (chickenError) throw chickenError;
      setChickens(chickenData || []);

      // Get or create egg inventory
      let {
        data: eggData,
        error: eggError
      } = await (supabase as any).from('eggs_inventory').select('*').eq('farm_id', farmData.id).single();
      if (eggError && eggError.code === 'PGRST116') {
        const {
          data: newEgg,
          error: createEggError
        } = await (supabase as any).from('eggs_inventory').insert({
          farm_id: farmData.id,
          total_eggs: 0
        }).select().single();
        if (createEggError) throw createEggError;
        eggData = newEgg;
      } else if (eggError) {
        throw eggError;
      }
      setEggInventory(eggData);

      // Get transaction history
      const {
        data: transactionData,
        error: transactionError
      } = await (supabase as any).from('transactions').select('*').eq('farm_id', farmData.id).order('created_at', {
        ascending: false
      }).limit(10);
      if (transactionError) throw transactionError;
      setTransactions(transactionData || []);
    } catch (error) {
      console.error('Error loading farm data:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu trang trại",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCoopLimits = async (packages: ServicePackage[]) => {
    try {
      const uniqueCoopNames = [...new Set(packages.map(pkg => pkg.coop_name))];
      const { data: coopData, error } = await supabase
        .from('available_farms')
        .select('name, min_chickens_per_coop, max_chickens_per_coop')
        .in('name', uniqueCoopNames);

      if (error) throw error;

      const limits: CoopLimits = {};
      coopData?.forEach(coop => {
        limits[coop.name] = {
          min_chickens: coop.min_chickens_per_coop || 10,
          max_chickens: coop.max_chickens_per_coop || 100
        };
      });

      // Set default limits for coops not found in available_farms
      uniqueCoopNames.forEach(coopName => {
        if (!limits[coopName]) {
          limits[coopName] = {
            min_chickens: 10,
            max_chickens: 100
          };
        }
      });

      setCoopLimits(limits);
    } catch (error) {
      console.error('Error loading coop limits:', error);
    }
  };
  const collectEggs = async (quantity: number) => {
    if (!farm || quantity <= 0) return;
    try {
      // Update egg inventory with the specified quantity
      const {
        error: updateError
      } = await (supabase as any).from('eggs_inventory').update({
        total_eggs: eggInventory.total_eggs + quantity
      }).eq('farm_id', farm.id);
      if (updateError) throw updateError;

      // Record transaction
      await (supabase as any).from('transactions').insert({
        farm_id: farm.id,
        transaction_type: 'egg_collection',
        quantity: quantity,
        description: `Thu hoạch ${quantity} quả trứng`
      });
      
      // Update local state using callback form to avoid async issues
      setEggInventory(prev => ({
        total_eggs: prev.total_eggs + quantity
      }));
      
      toast({
        title: "Thu hoạch thành công!",
        description: `Bạn đã thu được ${quantity} quả trứng`
      });
      await loadFarmData(user!.id);
    } catch (error) {
      console.error('Error collecting eggs:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thu hoạch trứng",
        variant: "destructive"
      });
    }
  };
  const sellEggs = async (quantity: number) => {
    if (!farm || quantity > eggInventory.total_eggs) return;
    try {
      const pricePerEgg = 3000; // 3,000 VND per egg
      const totalAmount = quantity * pricePerEgg;

      // Update egg inventory
      const {
        error: eggError
      } = await (supabase as any).from('eggs_inventory').update({
        total_eggs: eggInventory.total_eggs - quantity
      }).eq('farm_id', farm.id);
      if (eggError) throw eggError;

      // Update farm balance
      const {
        error: balanceError
      } = await (supabase as any).from('farms').update({
        account_balance: farm.account_balance + totalAmount
      }).eq('id', farm.id);
      if (balanceError) throw balanceError;

      // Record transaction
      await (supabase as any).from('transactions').insert({
        farm_id: farm.id,
        transaction_type: 'egg_sale',
        amount: totalAmount,
        quantity: quantity,
        description: `Bán ${quantity} quả trứng`
      });
      setEggInventory(prev => ({
        total_eggs: prev.total_eggs - quantity
      }));
      setFarm(prev => prev ? {
        ...prev,
        account_balance: prev.account_balance + totalAmount
      } : null);
      toast({
        title: "Bán thành công!",
        description: `Bạn đã bán ${quantity} quả trứng và nhận được ${totalAmount.toLocaleString()} VND`
      });
      await loadFarmData(user!.id);
    } catch (error) {
      console.error('Error selling eggs:', error);
      toast({
        title: "Lỗi",
        description: "Không thể bán trứng",
        variant: "destructive"
      });
    }
  };
  const addChickensToPackage = async (packageId: string, additionalQuantity: number) => {
    try {
      setAddingChickens(packageId);
      const {
        data,
        error
      } = await supabase.functions.invoke('add-chickens-to-package', {
        body: {
          packageId,
          additionalQuantity
        }
      });
      if (error) throw error;
      if (data.success) {
        const remaining = typeof data?.balance_after === 'number'
          ? data.balance_after
          : (typeof data?.new_balance === 'number' ? data.new_balance : null);
        toast({
          title: "Mua thêm gà thành công!",
          description: remaining !== null
            ? `Đã thêm ${additionalQuantity} con gà. Số dư còn lại: ${formatCurrency(remaining)}`
            : `Đã thêm ${additionalQuantity} con gà.`
        });

        // Reload farm data
        if (user) await loadFarmData(user.id);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error adding chickens:', error);
      toast({
        title: "Lỗi mua thêm gà",
        description: error.message || "Có lỗi xảy ra khi mua thêm gà",
        variant: "destructive"
      });
    } finally {
      setAddingChickens(null);
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Định dạng mô tả giao dịch: chuyển UUID thành "Gói {package_name} - {coop_name}"
  const formatTransactionDescription = (desc: string | null) => {
    if (!desc) return '';
    const match = desc.match(/cho gói ([0-9a-f-]{36})/i);
    if (match) {
      const id = match[1];
      const pkg = servicePackages.find(p => p.id === id);
      if (pkg) {
        const namePart = `Gói ${pkg.package_name}`.trim();
        const coopPart = (pkg.coop_name || '').trim();
        const friendly = coopPart ? `${namePart} - ${coopPart}` : namePart;
        return desc.replace(/cho gói [0-9a-f-]{36}/i, `cho ${friendly}`);
      }
    }
    return desc;
  };

  // Lấy số lượng từ cột quantity; nếu thiếu thì parse trong mô tả
  const getTransactionQuantity = (t: Transaction) => {
    if (typeof t.quantity === 'number' && !Number.isNaN(t.quantity)) return t.quantity;
    const m = t.description?.match(/Mua\s*thêm\s*(\d+)/i);
    return m ? Number(m[1]) : null;
  };

  if (loading) {
    return <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Đang tải...</div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{
    backgroundImage: `url(${farmBackground})`
  }}>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="bg-amber-600 text-white px-8 py-4 rounded-2xl inline-block border-4 border-amber-800 shadow-xl my-[50px]">
            <h1 className="text-4xl font-bold">🎮 Trang trại của tôi</h1>
            <p className="text-amber-100 mt-2">Quản lý trang trại gà và thu hoạch trứng</p>
          </div>
        </div>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-amber-500 border-4 border-amber-700 shadow-lg">
            <TabsTrigger value="home" className="flex items-center gap-2 text-white font-bold data-[state=active]:bg-amber-700 data-[state=active]:text-white">
              <Home className="h-4 w-4" />
              🏠 Trang chủ
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2 text-white font-bold data-[state=active]:bg-amber-700 data-[state=active]:text-white">
              <UserIcon className="h-4 w-4" />
              👤 Thông tin
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2 text-white font-bold data-[state=active]:bg-amber-700 data-[state=active]:text-white">
              <Camera className="h-4 w-4" />
              📹 Camera
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 text-white font-bold data-[state=active]:bg-amber-700 data-[state=active]:text-white">
              <History className="h-4 w-4" />
              📋 Lịch sử
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            {/* Animated Farm Section */}
            <AnimatedFarm farmName={farm?.farm_name || "Trang trại của bạn"} balance={farm?.account_balance || 0} totalEggs={eggInventory.total_eggs} totalChickens={chickens.reduce((sum, chicken) => sum + chicken.quantity, 0)} chickens={chickens} farmId={farm?.id || ""} onCollectEgg={collectEggs} onSellEggs={sellEggs} />

            {/* Service Packages Section */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-4 border-purple-300 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-b-4 border-purple-700">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6" />
                  🎁 Gói dịch vụ đã mua
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Quản lý và mua thêm gà cho các gói dịch vụ của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {servicePackages.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servicePackages.map(pkg => <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 border-purple-200">
                        <CardHeader className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4">
                          <CardTitle className="text-lg">{pkg.package_name}</CardTitle>
                          <CardDescription className="text-orange-100 text-sm">
                            Đã mua: {new Date(pkg.purchased_at).toLocaleDateString('vi-VN')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span>🏠</span>
                              <span><strong>Chuồng:</strong> {pkg.coop_name}</span>
                              {coopLimits[pkg.coop_name] && (
                                <Badge variant="outline" className="text-xs">
                                  {coopLimits[pkg.coop_name].min_chickens}-{coopLimits[pkg.coop_name].max_chickens} con
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <span>🐔</span>
                              <span><strong>Gà:</strong> {pkg.selected_chicken_type_name}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <span>📊</span>
                              <span><strong>Số lượng:</strong> <span className="font-semibold text-green-600">{pkg.selected_chicken_quantity} con</span></span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <span>💰</span>
                              <span><strong>Tổng tiền:</strong> <span className="font-semibold text-purple-600">{formatCurrency(pkg.total_amount)}</span></span>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t">
                            <Button 
                              onClick={() => setSelectedPackageForAddChickens(pkg)} 
                              disabled={addingChickens === pkg.id} 
                              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
                            >
                              {addingChickens === pkg.id ? "Đang xử lý..." : "🛒 Mua thêm gà"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>)}
                  </div> : <div className="text-center py-8">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-600 font-semibold">Bạn chưa mua gói dịch vụ nào. Hãy mua từ cửa hàng!</p>
                    <Button onClick={() => navigate('/shop')} className="mt-4 bg-purple-500 hover:bg-purple-600 text-white">
                      🛒 Đi đến cửa hàng
                    </Button>
                  </div>}
              </CardContent>
            </Card>

            {/* User Packages Section */}
            

            {/* Chickens Section */}
            <Card className="bg-orange-50 border-4 border-orange-300 shadow-lg">
              <CardHeader className="bg-orange-500 text-white border-b-4 border-orange-700">
                <CardTitle className="flex items-center gap-2">
                  🐔 Các loại gà đang sở hữu
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {chickens.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chickens.map(chicken => <div key={chicken.id} className="bg-white border-4 border-orange-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-105">
                        <div className="text-center mb-2">
                          <span className="text-4xl">🐔</span>
                        </div>
                        <h3 className="font-bold text-lg text-center">{chicken.chicken_types.name}</h3>
                        <p className="text-sm text-gray-600 text-center mb-3">{chicken.chicken_types.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {chicken.quantity} con
                          </div>
                          <Badge className="bg-yellow-500 text-white border-2 border-yellow-700">
                            {chicken.chicken_types.eggs_per_period} trứng/{chicken.chicken_types.days_per_period} ngày
                          </Badge>
                        </div>
                      </div>)}
                  </div> : <div className="text-center py-8">
                    <div className="text-6xl mb-4">😢</div>
                    <p className="text-gray-600 font-semibold">Bạn chưa có gà nào. Hãy mua gà từ cửa hàng!</p>
                  </div>}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-blue-50 border-4 border-blue-300 shadow-lg">
              <CardHeader className="bg-blue-500 text-white border-b-4 border-blue-700">
                <CardTitle className="flex items-center gap-2">
                  ⚡ Hành động nhanh
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button onClick={() => navigate('/shop')} className="flex flex-col items-center gap-2 h-24 bg-green-500 hover:bg-green-600 text-white border-4 border-green-700 rounded-xl shadow-lg font-bold">
                    <ShoppingCart className="h-8 w-8" />
                    🛒 Cửa hàng
                  </Button>
                  <Button onClick={() => navigate('/shop/chickens')} variant="outline" className="flex flex-col items-center gap-2 h-24 border-4 border-purple-500 text-purple-700 hover:bg-purple-50 rounded-xl shadow-lg font-bold">
                    <span className="text-2xl">🐣</span>
                    Thuê gà
                  </Button>
                  <Button onClick={() => navigate('/topup')} variant="outline" className="flex flex-col items-center gap-2 h-24 border-4 border-blue-500 text-blue-700 hover:bg-blue-50 rounded-xl shadow-lg font-bold">
                    <Wallet className="h-8 w-8" />
                    💰 Ví tiền
                  </Button>
                  <Button variant="outline" className="flex flex-col items-center gap-2 h-24 border-4 border-red-500 text-red-700 hover:bg-red-50 rounded-xl shadow-lg font-bold">
                    <MessageCircle className="h-8 w-8" />
                    💬 Hỗ trợ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-purple-50 border-4 border-purple-300 shadow-lg">
              <CardHeader className="bg-purple-500 text-white border-b-4 border-purple-700">
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  👤 Thông tin cá nhân
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Cập nhật thông tin cá nhân của bạn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(saveProfile)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="full_name" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Họ và tên</FormLabel>
                            <FormControl>
                              <Input placeholder="Nhập họ và tên" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={form.control} name="shop_name" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Tên shop gà</FormLabel>
                            <FormControl>
                              <Input placeholder="Nhập tên shop gà" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={form.control} name="email" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Email" {...field} disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                      
                      <FormField control={form.control} name="date_of_birth" render={({
                      field
                    }) => <FormItem>
                            <FormLabel>Ngày sinh</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      Lưu thông tin
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="camera" className="space-y-6">
            <CameraMonitoring />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Lịch sử giao dịch
                </CardTitle>
                <CardDescription>
                  Theo dõi tất cả hoạt động trong trang trại
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại giao dịch</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Thời gian</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(transaction => <TableRow key={transaction.id}>
                          <TableCell>
                            {transaction.transaction_type === 'purchase_chicken' ? (
                              <Badge className="bg-orange-500 text-white border-2 border-orange-700">Mua thêm gà</Badge>
                            ) : transaction.transaction_type === 'egg_collection' ? (
                              <Badge>Thu hoạch</Badge>
                            ) : transaction.transaction_type === 'egg_sale' ? (
                              <Badge variant="secondary">Bán trứng</Badge>
                            ) : (
                              <Badge variant="outline">{transaction.transaction_type}</Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatTransactionDescription(transaction.description)}</TableCell>
                          <TableCell>{getTransactionQuantity(transaction) ?? '-'}</TableCell>
                          <TableCell>
                            {transaction.amount ? `${transaction.amount.toLocaleString()} VND` : '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.created_at).toLocaleString('vi-VN')}
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table> : <p className="text-center text-muted-foreground py-8">
                    Chưa có giao dịch nào
                  </p>}
              </CardContent>
            </Card>

            {/* Additional Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/wallet')}>
                <CardContent className="p-6 text-center">
                  <Wallet className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h3 className="font-semibold">Ví tiền</h3>
                  <p className="text-sm text-muted-foreground">Nạp/rút tiền</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <h3 className="font-semibold">Bảng xếp hạng</h3>
                  <p className="text-sm text-muted-foreground">Top người nuôi gà</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h3 className="font-semibold">Hỗ trợ</h3>
                  <p className="text-sm text-muted-foreground">Chat với admin</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Chickens Dialog */}
        {selectedPackageForAddChickens && (
          <AddChickensDialog
            open={!!selectedPackageForAddChickens}
            onOpenChange={(open) => !open && setSelectedPackageForAddChickens(null)}
            package={selectedPackageForAddChickens}
            onSuccess={addChickensToPackage}
            currentBalance={farm?.account_balance || 0}
          />
        )}
      </div>
    </div>;
};
export default Farm;