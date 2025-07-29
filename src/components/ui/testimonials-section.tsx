import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Quote } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Anh Hùng',
      location: 'Hải Dương',
      avatar: '/placeholder.svg',
      rating: 5,
      text: 'Thích cảm giác nuôi gà thật mà không cần dọn chuồng! Camera rất rõ nét, nhìn gà đẻ trứng mà vui lắm.',
      highlight: 'Trứng tươi ngon'
    },
    {
      id: 2,
      name: 'Chị Hoa',
      location: 'Hà Nội',
      avatar: '/placeholder.svg',
      rating: 5,
      text: 'Con mình mỗi ngày đều xem camera xem gà đẻ chưa! Trứng giao về tươi ngon, giá lại hợp lý.',
      highlight: 'Con nhỏ thích lắm'
    },
    {
      id: 3,
      name: 'Bác Minh',
      location: 'TP.HCM',
      avatar: '/placeholder.svg',
      rating: 5,
      text: 'Tháng đầu đã bán được gần 1 triệu từ trứng dư. Dịch vụ chăm sóc tốt, gà khỏe mạnh.',
      highlight: 'Kiếm được tiền'
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Khách hàng nói gì về chúng tôi
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hàng nghìn khách hàng đã tin tưởng và hài lòng với dịch vụ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card 
              key={testimonial.id}
              className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-0 relative overflow-hidden"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-12 h-12 text-primary" />
              </div>

              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Highlight Badge */}
                <div className="inline-block px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-sm font-medium mb-4">
                  ✨ {testimonial.highlight}
                </div>

                {/* Testimonial Text */}
                <p className="text-foreground mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>

                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {testimonial.name.split(' ').pop()?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-border">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">4.9/5</div>
            <div className="text-muted-foreground">Đánh giá trung bình</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">10K+</div>
            <div className="text-muted-foreground">Khách hàng hài lòng</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">99%</div>
            <div className="text-muted-foreground">Tỷ lệ hài lòng</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-muted-foreground">Hỗ trợ khách hàng</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;