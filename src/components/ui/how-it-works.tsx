import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, CreditCard, ShoppingCart, Camera, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 bg-primary/10 rounded-full`}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.8
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Quy trình nuôi gà
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            5 bước đơn giản để bắt đầu hành trình nuôi gà từ xa của bạn
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="group hover:shadow-strong transition-all duration-500 hover:scale-105 bg-gradient-card border-0 overflow-hidden relative">
                  {/* Animated progress line */}
                  <motion.div
                    className="absolute left-0 top-0 w-1 bg-gradient-primary h-full origin-top"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      delay: index * 0.2 + 0.3,
                      ease: "easeOut"
                    }}
                    viewport={{ once: true }}
                  />
                  
                  <CardContent className="p-6 relative">
                    <div className="flex items-start space-x-4">
                      {/* Step Number */}
                      <div className="flex-shrink-0">
                        <motion.div 
                          className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg shadow-medium group-hover:shadow-strong"
                          whileHover={{ 
                            scale: 1.1,
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)"
                          }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          {step.step}
                        </motion.div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          >
                            <step.icon className="w-5 h-5 text-primary" />
                          </motion.div>
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                            {step.title}
                          </h3>
                          <motion.span 
                            className="text-xl"
                            animate={{ 
                              rotate: [0, 10, -10, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity, 
                              ease: "easeInOut",
                              delay: index * 0.3
                            }}
                          >
                            {step.emoji}
                          </motion.span>
                        </div>
                        <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Image */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="relative overflow-hidden rounded-2xl shadow-strong"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <motion.img 
                src={cameraImage} 
                alt="Theo dõi gà qua camera" 
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.5 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              
              {/* Pulsing indicator */}
              <motion.div
                className="absolute top-4 right-4 w-4 h-4 bg-red-500 rounded-full"
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.7, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut"
                }}
              />
              <div className="absolute top-4 right-4 w-4 h-4 bg-red-500/50 rounded-full animate-ping" />
            </motion.div>
            
            {/* Enhanced floating elements */}
            <motion.div 
              className="absolute -top-4 -right-4 text-4xl pointer-events-none"
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut"
              }}
            >
              📱
            </motion.div>
            <motion.div 
              className="absolute -bottom-4 -left-4 text-3xl pointer-events-none"
              animate={{ 
                y: [0, 10, 0],
                x: [0, 5, 0],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
            >
              🐣
            </motion.div>
            
            {/* Additional sparkle effects */}
            <motion.div 
              className="absolute top-1/3 -left-6 text-2xl pointer-events-none"
              animate={{ 
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
                opacity: [0, 1, 0]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 2
              }}
            >
              ✨
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;