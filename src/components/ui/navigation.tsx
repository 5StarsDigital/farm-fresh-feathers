import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, X, User, ShoppingCart, MapPin, CreditCard, BookOpen, LogOut, Shield, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import NotificationPanel from '@/components/ui/notification-panel';
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  // Load account balance
  useEffect(() => {
    if (user) {
      loadAccountBalance();
    }
  }, [user]);

  // Listen for balance updates
  useEffect(() => {
    const handleBalanceUpdate = () => {
      if (user) {
        loadAccountBalance();
      }
    };

    window.addEventListener('balanceUpdate', handleBalanceUpdate);
    return () => window.removeEventListener('balanceUpdate', handleBalanceUpdate);
  }, [user]);

  const loadAccountBalance = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('farms')
        .select('account_balance')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (data && !error) {
        setAccountBalance(Number(data.account_balance) || 0);
      }
    } catch (error) {
      console.error('Error loading account balance:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleLogout = async () => {
    setAccountBalance(null);
    await signOut();
  };

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
    name: 'Nạp/Rút',
    href: '/topup',
    icon: CreditCard
  }, {
    name: 'Hướng dẫn',
    href: '/guide',
    icon: BookOpen
  }];

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Người dùng';
  };

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  };
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
           <div className="hidden md:flex items-center space-x-4">
             {menuItems.map(item => <a key={item.name} href={item.href} className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors duration-200 font-medium">
                 {item.icon && <item.icon className="w-4 h-4" />}
                 <span>{item.name}</span>
               </a>)}
            
             <NotificationPanel />
             {/* User Account or Login */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex flex-col items-start space-y-0 h-auto p-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={getUserAvatar()} alt={getUserDisplayName()} />
                        <AvatarFallback>
                          {getUserDisplayName().charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{getUserDisplayName()}</span>
                    </div>
                    {accountBalance !== null && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground ml-10">
                        <Wallet className="w-3 h-3" />
                        <span>{formatCurrency(accountBalance)}</span>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg z-50">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Thông tin tài khoản
                  </DropdownMenuItem>
                  
                  {/* Admin workspace buttons */}
                  {(userRole === 'admin' || userRole === 'super_admin') && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/admin-dashboard')}>
                        <Shield className="w-4 h-4 mr-2" />
                        Khu vực Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/admin-dashboard?tab=billing')}>
                        <Shield className="w-4 h-4 mr-2" />
                        Cài đặt Thanh toán
                      </DropdownMenuItem>
                    </>
                  )}
                  {userRole === 'super_admin' && (
                    <DropdownMenuItem onClick={() => navigate('/super-admin')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Khu vực Super Admin
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <a href="/auth" className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors duration-200 font-medium">
                <User className="w-4 h-4" />
                <span>Đăng nhập</span>
              </a>
            )}
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
              
              {/* Mobile User Account or Login */}
              {user ? (
                <>
                  <div className="px-3 py-2 border-t border-border mt-2 pt-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={getUserAvatar()} alt={getUserDisplayName()} />
                        <AvatarFallback>
                          {getUserDisplayName().charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{getUserDisplayName()}</span>
                    </div>
                    {accountBalance !== null && (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1 ml-10">
                        <Wallet className="w-3 h-3" />
                        <span>{formatCurrency(accountBalance)}</span>
                      </div>
                    )}
                  </div>
                  <a href="/profile" className="flex items-center space-x-2 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>
                    <User className="w-5 h-5" />
                    <span>Thông tin tài khoản</span>
                  </a>
                  {(userRole === 'admin' || userRole === 'super_admin') && (
                    <>
                      <a href="/admin-dashboard" className="flex items-center space-x-2 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>
                        <Shield className="w-5 h-5" />
                        <span>Khu vực Admin</span>
                      </a>
                      <a href="/admin-dashboard?tab=billing" className="flex items-center space-x-2 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>
                        <Shield className="w-5 h-5" />
                        <span>Cài đặt Thanh toán</span>
                      </a>
                    </>
                  )}
                  {userRole === 'super_admin' && (
                    <a href="/super-admin" className="flex items-center space-x-2 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>
                      <Shield className="w-5 h-5" />
                      <span>Khu vực Super Admin</span>
                    </a>
                  )}
                  <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="flex items-center space-x-2 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors duration-200 w-full text-left">
                    <LogOut className="w-5 h-5" />
                    <span>Đăng xuất</span>
                  </button>
                </>
              ) : (
                <a href="/auth" className="flex items-center space-x-2 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>
                  <User className="w-5 h-5" />
                  <span>Đăng nhập</span>
                </a>
              )}
            </div>
          </div>}
      </div>
    </nav>;
};
export default Navigation;