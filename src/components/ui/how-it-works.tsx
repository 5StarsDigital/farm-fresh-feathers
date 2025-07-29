import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, CreditCard, ShoppingCart, Camera, Gift } from 'lucide-react';
import cameraImage from '@/assets/camera-monitoring.jpg';

const HowItWorksSection = () => {
  const steps = [
    {
      step: 1,
      icon: UserPlus,
      title: 'Tạo tài khoản',
      description: 'Đăng ký tài khoản miễn phí chỉ trong 30 giây',
      emoji: '👤'
    },
    {
      step: 2,
      icon: CreditCard,
      title: 'Nạp tiền',
      description: 'Nạp tiền vào ví điện tử an toàn, bảo mật',
      emoji: '💳'
    },
    {
      step: 3,
      icon: ShoppingCart,
      title: 'Mua gà & phụ kiện',
      description: 'Chọn gà giống tốt và các phụ kiện cần thiết',
      emoji: '🐔'
    },
    {
      step: 4,
      icon: Camera,
      title: 'Theo dõi gà qua camera',
      description: 'Xem gà ăn, chơi, đẻ trứng 24/7 qua camera HD',
      emoji: '📱'
    },
    {
      step: 5,
      icon: Gift,
      title: 'Nhận trứng hoặc bán trứng',
      description: 'Nhận trứng tươi tận nhà hoặc bán để kiếm lời',
      emoji: '🎁'
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Quy trình nuôi gà
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            5 bước đơn giản để bắt đầu hành trình nuôi gà từ xa của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <Card 
                key={index}
                className="group hover:shadow-medium transition-all duration-300 hover:scale-105 bg-gradient-card border-0"
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Step Number */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg shadow-medium">
                        {step.step}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <step.icon className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {step.title}
                        </h3>
                        <span className="text-xl">{step.emoji}</span>
                      </div>
                      <p className="text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-strong">
              <img 
                src={cameraImage} 
                alt="Theo dõi gà qua camera" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 text-4xl animate-float">📱</div>
            <div className="absolute -bottom-4 -left-4 text-3xl animate-float" style={{ animationDelay: '1s' }}>🐣</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;