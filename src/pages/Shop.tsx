import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Bird, Package } from 'lucide-react';

const Shop = () => {
  const shopCategories = [
    {
      id: 'farm-rental',
      title: 'Trại gà cho thuê',
      description: 'Thuê không gian trại gà để nuôi gà của bạn',
      icon: Home,
      color: 'bg-blue-500',
      href: '/shop/farm-rental'
    },
    {
      id: 'chicken-rental',
      title: 'Thuê gà',
      description: 'Thuê gà để tăng sản lượng trứng cho trại của bạn',
      icon: Bird,
      color: 'bg-green-500',
      href: '/shop/chicken-rental'
    },
    {
      id: 'accessories',
      title: 'Mua phụ kiện',
      description: 'Mua các phụ kiện để nâng cao hiệu quả trại gà',
      icon: Package,
      color: 'bg-purple-500',
      href: '/shop/accessories'
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

          {/* Shop Categories */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {shopCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button 
                      className="w-full"
                      onClick={() => window.location.href = category.href}
                    >
                      Xem thêm
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Coming Soon Section */}
          <div className="text-center mt-16">
            <div className="bg-muted/50 rounded-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                🚀 Sắp ra mắt
              </h2>
              <p className="text-muted-foreground">
                Chúng tôi đang phát triển thêm nhiều tính năng mới và sản phẩm thú vị. 
                Hãy theo dõi để không bỏ lỡ những cập nhật mới nhất!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Shop;