import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';

const Accessories = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <nav className="flex justify-center gap-6 mb-8">
              <Link to="/shop/farms" className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80">
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
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Accessories;