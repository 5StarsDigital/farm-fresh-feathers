import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bird } from 'lucide-react';
import { Link } from 'react-router-dom';

const ChickenRental = () => {
  const chickenTypes = [{
    id: 1,
    name: "Gà Tàu Vàng",
    description: "Gà sinh trứng cao, phù hợp nuôi trong chuồng",
    egg_production_rate: 280,
    price: 150000,
    image_url: "/lovable-uploads/bf646450-ea7e-4a74-86b0-371c7a1b00d9.png"
  }, {
    id: 2,
    name: "Gà Rhode Island", 
    description: "Giống gà mạnh khỏe, sinh trứng ổn định",
    egg_production_rate: 250,
    price: 120000,
    image_url: "/lovable-uploads/c2b9d409-e83b-4af4-95f8-cecc6eee4e70.png"
  }, {
    id: 3,
    name: "Gà Leghorn",
    description: "Gà sinh trứng trắng, năng suất cao", 
    egg_production_rate: 300,
    price: 180000,
    image_url: "/lovable-uploads/bf646450-ea7e-4a74-86b0-371c7a1b00d9.png"
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
              <Link to="/shop/chickens" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                Thuê gà
              </Link>
              <Link to="/shop/accessories" className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80">
                Mua phụ kiện
              </Link>
            </nav>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Bird className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Giống gà</h1>
            </div>
            <p className="text-muted-foreground">Thuê gà để tăng sản lượng trứng cho trại của bạn</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {chickenTypes.map(chicken => (
              <Card key={chicken.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img src={chicken.image_url} alt={chicken.name} className="w-full h-full object-cover" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{chicken.name}</CardTitle>
                  <CardDescription>{chicken.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sản lượng trứng:</span>
                    <Badge variant="secondary">{chicken.egg_production_rate} trứng/năm</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Giá thuê:</span>
                    <span className="font-semibold text-primary">{formatCurrency(chicken.price)}/con/tháng</span>
                  </div>
                  <Button className="w-full">Thuê ngay</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChickenRental;