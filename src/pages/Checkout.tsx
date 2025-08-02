import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Package {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  description: string;
  subtitle: string;
  features: string[];
  color: string;
  bgGradient: string;
}

interface ChickenType {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  egg_production_rate: number;
}

const packages: Package[] = [
  {
    id: "basic",
    name: "Gói Cơ Bản",
    price: 200000,
    originalPrice: 280000,
    discount: "Giảm 29%",
    description: "Chăm sóc tiết kiệm nhưng đầy đủ",
    subtitle: "Chăm chỉ mỗi ngày",
    features: [
      "Ăn 2 bữa/ngày thức ăn thô sạch",
      "Nước uống sạch mỗi ngày",
      "Bổ sung rau xanh tươi",
      "Dọn chuồng 1 lần/tuần",
      "Thả ra sân phơi nắng"
    ],
    color: "from-blue-400 to-blue-600",
    bgGradient: "bg-gradient-to-br from-blue-50 to-blue-100"
  },
  {
    id: "advanced",
    name: "Gói Nâng Cao",
    price: 400000,
    originalPrice: 550000,
    discount: "Giảm 27%",
    description: "Chăm như thú cưng, ăn ngon hơn",
    subtitle: "Gà có Gú",
    features: [
      "Tất cả dịch vụ Gói Cơ Bản",
      "Sau gạo 1 lần/tuần",
      "Hoa quả theo mùa",
      "Vệ sinh chuồng 2 lần/tuần",
      "Báo cáo tăng trưởng hàng tháng"
    ],
    color: "from-yellow-400 to-orange-500",
    bgGradient: "bg-gradient-to-br from-yellow-50 to-orange-100"
  },
  {
    id: "vip",
    name: "Gói VIP",
    price: 800000,
    originalPrice: 1100000,
    discount: "Giảm 27%",
    description: "Trải nghiệm có nhãn hóa cao cấp",
    subtitle: "Chủ tịch Gà",
    features: [
      "Bao gồm Gói Nâng Cao",
      "Thức ăn đặc biệt: đế men, thịt bò",
      "Mác môn chống muỗi, côn trùng",
      "Thiết kế chuồng bằng AI",
      "Tư vấn chuyên gia riêng"
    ],
    color: "from-purple-400 to-purple-600",
    bgGradient: "bg-gradient-to-br from-purple-50 to-purple-100"
  }
];

