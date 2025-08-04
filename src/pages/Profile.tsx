import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';

interface ProfileData {
  full_name: string;
  email: string;
  date_of_birth: string;
  shop_name: string;
  avatar_url: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    date_of_birth: '',
    shop_name: '',
    avatar_url: ''
  });
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      await loadProfile(user.id);
    };

    getUser();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          date_of_birth: (data as any).date_of_birth || '',
          shop_name: (data as any).shop_name || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin hồ sơ',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          date_of_birth: profile.date_of_birth || null,
          shop_name: profile.shop_name
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Thành công',
        description: 'Thông tin cá nhân đã được cập nhật'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật thông tin',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu xác nhận không khớp',
        variant: 'destructive'
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu phải có ít nhất 6 ký tự',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword
      });

      if (error) throw error;

      setPasswords({ newPassword: '', confirmPassword: '' });
      toast({
        title: 'Thành công',
        description: 'Mật khẩu đã được thay đổi'
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thay đổi mật khẩu',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 px-4">
      <div className="container mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Trở về</span>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Thông tin cá nhân</h1>
        </div>

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback>
                  {profile.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold">Thông tin hồ sơ</div>
                <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">Email không thể thay đổi</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Nhập họ và tên"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Ngày sinh</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={profile.date_of_birth}
                onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopName">Tên shop gà</Label>
              <Input
                id="shopName"
                value={profile.shop_name}
                onChange={(e) => setProfile({ ...profile, shop_name: e.target.value })}
                placeholder="Nhập tên shop gà của bạn"
              />
            </div>

            <Button 
              onClick={handleProfileUpdate} 
              disabled={saving}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Đang lưu...' : 'Lưu thông tin'}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thay đổi mật khẩu</CardTitle>
            <CardDescription>Cập nhật mật khẩu để bảo mật tài khoản</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder="Nhập mật khẩu mới"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <Button 
              onClick={handlePasswordChange} 
              disabled={saving || !passwords.newPassword || !passwords.confirmPassword}
              className="w-full"
              variant="secondary"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Đang cập nhật...' : 'Thay đổi mật khẩu'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;