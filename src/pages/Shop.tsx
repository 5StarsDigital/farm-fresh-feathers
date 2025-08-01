import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Bird, Package, MapPin, Users, DollarSign, Star } from 'lucide-react';
const Shop = () => {
  const availableFarms = [{
    id: 1,
    name: "Trang trại Xanh An",
    location: "Hà Nội, Việt Nam",
    availableCoops: 15,
    totalCoops: 20,
    rentalPrice: 2500000,
    monthlyCost: 800000,
    rating: 4.8,
    reviewCount: 124,
    image: "/lovable-uploads/05e0ef0f-6969-420a-857d-097c9220c184.png"
  }, {
    id: 2,
    name: "Trang trại Bình Minh",
    location: "TP. Hồ Chí Minh, Việt Nam",
    availableCoops: 8,
    totalCoops: 25,
    rentalPrice: 3200000,
    monthlyCost: 950000,
    rating: 4.6,
    reviewCount: 87,
    image: "/lovable-uploads/81d89db6-5363-4583-afcc-727f9e30aade.png"
  }, {
    id: 3,
    name: "Trang trại Phú Quý",
    location: "Đà Nẵng, Việt Nam",
    availableCoops: 12,
    totalCoops: 18,
    rentalPrice: 2800000,
    monthlyCost: 750000,
    rating: 4.9,
    reviewCount: 156,
    image: "/lovable-uploads/85a5a39e-52b9-44c5-b46c-63478a1e8080.png"
  }];
  const chickenTypes = [{
    id: 1,
    name: "Gà Tàu Vàng",
    description: "Gà sinh trứng cao, phù hợp nuôi trong chuồng",
    eggProductionRate: 280,
    rentalPrice: 150000,
    image: "/lovable-uploads/bf646450-ea7e-4a74-86b0-371c7a1b00d9.png"
  }, {
    id: 2,
    name: "Gà Rhode Island",
    description: "Giống gà mạnh khỏe, sinh trứng ổn định",
    eggProductionRate: 250,
    rentalPrice: 120000,
    image: "/lovable-uploads/c2b9d409-e83b-4af4-95f8-cecc6eee4e70.png"
  }];
  const accessories = [{
    id: 1,
    name: "Máy ấp trứng tự động",
    description: "Máy ấp trứng công nghệ cao, tự động điều chỉnh nhiệt độ",
    price: 4500000,
    effect: "Tăng tỷ lệ nở 15%",
    image: "/lovable-uploads/c567b755-4e30-472d-87a5-2fa6a26e09fc.png"
  }, {
    id: 2,
    name: "Hệ thống tưới nước tự động",
    description: "Hệ thống cung cấp nước sạch liên tục cho gà",
    price: 2800000,
    effect: "Giảm công việc chăm sóc 30%",
    image: "/lovable-uploads/c567b755-4e30-472d-87a5-2fa6a26e09fc.png"
  }];
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Cửa hàng Nuôi Gà 5.0
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tìm kiếm mọi thứ bạn cần để phát triển trang trại gà của mình
            </p>
          </div>

          {/* Farm Rental Section */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Trại gà cho thuê</h2>
                <p className="text-muted-foreground">Thuê không gian trại gà để nuôi gà của bạn</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableFarms.map(farm => <Card key={farm.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img src={farm.image} alt={farm.name} className="w-full h-full object-cover" />
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{farm.name}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {farm.location}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>Còn trống: <strong>{farm.availableCoops}/{farm.totalCoops}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span><strong>{farm.rating}</strong> ({farm.reviewCount})</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Giá thuê:</span>
                        <span className="font-semibold text-primary">{formatCurrency(farm.rentalPrice)}/tháng</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Chi phí phát sinh:</span>
                        <span className="text-sm">{formatCurrency(farm.monthlyCost)}/tháng</span>
                      </div>
                    </div>
                    
                    <Button className="w-full mt-4" disabled={farm.availableCoops === 0}>
                      {farm.availableCoops === 0 ? 'Hết chỗ' : 'Thuê ngay'}
                    </Button>
                  </CardContent>
                </Card>)}
            </div>
          </div>

          {/* Chicken Rental Section */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Bird className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Giống gà</h2>
                <p className="text-muted-foreground">Thuê gà để tăng sản lượng trứng cho trại của bạn</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {chickenTypes.map(chicken => <Card key={chicken.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img src={chicken.image} alt={chicken.name} className="w-full h-full object-cover" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{chicken.name}</CardTitle>
                    <CardDescription>{chicken.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sản lượng trứng:</span>
                      <Badge variant="secondary">{chicken.eggProductionRate} trứng/năm</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Giá thuê:</span>
                      <span className="font-semibold text-primary">{formatCurrency(chicken.rentalPrice)}/con/tháng</span>
                    </div>
                    <Button className="w-full">Thuê ngay</Button>
                  </CardContent>
                </Card>)}
            </div>
          </div>

          {/* Accessories Section */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Mua phụ kiện</h2>
                <p className="text-muted-foreground">Mua các phụ kiện để nâng cao hiệu quả trại gà</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {accessories.map(accessory => <Card key={accessory.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img src={accessory.image} alt={accessory.name} className="w-full h-full object-cover" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{accessory.name}</CardTitle>
                    <CardDescription>{accessory.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Hiệu ứng:</span>
                      <Badge variant="outline">{accessory.effect}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Giá bán:</span>
                      <span className="font-semibold text-primary">{formatCurrency(accessory.price)}</span>
                    </div>
                    <Button className="w-full">Mua ngay</Button>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default Shop;