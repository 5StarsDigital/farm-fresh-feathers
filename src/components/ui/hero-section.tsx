import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-farm.jpg';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Trang trại gà" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-6 animate-pulse-glow">
            <span className="text-sm font-medium text-accent-foreground">🌟 Công nghệ nuôi gà hiện đại</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Nuôi Gà Từ Xa –{' '}
            <span className="text-transparent bg-clip-text bg-gradient-primary">
              Thu Trứng Tận Nhà!
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Chọn gà – Mua chuồng – Xem camera – Nhận trứng hoặc bán lời ngay trên app
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="px-8 py-4 text-lg font-semibold bg-gradient-primary hover:shadow-medium transition-all duration-300 group"
            >
              👉 Bắt đầu nuôi gà
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg font-semibold hover:bg-muted transition-all duration-300 group"
              onClick={() => navigate('/guide')}
            >
              <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              📚 Xem hướng dẫn
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Người dùng đã tin tưởng</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50,000+</div>
              <div className="text-muted-foreground">Con gà đang được nuôi</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1M+</div>
              <div className="text-muted-foreground">Quả trứng đã giao</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-10 text-6xl animate-float opacity-50">🐣</div>
      <div className="absolute top-20 right-20 text-4xl animate-float opacity-30" style={{ animationDelay: '1s' }}>🥚</div>
      <div className="absolute bottom-32 right-32 text-5xl animate-float opacity-40" style={{ animationDelay: '2s' }}>🌱</div>
    </section>
  );
};

export default HeroSection;