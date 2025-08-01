import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, User, ShoppingCart, MapPin, MessageSquare, BookOpen } from 'lucide-react';
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuItems = [{
    name: 'Trang chủ',
    href: '/',
    icon: null
  }, {
    name: 'Cửa hàng',
    href: '/shop',
    icon: ShoppingCart
  }, {
    name: 'Trang trại của tôi',
    href: '/farm',
    icon: MapPin
  }, {
    name: 'Hộp thư',
    href: '/messages',
    icon: MessageSquare
  }, {
    name: 'Hướng dẫn',
    href: '/guide',
    icon: BookOpen
  }, {
    name: 'Đăng nhập',
    href: '/auth',
    icon: User
  }];
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
              🐔
            </div>
            <span className="text-xl font-bold text-primary">Nuôi Gà 5.0</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map(item => <a key={item.name} href={item.href} className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors duration-200 font-medium">
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.name}</span>
              </a>)}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && <div className="md:hidden bg-card border-t border-border">
            <div className="px-4 py-2 space-y-1">
              {menuItems.map(item => <a key={item.name} href={item.href} className="flex items-center space-x-2 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>
                  {item.icon && <item.icon className="w-5 h-5" />}
                  <span>{item.name}</span>
                </a>)}
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navigation;