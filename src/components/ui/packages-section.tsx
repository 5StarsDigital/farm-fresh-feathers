import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Camera, Egg, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface PackagePrice {
  id: string;
  package_id: string;
  package_name: string;
  daily_price: number;
  original_daily_price: number;
  discount_percentage: number;
  description: string;
  subtitle: string;
  emoji: string;
  bg_gradient: string;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
}

const PackagesSection = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PackagePrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('package_prices')
        .select('*')
        .eq('is_active', true)
        .order('daily_price', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(pkg => ({
        id: pkg.id,
        package_id: pkg.package_id,
        package_name: pkg.package_name,
        daily_price: pkg.daily_price,
        original_daily_price: pkg.original_daily_price,
        discount_percentage: pkg.discount_percentage || 0,
        description: pkg.description || '',
        subtitle: pkg.subtitle || '',
        emoji: pkg.emoji || '🐣',
        bg_gradient: pkg.bg_gradient || 'from-blue-400 to-blue-500',
        features: Array.isArray(pkg.features) ? pkg.features.map(f => String(f)) : [],
        is_popular: pkg.is_popular,
        is_active: pkg.is_active
      }));
      
      setPackages(transformedData);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

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
                pkg.is_popular ? 'ring-2 ring-primary shadow-medium' : ''
              }`}
            >
              {/* Popular Badge */}
              {pkg.is_popular && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-gradient-primary text-primary-foreground px-3 py-1 shadow-medium">
                    <Star className="w-3 h-3 mr-1" />
                    Phổ biến nhất
                  </Badge>
                </div>
              )}

              {/* Discount Badge */}
              {pkg.discount_percentage > 0 && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge variant="secondary" className="bg-accent text-accent-foreground px-2 py-1">
                    Giảm {pkg.discount_percentage}%
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${pkg.bg_gradient} flex items-center justify-center text-white shadow-medium mb-4 group-hover:shadow-strong transition-all duration-300`}>
                  <span className="text-3xl">{pkg.emoji}</span>
                </div>

                <CardTitle className="text-xl font-bold text-foreground mb-1">
                  {pkg.package_name}
                </CardTitle>
                <p className="text-sm font-medium text-primary mb-2">{pkg.subtitle}</p>
                
                <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>

                {/* Price per day */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-3xl font-bold text-primary">{formatCurrency(pkg.daily_price)}</span>
                    {pkg.original_daily_price > pkg.daily_price && (
                      <span className="text-lg text-muted-foreground line-through">{formatCurrency(pkg.original_daily_price)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">/ ngày</p>
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
                    pkg.is_popular 
                      ? 'bg-gradient-primary hover:shadow-medium' 
                      : 'bg-secondary hover:bg-secondary/80'
                  } transition-all duration-300`}
                  size="lg"
                  onClick={() => {
                    navigate(`/checkout?package=${pkg.package_id}`);
                  }}
                >
                  Thuê ngay
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