import { Card, CardContent } from '@/components/ui/card';
import { Camera, Truck, TrendingUp, ShoppingBag } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Camera,
      title: 'Xem camera 24/7',
      description: 'Theo dõi gà của bạn mọi lúc mọi nơi với camera HD chất lượng cao',
      emoji: '🎥',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: Truck,
      title: 'Giao trứng tận nhà',
      description: 'Trứng sạch, tươi ngon từ chính gà của bạn được giao đến tận cửa',
      emoji: '🥚',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      icon: TrendingUp,
      title: 'Bán trứng kiếm lời',
      description: 'Hệ thống tự định giá, bán hộ trứng dư và tạo thu nhập thụ động',
      emoji: '📈',
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: ShoppingBag,
      title: 'Cửa hàng phụ kiện',
      description: 'Mua thêm thức ăn, đồ chơi, chuồng mới để chăm sóc gà tốt hơn',
      emoji: '🛒',
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tính năng nổi bật
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trải nghiệm nuôi gà hiện đại với công nghệ tiên tiến và dịch vụ hoàn hảo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-0"
            >
              <CardContent className="p-6 text-center">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white shadow-medium group-hover:shadow-strong transition-all duration-300`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-2 -right-2 text-2xl animate-float">
                    {feature.emoji}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;