const coopDesigns = [
  {
    id: "shared",
    name: "Chuồng Nuôi Chung",
    description: "Chuồng tiêu chuẩn cho gói cơ bản",
    price: 0,
    image: "/placeholder.svg"
  },
  {
    id: "individual",
    name: "Chuồng Riêng Biệt",
    description: "Chuồng riêng cho từng con gà",
    price: 100000,
    image: "/placeholder.svg"
  },
  {
    id: "luxury",
    name: "Chuồng Cao Cấp",
    description: "Chuồng có hệ thống thông minh",
    price: 200000,
    image: "/placeholder.svg"
  },
  {
    id: "ai-designed",
    name: "Chuồng Thiết Kế AI",
    description: "Thiết kế tùy chỉnh bằng AI",
    price: 300000,
    image: "/placeholder.svg"
  }
];

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [selectedCoop, setSelectedCoop] = useState<string>("");
  const [selectedChickens, setSelectedChickens] = useState<{[key: string]: number}>({});
  const [chickenTypes, setChickenTypes] = useState<ChickenType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const packageId = searchParams.get("package");
    if (packageId && packages.find(p => p.id === packageId)) {
      setSelectedPackage(packageId);
      // Auto-select shared coop for basic package
      if (packageId === "basic") {
        setSelectedCoop("shared");
      }
    }
    loadChickenTypes();
  }, [searchParams]);

  const loadChickenTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('chicken_types')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading chicken types:', error);
        toast.error('Không thể tải danh sách giống gà');
        return;
      }

      setChickenTypes(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const selectedPackageData = packages.find(p => p.id === selectedPackage);
  const availableCoops = selectedPackage === "basic" 
    ? coopDesigns.filter(c => c.id === "shared")
    : coopDesigns;

  const updateChickenQuantity = (chickenId: string, quantity: number) => {
    setSelectedChickens(prev => ({
      ...prev,
      [chickenId]: Math.max(0, quantity)
    }));
  };

  const getTotalChickens = () => {
    return Object.values(selectedChickens).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    let total = selectedPackageData?.price || 0;
    
    // Add coop price
    const coopData = coopDesigns.find(c => c.id === selectedCoop);
    if (coopData) {
      total += coopData.price;
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

  const canProceedToPayment = () => {
    return selectedPackage && 
           selectedCoop && 
           getTotalChickens() > 0;
  };

  const handlePayment = () => {
    if (!canProceedToPayment()) {
      toast.error('Vui lòng chọn đầy đủ các mục trước khi thanh toán');
      return;
    }

    toast.success('Chuyển đến trang thanh toán...');
    // TODO: Implement payment logic
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Thanh Toán Gói Dịch Vụ</h1>
          
          <div className="grid gap-8">
            {/* Package Selection */}
            <Card>
              <CardHeader>
                <CardTitle>1. Chọn Gói Gà</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="relative">
                        <Label htmlFor={pkg.id} className="cursor-pointer">
                          <Card className={`transition-all hover:shadow-lg ${
                            selectedPackage === pkg.id ? 'ring-2 ring-primary' : ''
                          }`}>
                            <CardContent className="p-6">
                              <div className="flex items-center space-x-2 mb-4">
                                <RadioGroupItem value={pkg.id} id={pkg.id} />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-lg">{pkg.name}</h3>
                                    {pkg.discount && (
                                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                        {pkg.discount}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{pkg.subtitle}</p>
                                  <p className="text-sm mb-3">{pkg.description}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-green-600">
                                      {formatCurrency(pkg.price)}
                                    </span>
                                    {pkg.originalPrice && (
                                      <span className="text-sm text-muted-foreground line-through">
                                        {formatCurrency(pkg.originalPrice)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Coop Design Selection */}
            {selectedPackage && (
              <Card>
                <CardHeader>
                  <CardTitle>2. Chọn Thiết Kế Chuồng Gà</CardTitle>
                  {selectedPackage === "basic" && (
                    <p className="text-sm text-muted-foreground">
                      Gói cơ bản sử dụng chuồng nuôi chung mặc định
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedCoop} onValueChange={setSelectedCoop}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {availableCoops.map((coop) => (
                        <div key={coop.id} className="relative">
                          <Label htmlFor={coop.id} className="cursor-pointer">
                            <Card className={`transition-all hover:shadow-lg ${
                              selectedCoop === coop.id ? 'ring-2 ring-primary' : ''
                            } ${selectedPackage === "basic" && coop.id !== "shared" ? 'opacity-50' : ''}`}>
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                  <RadioGroupItem 
                                    value={coop.id} 
                                    id={coop.id}
                                    disabled={selectedPackage === "basic" && coop.id !== "shared"}
                                  />
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
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}

            {/* Chicken Selection */}
            {selectedPackage && selectedCoop && (
              <Card>
                <CardHeader>
                  <CardTitle>3. Chọn Giống Gà và Số Lượng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chickenTypes.map((chicken) => (
                      <Card key={chicken.id} className="border">
                        <CardContent className="p-4">
                          <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                            <img 
                              src={chicken.image_url || "/placeholder.svg"} 
                              alt={chicken.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h4 className="font-semibold mb-1">{chicken.name}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{chicken.description}</p>
                          <p className="text-lg font-bold text-green-600 mb-3">
                            {formatCurrency(chicken.price)}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateChickenQuantity(chicken.id, (selectedChickens[chicken.id] || 0) - 1)}
                              disabled={(selectedChickens[chicken.id] || 0) <= 0}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={selectedChickens[chicken.id] || 0}
                              onChange={(e) => updateChickenQuantity(chicken.id, parseInt(e.target.value) || 0)}
                              className="w-20 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateChickenQuantity(chicken.id, (selectedChickens[chicken.id] || 0) + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            {selectedPackage && (
              <Card>
                <CardHeader>
                  <CardTitle>Tổng Kết Đơn Hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Gói dịch vụ: {selectedPackageData?.name}</span>
                      <span>{formatCurrency(selectedPackageData?.price || 0)}</span>
                    </div>
                    
                    {selectedCoop && (
                      <div className="flex justify-between">
                        <span>Thiết kế chuồng: {coopDesigns.find(c => c.id === selectedCoop)?.name}</span>
                        <span>{formatCurrency(coopDesigns.find(c => c.id === selectedCoop)?.price || 0)}</span>
                      </div>
                    )}

                    {Object.entries(selectedChickens).map(([chickenId, quantity]) => {
                      const chicken = chickenTypes.find(c => c.id === chickenId);
                      if (!chicken || quantity === 0) return null;
                      return (
                        <div key={chickenId} className="flex justify-between">
                          <span>{chicken.name} x {quantity}</span>
                          <span>{formatCurrency(chicken.price * quantity)}</span>
                        </div>
                      );
                    })}

                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Tổng cộng:</span>
                        <span className="text-green-600">{formatCurrency(getTotalPrice())}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-6" 
                      size="lg"
                      onClick={handlePayment}
                      disabled={!canProceedToPayment()}
                    >
                      Thanh Toán
                    </Button>

                    {!canProceedToPayment() && (
                      <p className="text-sm text-muted-foreground text-center mt-2">
                        Vui lòng chọn đầy đủ các mục trước khi thanh toán
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}