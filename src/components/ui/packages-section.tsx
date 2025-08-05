import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Camera, Egg, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PackagesSection = () => {
  const navigate = useNavigate();
  
  const packages = [
    {
      id: 'basic',
      name: 'Gói Cơ Bản',
      subtitle: '"Chăm chỉ mỗi ngày"',
      price: '200.000đ',
      originalPrice: '280.000đ',
      description: 'Chăm sóc tiết kiệm nhưng đầy đủ',
      features: [
        'Ăn 2 bữa/ngày thức ăn thô sạch',
        'Nước uống sạch mỗi ngày',
        'Bổ sung rau xanh tươi',
        'Dọn chuồng 1 lần/tuần',
        'Thả ra sân phơi nắng'
      ],
      popular: false,
      discount: '29%',
      emoji: '🐣',
      bgGradient: 'from-blue-400 to-blue-500'
    },
    {
      id: 'advanced',
      name: 'Gói Nâng Cao',
      subtitle: '"Gà có Gu"',
      price: '400.000đ',
      originalPrice: '550.000đ',
      description: 'Chăm như thú cưng, ăn ngon hơn',
      features: [
        'Tất cả dịch vụ Gói Cơ Bản',
        'Sâu gạo 1 lần/tuần',
        'Hoa quả theo mùa',
        'Vệ sinh chuồng 2 lần/tuần',
        'Báo cáo tăng trưởng hàng tháng'
      ],
      popular: false,
      discount: '27%',
      emoji: '🥚',
      bgGradient: 'from-yellow-400 to-yellow-500'
    },
    {
      id: 'vip',
      name: 'Gói VIP',
      subtitle: '"Chủ tịch Gà"',
      price: '800.000đ',
      originalPrice: '1.100.000đ',
      description: 'Trải nghiệm cá nhân hóa cao cấp',
      features: [
        'Bao gồm Gói Nâng Cao',
        'Thức ăn đặc biệt: dế mèn, thịt bò',
        'Mắc màn chống muỗi, côn trùng',
        'Thiết kế chuồng bằng AI',
        'Tư vấn chuyên gia riêng'
      ],
      popular: true,
      discount: '27%',
      emoji: '🐓',
      bgGradient: 'from-purple-400 to-purple-500'
    },
    {
      id: 4,
      name: 'Gói King Chicken',
      subtitle: '"Hoàng gia dành cho gà"',
      price: '1.500.000đ',
      originalPrice: '2.000.000đ',
      description: 'Xa xỉ và sáng tạo tột đỉnh',
      features: [
        'Bao gồm tất cả dịch vụ VIP',
        'Tắm nước sạch cho gà',
        'Hoa quả nhập khẩu cao cấp',
        'Nhạc thư giãn trong chuồng',
        'Video vlog nuôi gà cá nhân'
      ],
      popular: false,
      discount: '25%',
      emoji: '👑',
      bgGradient: 'from-gradient-start to-gradient-end'
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                <CardTitle className="text-xl font-bold text-foreground mb-1">
                  {pkg.name}
                </CardTitle>
                <p className="text-sm font-medium text-primary mb-2">{pkg.subtitle}</p>
                
                <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>

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
                  onClick={() => {
                    if (pkg.id === 'basic' || pkg.id === 'advanced' || pkg.id === 'vip') {
                      navigate(`/checkout?package=${pkg.id}`);
                    }
                  }}
                  disabled={pkg.id !== 'basic' && pkg.id !== 'advanced' && pkg.id !== 'vip'}
                >
                  {pkg.id === 'basic' || pkg.id === 'advanced' || pkg.id === 'vip' ? 'Thuê ngay' : 'Sắp ra mắt'}
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
            📞 Gọi hotline: 0985.24.6666
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PackagesSection;