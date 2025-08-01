import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Star, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
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
            {availableFarms.map(farm => (
              <Card key={farm.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
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
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
export default Shop;