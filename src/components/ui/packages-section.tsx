import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Camera, Egg, Package } from 'lucide-react';

const PackagesSection = () => {
  const packages = [
    {
      id: 1,
      name: 'Gói Gà Mái Đẻ',
      price: '350.000đ',
      originalPrice: '450.000đ',
      description: '5 trứng/tuần',
      features: [
        '1 con gà mái giống tốt',
        'Thức ăn 1 tháng',
        'Camera theo dõi cơ bản',
        'Giao trứng 2 lần/tuần'
      ],
      popular: false,
      discount: '22%',
      emoji: '🐔',
      bgGradient: 'from-orange-400 to-orange-500'
    },
    {
      id: 2,
      name: 'Gói Gà VIP + Camera HD',
      price: '600.000đ',
      originalPrice: '800.000đ',
      description: '7-10 trứng/tuần',
      features: [
        '2 con gà mái chất lượng cao',
        'Camera HD 4K',
        'Thức ăn cao cấp 1.5 tháng',
        'Giao trứng 3 lần/tuần',
        'Hỗ trợ 24/7'
      ],
      popular: true,
      discount: '25%',
      emoji: '👑',
      bgGradient: 'from-purple-400 to-purple-500'
    },
    {
      id: 3,
      name: 'Combo Chuồng + Thức Ăn',
      price: '120.000đ',
      originalPrice: '150.000đ',
      description: '1 tháng',
      features: [
        'Chuồng gỗ cao cấp',
        'Thức ăn hữu cơ 1 tháng',
        'Đồ chơi cho gà',
        'Miễn phí vận chuyển'
      ],
      popular: false,
      discount: '20%',
      emoji: '🏠',
      bgGradient: 'from-green-400 to-green-500'
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Gói gà phổ biến
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Chọn gói phù hợp với nhu cầu và ngân sách của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id}
              className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-strong bg-gradient-card border-0 ${
                pkg.popular ? 'ring-2 ring-primary shadow-medium' : ''
              }`}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-gradient-primary text-primary-foreground px-3 py-1 shadow-medium">
                    <Star className="w-3 h-3 mr-1" />
                    Phổ biến nhất
                  </Badge>
                </div>
              )}

              {/* Discount Badge */}
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="secondary" className="bg-accent text-accent-foreground px-2 py-1">
                  Giảm {pkg.discount}
                </Badge>
              </div>

              <CardHeader className="text-center pb-4">
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${pkg.bgGradient} flex items-center justify-center text-white shadow-medium mb-4 group-hover:shadow-strong transition-all duration-300`}>
                  <span className="text-3xl">{pkg.emoji}</span>
                </div>

                <CardTitle className="text-2xl font-bold text-foreground mb-2">
                  {pkg.name}
                </CardTitle>
                
                <p className="text-muted-foreground mb-4">{pkg.description}</p>

                {/* Price */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-3xl font-bold text-primary">{pkg.price}</span>
                    <span className="text-lg text-muted-foreground line-through">{pkg.originalPrice}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button 
                  className={`w-full ${
                    pkg.popular 
                      ? 'bg-gradient-primary hover:shadow-medium' 
                      : 'bg-secondary hover:bg-secondary/80'
                  } transition-all duration-300`}
                  size="lg"
                >
                  Chọn gói này
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Cần tư vấn thêm? Liên hệ với chúng tôi
          </p>
          <Button variant="outline" size="lg" className="hover:bg-primary hover:text-primary-foreground transition-all duration-300">
            📞 Gọi hotline: 1900-XXX-XXX
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;