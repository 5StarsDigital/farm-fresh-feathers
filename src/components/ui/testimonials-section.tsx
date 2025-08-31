import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
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
            Khách hàng nói gì về chúng tôi
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hàng nghìn khách hàng đã tin tưởng và hài lòng với dịch vụ
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <Card className="group hover:shadow-strong transition-all duration-500 hover:-translate-y-1 bg-gradient-card border-0 relative overflow-hidden h-full">
                {/* Quote Icon */}
                <motion.div 
                  className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                >
                  <Quote className="w-12 h-12 text-primary" />
                </motion.div>

                {/* Animated border on hover */}
                <motion.div
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: 'linear-gradient(45deg, hsl(var(--primary)/0.1), hsl(var(--accent)/0.1), hsl(var(--primary)/0.1))',
                    backgroundSize: '300% 300%',
                  }}
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />

                <CardContent className="p-6 relative z-10">
                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          delay: index * 0.1 + i * 0.1,
                          type: "spring",
                          stiffness: 500
                        }}
                        viewport={{ once: true }}
                      >
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>

                  {/* Highlight Badge */}
                  <motion.div 
                    className="inline-block px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-sm font-medium mb-4"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    ✨ {testimonial.highlight}
                  </motion.div>

                  {/* Testimonial Text */}
                  <p className="text-foreground mb-6 leading-relaxed italic group-hover:text-foreground transition-colors duration-300">
                    "{testimonial.text}"
                  </p>

                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Avatar className="w-12 h-12 border-2 border-primary/20 group-hover:border-primary/40 transition-colors duration-300">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {testimonial.name.split(' ').pop()?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-border"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {[
            { value: "4.9/5", label: "Đánh giá trung bình", delay: 0.4 },
            { value: "10K+", label: "Khách hàng hài lòng", delay: 0.5 },
            { value: "99%", label: "Tỷ lệ hài lòng", delay: 0.6 },
            { value: "24/7", label: "Hỗ trợ khách hàng", delay: 0.7 }
          ].map((stat, index) => (
            <motion.div 
              key={index}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: stat.delay,
                type: "spring",
                stiffness: 300
              }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="text-3xl font-bold text-primary mb-2"
                whileHover={{ 
                  scale: 1.1,
                  color: "hsl(var(--accent))"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;