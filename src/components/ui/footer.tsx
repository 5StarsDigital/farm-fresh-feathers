import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Phone, Mail, MapPin, Facebook, Youtube } from 'lucide-react';
const Footer = () => {
  const footerSections = [{
    title: 'Liên hệ',
    items: [{
      icon: Phone,
      text: 'Hotline: 1900-XXX-XXX',
      href: 'tel:1900xxxxxx'
    }, {
      icon: Mail,
      text: 'Email: support@nuoiga5stars.vn',
      href: 'mailto:support@nuoiga5stars.vn'
    }, {
      icon: MapPin,
      text: 'Zalo: 0987-XXX-XXX',
      href: 'https://zalo.me'
    }]
  }, {
    title: 'Chính sách',
    items: [{
      text: 'Quyền riêng tư',
      href: '/privacy'
    }, {
      text: 'Chính sách hoàn tiền',
      href: '/refund'
    }, {
      text: 'Điều khoản sử dụng',
      href: '/terms'
    }, {
      text: 'Hướng dẫn nuôi gà',
      href: '/guide'
    }]
  }, {
    title: 'Dịch vụ',
    items: [{
      text: 'Nuôi gà từ xa',
      href: '/services/remote'
    }, {
      text: 'Giao trứng tận nhà',
      href: '/services/delivery'
    }, {
      text: 'Bán trứng kiếm lời',
      href: '/services/selling'
    }, {
      text: 'Cửa hàng phụ kiện',
      href: '/shop'
    }]
  }];
  const socialLinks = [{
    icon: Facebook,
    href: 'https://facebook.com',
    label: 'Facebook'
  }, {
    icon: Youtube,
    href: 'https://youtube.com',
    label: 'YouTube'
  }];
  return <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
                🐔
              </div>
              <span className="text-xl font-bold text-primary">Nuôi Gà 5.0</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Nền tảng nuôi gà từ xa hàng đầu Việt Nam. Mang lại trải nghiệm nuôi gà thật với công nghệ hiện đại.
            </p>
            
            {/* Newsletter */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Nhận tin tức mới nhất</h4>
              <div className="flex space-x-2">
                <Input placeholder="Email của bạn..." className="flex-1" />
                <Button className="bg-gradient-primary">
                  Đăng ký
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section, index) => <div key={index} className="space-y-4">
              <h4 className="font-semibold text-foreground text-lg">{section.title}</h4>
              <ul className="space-y-3">
                {section.items.map((item, itemIndex) => <li key={itemIndex}>
                    <a href={item.href || '#'} className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors duration-200 group">
                      {item.icon && <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                      <span>{item.text}</span>
                    </a>
                  </li>)}
              </ul>
            </div>)}
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Copyright */}
          <div className="text-muted-foreground text-sm">
            © 2025 Nuôi Gà 5Stars. Tất cả quyền được bảo lưu.
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Theo dõi chúng tôi:</span>
            {socialLinks.map((social, index) => <a key={index} href={social.href} aria-label={social.label} className="w-10 h-10 rounded-full bg-muted hover:bg-primary transition-all duration-200 flex items-center justify-center group hover:shadow-medium">
                <social.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
              </a>)}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-4 left-4 text-2xl opacity-30 animate-float">🐣</div>
      <div className="absolute bottom-8 right-8 text-xl opacity-20 animate-float" style={{
      animationDelay: '1s'
    }}>🥚</div>
    </footer>;
};
export default Footer;