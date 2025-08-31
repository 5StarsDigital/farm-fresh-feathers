import { Card, CardContent } from '@/components/ui/card';
import { Camera, Truck, TrendingUp, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';

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
    <section className="py-20 bg-muted/30 relative overflow-hidden">
      {/* Background animated shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-48 h-48 bg-accent/5 rounded-full blur-xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
            delay: 5
          }}
        />
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
            Tính năng nổi bật
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trải nghiệm nuôi gà hiện đại với công nghệ tiên tiến và dịch vụ hoàn hảo
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <Card className="h-full hover:shadow-strong transition-all duration-500 hover:-translate-y-1 bg-gradient-card border-0 overflow-hidden relative">
                {/* Animated background on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${feature.gradient.includes('blue') ? 'hsl(var(--primary)/0.05)' : feature.gradient.includes('orange') ? 'hsl(var(--accent)/0.05)' : feature.gradient.includes('green') ? 'hsl(var(--success)/0.05)' : 'hsl(var(--secondary)/0.05)'} 0%, transparent 100%)`
                  }}
                />
                
                <CardContent className="p-6 text-center relative z-10">
                  {/* Icon */}
                  <motion.div 
                    className="relative mb-6"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <motion.div 
                      className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white shadow-medium group-hover:shadow-strong transition-all duration-300`}
                      whileHover={{ 
                        boxShadow: "0 20px 40px -12px rgba(0,0,0,0.3)",
                        y: -2
                      }}
                    >
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <feature.icon className="w-8 h-8" />
                      </motion.div>
                    </motion.div>
                    <motion.div 
                      className="absolute -top-2 -right-2 text-2xl"
                      animate={{ 
                        y: [0, -5, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: index * 0.5
                      }}
                    >
                      {feature.emoji}
                    </motion.div>
                  </motion.div>

                  {/* Title */}
                  <motion.h3 
                    className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    {feature.title}
                  </motion.h3>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;