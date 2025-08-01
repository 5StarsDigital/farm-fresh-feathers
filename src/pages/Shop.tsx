import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Bird, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
const Shop = () => {
  const categories = [
    {
      id: 1,
      title: "Trại gà cho thuê",
      description: "Thuê không gian trại gà để nuôi gà của bạn",
      icon: Home,
      color: "bg-blue-500",
      path: "/shop/farms"
    },
    {
      id: 2,
      title: "Thuê gà",
      description: "Thuê gà để tăng sản lượng trứng cho trại của bạn",
      icon: Bird,
      color: "bg-green-500", 
      path: "/shop/chickens"
    },
    {
      id: 3,
      title: "Mua phụ kiện",
      description: "Mua các phụ kiện để nâng cao hiệu quả trại gà",
      icon: Package,
      color: "bg-purple-500",
      path: "/shop/accessories"
    }
  ];
  return (
    <div className="min-h-screen bg-background">
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

          {/* Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(category => {
              const IconComponent = category.icon;
              return (
                <Link key={category.id} to={category.path}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-center">{category.description}</p>
                      <Button className="w-full mt-4">
                        Xem thêm
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};
export default Shop;