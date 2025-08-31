import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import heroImage from '@/assets/hero-farm.jpg';

const HeroSection = () => {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) * 0.01,
        y: (e.clientY - window.innerHeight / 2) * 0.01
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.section 
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Parallax Background */}
      <motion.div 
        className="absolute inset-0"
        style={{ y, opacity }}
      >
        <motion.img 
          src={heroImage} 
          alt="Trang trại gà" 
          className="w-full h-[120%] object-cover"
          style={{
            x: mousePosition.x,
            y: mousePosition.y
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40"></div>
      </motion.div>

      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-4 h-4 bg-primary/20 rounded-full"
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-32 w-6 h-6 bg-accent/20 rounded-full"
          animate={{
            y: [0, 15, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute bottom-40 left-32 w-3 h-3 bg-success/20 rounded-full"
          animate={{
            y: [0, -25, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-6 animate-pulse-glow"
          >
            <span className="text-sm font-medium text-accent-foreground">🌟 Công nghệ nuôi gà hiện đại</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
          >
            Nuôi Gà Từ Xa –{' '}
            <motion.span 
              className="text-transparent bg-clip-text bg-gradient-primary"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              Thu Trứng Tận Nhà!
            </motion.span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Chọn gà – Mua chuồng – Xem camera – Nhận trứng hoặc bán lời ngay trên app
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg font-semibold bg-gradient-primary hover:shadow-medium transition-all duration-300 group"
                onClick={() => navigate('/checkout')}
              >
                👉 Bắt đầu nuôi gà
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg font-semibold hover:bg-muted transition-all duration-300 group"
                onClick={() => navigate('/guide')}
              >
                <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                📚 Xem hướng dẫn
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
          >
            {[
              { number: "10,000+", label: "Người dùng đã tin tưởng", delay: 0.9 },
              { number: "50,000+", label: "Con gà đang được nuôi", delay: 1.0 },
              { number: "1M+", label: "Quả trứng đã giao", delay: 1.1 }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: stat.delay }}
                className="text-center"
              >
                <motion.div 
                  className="text-3xl font-bold text-primary mb-2"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Enhanced Decorative Elements */}
      <motion.div 
        className="absolute bottom-10 left-10 text-6xl opacity-50 pointer-events-none"
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        🐣
      </motion.div>
      <motion.div 
        className="absolute top-20 right-20 text-4xl opacity-30 pointer-events-none"
        animate={{ 
          y: [0, 15, 0],
          x: [0, 10, 0]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1
        }}
      >
        🥚
      </motion.div>
      <motion.div 
        className="absolute bottom-32 right-32 text-5xl opacity-40 pointer-events-none"
        animate={{ 
          y: [0, -25, 0],
          rotate: [0, -10, 10, 0]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 2
        }}
      >
        🌱
      </motion.div>
      
      {/* Additional floating elements */}
      <motion.div 
        className="absolute top-1/3 left-1/4 text-3xl opacity-20 pointer-events-none"
        animate={{ 
          y: [0, -30, 0],
          x: [0, 20, 0],
          rotate: [0, 360]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity, 
          ease: "linear"
        }}
      >
        ✨
      </motion.div>
      <motion.div 
        className="absolute top-2/3 right-1/4 text-2xl opacity-25 pointer-events-none"
        animate={{ 
          y: [0, 20, 0],
          x: [0, -15, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 7, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 3
        }}
      >
        🌟
      </motion.div>
    </motion.section>
  );
};

export default HeroSection;