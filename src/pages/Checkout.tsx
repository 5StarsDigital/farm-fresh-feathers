import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
interface Package {
  id: string;
  package_id: string;
  package_name: string;
  daily_price: number;
  original_daily_price: number;
  discount_percentage: number;
  description: string;
  subtitle: string;
  emoji: string;
  bg_gradient: string;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
}
interface ChickenType {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  eggs_per_period: number;
  days_per_period: number;
}
interface AvailableFarm {
  id: string;
  name: string;
  location: string;
  monthly_cost: number;
  rental_price: number;
  rating: number;
  review_count: number;
  available_coops: number;
  total_coops: number;
  image_url: string;
  min_chickens_per_coop?: number;
  max_chickens_per_coop?: number;
}
const coopDesigns = [{
  id: "shared",
  name: "Chuồng Nuôi Chung",
  description: "Chuồng tiêu chuẩn cho gói cơ bản",
  price: 0,
  image: "/placeholder.svg"
}, {
  id: "individual",
  name: "Chuồng Riêng Biệt",
  description: "Chuồng riêng cho từng con gà",
  price: 100000,
  image: "/placeholder.svg"
}, {
  id: "luxury",
  name: "Chuồng Cao Cấp",
  description: "Chuồng có hệ thống thông minh",
  price: 200000,
  image: "/placeholder.svg"
}, {
  id: "ai-designed",
  name: "Chuồng Thiết Kế AI",
  description: "Thiết kế tùy chỉnh bằng AI",
  price: 300000,
  image: "/placeholder.svg"
}];
export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [selectedCoop, setSelectedCoop] = useState<string>("");
  const [selectedChickens, setSelectedChickens] = useState<{
    [key: string]: number;
  }>({});
  const [selectedChickenType, setSelectedChickenType] = useState<string>("");
  const [chickenTypes, setChickenTypes] = useState<ChickenType[]>([]);
  const [availableFarms, setAvailableFarms] = useState<AvailableFarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const fetchPackages = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('package_prices').select('*').eq('is_active', true).order('daily_price', {
        ascending: true
      });
      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = (data || []).map(pkg => ({
        id: pkg.id,
        package_id: pkg.package_id,
        package_name: pkg.package_name,
        daily_price: pkg.daily_price,
        original_daily_price: pkg.original_daily_price,
        discount_percentage: pkg.discount_percentage || 0,
        description: pkg.description || '',
        subtitle: pkg.subtitle || '',
        emoji: pkg.emoji || '🐣',
        bg_gradient: pkg.bg_gradient || 'from-blue-400 to-blue-500',
        features: Array.isArray(pkg.features) ? pkg.features.map(f => String(f)) : [],
        is_popular: pkg.is_popular,
        is_active: pkg.is_active
      }));
      setPackages(transformedData);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };
  useEffect(() => {
    fetchPackages();
    loadChickenTypes();
    loadAvailableFarms();
  }, []);
  useEffect(() => {
    const packageId = searchParams.get("package");
    const farmId = searchParams.get("farmId");
    const chickenId = searchParams.get("chickenId");
    
    if (packageId && packages.find(p => p.package_id === packageId)) {
      setSelectedPackage(packageId);
      // Auto-select shared coop for basic package
      if (packageId === "basic") {
        setSelectedCoop("shared");
      }
    }
    
    // Auto-select farm when farmId is provided
    if (farmId && availableFarms.find(f => f.id === farmId)) {
      setSelectedCoop(farmId);
    }
    
    // Auto-select chicken when chickenId is provided
    if (chickenId && chickenTypes.find(c => c.id === chickenId)) {
      setSelectedChickenType(chickenId);
      setSelectedChickens({ [chickenId]: 1 });
    }
  }, [searchParams, packages, availableFarms, chickenTypes]);
  const loadChickenTypes = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('chicken_types').select('*').order('name');
      if (error) {
        console.error('Error loading chicken types:', error);
        toast.error('Không thể tải danh sách giống gà');
        return;
      }
      setChickenTypes(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    }
  };
  const loadAvailableFarms = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('available_farms').select('*').order('name');
      if (error) {
        console.error('Error loading available farms:', error);
        toast.error('Không thể tải danh sách trại gà cho thuê');
        return;
      }
      setAvailableFarms(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };
  const selectedPackageData = packages.find(p => p.package_id === selectedPackage);
  const availableCoops = selectedPackage === "basic" ? coopDesigns.filter(c => c.id === "shared") : coopDesigns;

  // For advanced and VIP packages, show farms instead of coop designs
  const showFarmDesigns = selectedPackage === "advanced" || selectedPackage === "vip";
  const selectedFarmData = availableFarms.find(f => f.id === selectedCoop);
  const updateChickenQuantity = (chickenId: string, quantity: number) => {
    // Validate against farm/coop limits
    if (showFarmDesigns && selectedFarmData) {
      const minChickens = selectedFarmData.min_chickens_per_coop || 1;
      const maxChickens = selectedFarmData.max_chickens_per_coop || 999;
      quantity = Math.max(minChickens, Math.min(maxChickens, quantity));
    }
    setSelectedChickens(prev => ({
      [chickenId]: Math.max(1, quantity)
    }));
  };
  const getTotalChickens = () => {
    return Object.values(selectedChickens).reduce((sum, qty) => sum + qty, 0);
  };
  const getTotalPrice = () => {
    let total = 0;

    // Add coop price or farm rental price (no package price for monthly payment)
    if (showFarmDesigns && selectedFarmData) {
      total += selectedFarmData.rental_price;
    } else {
      const coopData = coopDesigns.find(c => c.id === selectedCoop);
      if (coopData) {
        total += coopData.price;
      }
    }

    // Add chicken prices
    Object.entries(selectedChickens).forEach(([chickenId, quantity]) => {
      const chicken = chickenTypes.find(c => c.id === chickenId);
      if (chicken && quantity > 0) {
        total += chicken.price * quantity;
      }
    });
    return total;
  };
  const getMonthlyPackagePrice = () => {
    if (!selectedPackageData) return 0;
    const totalChickens = getTotalChickens();
    return selectedPackageData.daily_price * totalChickens;
  };
  const canProceedToPayment = () => {
    if (!selectedPackage || !selectedCoop || getTotalChickens() === 0) {
      return false;
    }

    // Check if farm is available
    if (showFarmDesigns && selectedFarmData && selectedFarmData.available_coops === 0) {
      return false;
    }

    // Check chicken quantity limits for farm
    if (showFarmDesigns && selectedFarmData) {
      const totalChickens = getTotalChickens();
      const minChickens = selectedFarmData.min_chickens_per_coop || 1;
      const maxChickens = selectedFarmData.max_chickens_per_coop || 999;
      if (totalChickens < minChickens || totalChickens > maxChickens) {
        return false;
      }
    }
    return true;
  };
  const handlePayment = async () => {
    if (!canProceedToPayment()) {
      toast.error('Vui lòng chọn đầy đủ các mục trước khi thanh toán');
      return;
    }
    setIsProcessingPayment(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('checkout-payment', {
        body: {
          packageId: selectedPackage,
          coopId: selectedCoop,
          selectedChickens,
          totalAmount: getTotalPrice()
        }
      });
      if (error) {
        console.error('Payment error:', error);
        if (error.message.includes('Insufficient balance')) {
          toast.error('Số dư tài khoản không đủ để thanh toán');
        } else {
          toast.error('Có lỗi xảy ra khi thanh toán');
        }
        return;
      }
      toast.success('Thanh toán thành công! Chuyển đến trang trại của bạn...');
      setTimeout(() => {
        navigate('/farm');
      }, 2000);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Có lỗi xảy ra khi thanh toán');
    } finally {
      setIsProcessingPayment(false);
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };
  if (loading) {
    return <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Đang tải...</div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 my-[50px]">Thanh Toán Gói Dịch Vụ</h1>
          
          <div className="grid gap-8">
            {/* Package Selection */}
            <Card>
              <CardHeader>
                <CardTitle>1. Chọn Gói Gà</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {packages.map(pkg => <div key={pkg.id} className="relative">
                        <Label htmlFor={pkg.package_id} className="cursor-pointer">
                          <Card className={`transition-all hover:shadow-lg ${selectedPackage === pkg.package_id ? 'ring-2 ring-primary' : ''}`}>
                            <CardContent className="p-6">
                              <div className="flex items-center space-x-2 mb-4">
                                <RadioGroupItem value={pkg.package_id} id={pkg.package_id} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl mr-2">{pkg.emoji}</span>
                                    <h3 className="font-bold text-lg">{pkg.package_name}</h3>
                                    {pkg.discount_percentage > 0 && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                        Giảm {pkg.discount_percentage}%
                                      </Badge>}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{pkg.subtitle}</p>
                                  <p className="text-sm mb-3">{pkg.description}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-green-600">
                                      {formatCurrency(pkg.daily_price)}
                                    </span>
                                    {pkg.original_daily_price > pkg.daily_price && <span className="text-sm text-muted-foreground line-through">
                                        {formatCurrency(pkg.original_daily_price)}
                                      </span>}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-muted-foreground">/ngày/gà</span>
                                    <span className="text-xs font-medium text-red-500">(trả sau)</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Label>
                      </div>)}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Coop Design Selection */}
            <Card>
              <CardHeader>
                <CardTitle>
                  2. {showFarmDesigns ? 'Chọn Thiết Kế Trại Gà Cho Thuê' : 'Chọn Thiết Kế Chuồng Gà'}
                </CardTitle>
                {selectedPackage === "basic" && <p className="text-sm text-muted-foreground">
                    Gói cơ bản sử dụng chuồng nuôi chung mặc định
                  </p>}
                {showFarmDesigns && <p className="text-sm text-muted-foreground">
                    Thuê không gian trại gà để nuôi gà của bạn
                  </p>}
              </CardHeader>
              <CardContent>
                {!selectedPackage ? <p className="text-center text-muted-foreground py-8">
                    Vui lòng chọn gói gà trước
                  </p> : <RadioGroup value={selectedCoop} onValueChange={setSelectedCoop}>
                    {showFarmDesigns ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableFarms.map(farm => <div key={farm.id} className="relative">
                            <Label htmlFor={farm.id} className={`cursor-pointer ${farm.available_coops === 0 ? 'cursor-not-allowed' : ''}`}>
                              <Card className={`transition-all hover:shadow-lg ${selectedCoop === farm.id ? 'ring-2 ring-primary' : ''} ${farm.available_coops === 0 ? 'opacity-50' : ''}`}>
                                <div className="aspect-video overflow-hidden rounded-t-lg">
                                  <img src={farm.image_url || "/placeholder.svg"} alt={farm.name} className="w-full h-full object-cover" />
                                </div>
                                <CardContent className="p-4">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <RadioGroupItem value={farm.id} id={farm.id} disabled={farm.available_coops === 0} />
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-lg">{farm.name}</h4>
                                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        📍 {farm.location}
                                      </p>
                                      <div className="space-y-2 mt-2">
                                        <div className="flex items-center gap-2 text-sm">
                                          <Users className="w-4 h-4 text-primary" />
                                          <span>Còn trống: <span className={`font-semibold ${farm.available_coops === 0 ? 'text-red-500' : ''}`}>{farm.available_coops}/{farm.total_coops}</span></span>
                                          {farm.available_coops === 0 && <span className="text-red-500 text-xs font-medium">Hết chỗ</span>}
                                        </div>

                                        {farm.min_chickens_per_coop !== undefined && farm.max_chickens_per_coop !== undefined && <div className="flex items-center gap-2 text-sm">
                                            <span>🐔</span>
                                            <span>Số lượng gà/chuồng: <span className="font-semibold text-primary">{farm.min_chickens_per_coop}-{farm.max_chickens_per_coop} con</span></span>
                                          </div>}

                                        <div className="flex items-center gap-2 text-sm">
                                          <span>⭐</span>
                                          <span><span className="font-semibold">{farm.rating}</span> ({farm.review_count} đánh giá)</span>
                                        </div>
                                      </div>

                                      <div className="mt-3 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span>💰</span>
                                            <span className="text-sm text-muted-foreground">Giá thuê:</span>
                                          </div>
                                          <span className="text-lg font-bold text-green-600">{formatCurrency(farm.rental_price)}/tháng</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <span>📊</span>
                                            <span className="text-sm text-muted-foreground">Chi phí phát sinh:</span>
                                          </div>
                                          <span className="text-sm font-medium">{formatCurrency(farm.monthly_cost)}/tháng</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Label>
                          </div>)}
                      </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {availableCoops.map(coop => <div key={coop.id} className="relative">
                            <Label htmlFor={coop.id} className="cursor-pointer">
                              <Card className={`transition-all hover:shadow-lg ${selectedCoop === coop.id ? 'ring-2 ring-primary' : ''} ${selectedPackage === "basic" && coop.id !== "shared" ? 'opacity-50' : ''}`}>
                                <CardContent className="p-4">
                                  <div className="flex items-center space-x-2 mb-3">
                                    <RadioGroupItem value={coop.id} id={coop.id} disabled={selectedPackage === "basic" && coop.id !== "shared"} />
                                    <div className="flex-1">
                                      <h4 className="font-semibold">{coop.name}</h4>
                                      <p className="text-sm text-muted-foreground">{coop.description}</p>
                                      <p className="text-lg font-bold text-green-600 mt-2">
                                        {coop.price === 0 ? 'Miễn phí' : formatCurrency(coop.price)}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Label>
                          </div>)}
                      </div>}
                  </RadioGroup>}
              </CardContent>
            </Card>

            {/* Chicken Selection */}
            <Card>
              <CardHeader>
                <CardTitle>3. Chọn Giống Gà và Số Lượng</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedPackage ? <p className="text-center text-muted-foreground py-8">
                    Vui lòng chọn gói gà trước
                  </p> : <RadioGroup value={selectedChickenType} onValueChange={value => {
                setSelectedChickenType(value);
                setSelectedChickens({
                  [value]: 1
                });
              }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {chickenTypes.map(chicken => <div key={chicken.id} className="relative">
                          <Label htmlFor={chicken.id} className="cursor-pointer">
                            <Card className={`transition-all hover:shadow-lg ${selectedChickenType === chicken.id ? 'ring-2 ring-primary' : ''}`}>
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                  <RadioGroupItem value={chicken.id} id={chicken.id} />
                                  <div className="flex-1">
                                    <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                                      <img src={chicken.image_url || "/placeholder.svg"} alt={chicken.name} className="w-full h-full object-cover" />
                                    </div>
                                    <h4 className="font-semibold mb-1">{chicken.name}</h4>
                                    <p className="text-sm text-muted-foreground mb-2">{chicken.description}</p>
                                    <div className="mb-3">
                                      <p className="text-lg font-bold text-green-600">{formatCurrency(chicken.price)}/con</p>
                                       <p className="text-xs text-muted-foreground">
                                         Sản lượng: {chicken.eggs_per_period} trứng/{chicken.days_per_period} ngày
                                       </p>
                                    </div>
                                    {selectedChickenType === chicken.id && <div className="flex items-center gap-2 mt-3">
                                        <Label>Số lượng:</Label>
                                        {showFarmDesigns && selectedFarmData && <span className="text-xs text-muted-foreground mr-2">
                                            ({selectedFarmData.min_chickens_per_coop || 1}-{selectedFarmData.max_chickens_per_coop || 999})
                                          </span>}
                                        <Input type="number" min={showFarmDesigns && selectedFarmData ? selectedFarmData.min_chickens_per_coop || 1 : 1} max={showFarmDesigns && selectedFarmData ? selectedFarmData.max_chickens_per_coop || 999 : 999} value={selectedChickens[chicken.id] || 1} onChange={e => updateChickenQuantity(chicken.id, parseInt(e.target.value) || 1)} className="w-20" />
                                      </div>}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Label>
                        </div>)}
                    </div>
                  </RadioGroup>}
              </CardContent>
            </Card>

            {/* Order Summary */}
            {selectedPackage && <Card>
                <CardHeader>
                  <CardTitle>Tổng Kết Đơn Hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Gói dịch vụ: {selectedPackageData?.package_name}</span>
                      <span className="text-red-500 font-medium">{formatCurrency(getMonthlyPackagePrice())}/ngày (trả sau)</span>
                    </div>
                    
                    {selectedCoop && <div className="flex justify-between">
                        <span>
                          {showFarmDesigns ? `Trại gà cho thuê: ${selectedFarmData?.name}` : `Thiết kế chuồng: ${coopDesigns.find(c => c.id === selectedCoop)?.name}`}
                        </span>
                        <span>
                          {showFarmDesigns ? formatCurrency(selectedFarmData?.rental_price || 0) : formatCurrency(coopDesigns.find(c => c.id === selectedCoop)?.price || 0)}
                        </span>
                      </div>}

                    {Object.entries(selectedChickens).map(([chickenId, quantity]) => {
                  const chicken = chickenTypes.find(c => c.id === chickenId);
                  if (!chicken || quantity === 0) return null;
                  return <div key={chickenId} className="flex justify-between">
                          <span>{chicken.name} x {quantity}</span>
                          <span>{formatCurrency(chicken.price * quantity)}</span>
                        </div>;
                })}

                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Tổng cộng:</span>
                        <span className="text-green-600">{formatCurrency(getTotalPrice())}</span>
                      </div>
                    </div>

                    <Button className="w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed" size="lg" onClick={handlePayment} disabled={!canProceedToPayment() || isProcessingPayment}>
                      {isProcessingPayment ? 'Đang xử lý...' : 'Thanh Toán'}
                    </Button>

                    {!canProceedToPayment() && <p className="text-sm text-muted-foreground text-center mt-2">
                        Vui lòng chọn đầy đủ các mục trước khi thanh toán
                      </p>}
                  </div>
                </CardContent>
              </Card>}
          </div>
        </div>
      </div>
    </div>;
}