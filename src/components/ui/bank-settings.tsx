import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Key, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BankSettingsData {
  bank_name: string;
  account_number: string;
  account_name: string;
  transfer_prefix: string;
}

export default function BankSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BankSettingsData>({
    bank_name: 'ACB',
    account_number: '',
    account_name: '',
    transfer_prefix: 'chicken'
  });

  useEffect(() => {
    fetchBankSettings();
  }, []);

  const fetchBankSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('production_settings')
        .select('*')
        .eq('setting_name', 'bank_settings')
        .single();

      if (data && !error) {
        const value = data.setting_value as unknown as BankSettingsData;
        setSettings(value);
      } else if (error && error.code !== 'PGRST116') {
        throw error;
      }
    } catch (error) {
      console.error('Error fetching bank settings:', error);
      toast.error('Lỗi khi tải cài đặt ngân hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('production_settings')
        .select('id')
        .eq('setting_name', 'bank_settings')
        .single();

      let error;
      if (existing) {
        // Update
        const result = await supabase
          .from('production_settings')
          .update({
            setting_value: settings as any,
            description: 'Thông tin ngân hàng cho nạp tiền tự động'
          })
          .eq('setting_name', 'bank_settings');
        error = result.error;
      } else {
        // Insert
        const result = await supabase
          .from('production_settings')
          .insert({
            setting_name: 'bank_settings',
            setting_value: settings as any,
            description: 'Thông tin ngân hàng cho nạp tiền tự động'
          });
        error = result.error;
      }

      if (error) throw error;

      toast.success('Đã lưu cài đặt ngân hàng thành công');
    } catch (error) {
      console.error('Error saving bank settings:', error);
      toast.error('Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTokens = () => {
    toast.info('Vui lòng cập nhật secrets WEB2M_TOKEN và WEB2M_ACB_TOKEN trong Supabase Dashboard', {
      duration: 5000
    });
    window.open('https://supabase.com/dashboard/project/jyqbgqududwxhypyrkrb/settings/vault/secrets', '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin Ngân hàng</CardTitle>
          <CardDescription>
            Cấu hình thông tin ngân hàng để nhận thanh toán tự động từ khách hàng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Tên Ngân hàng</Label>
              <Input
                id="bank_name"
                value={settings.bank_name}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                placeholder="VD: ACB, VCB, Techcombank..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">Số tài khoản</Label>
              <Input
                id="account_number"
                value={settings.account_number}
                onChange={(e) => setSettings({ ...settings, account_number: e.target.value })}
                placeholder="VD: 18144631"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">Chủ tài khoản</Label>
              <Input
                id="account_name"
                value={settings.account_name}
                onChange={(e) => setSettings({ ...settings, account_name: e.target.value })}
                placeholder="VD: NGUYEN VAN A"
                className="uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer_prefix">Prefix nội dung chuyển khoản</Label>
              <Input
                id="transfer_prefix"
                value={settings.transfer_prefix}
                onChange={(e) => setSettings({ ...settings, transfer_prefix: e.target.value })}
                placeholder="VD: chicken"
              />
              <p className="text-xs text-muted-foreground">
                Khách hàng sẽ chuyển khoản với nội dung: {settings.transfer_prefix}[ID]
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveSettings} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </Button>
            <Button variant="outline" onClick={fetchBankSettings}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook API Tokens</CardTitle>
          <CardDescription>
            Quản lý các token API để kết nối với các dịch vụ thanh toán
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              Để bảo mật, các token API được lưu trữ trong Supabase Vault Secrets.
              Bạn cần cập nhật các secrets sau:
              <ul className="list-disc ml-6 mt-2">
                <li><code className="text-sm bg-muted px-1 rounded">WEB2M_TOKEN</code> - Token webhook chính</li>
                <li><code className="text-sm bg-muted px-1 rounded">WEB2M_ACB_TOKEN</code> - Token ACB API</li>
                <li><code className="text-sm bg-muted px-1 rounded">ACB_ACCOUNT_NUMBER</code> - Số tài khoản ACB</li>
                <li><code className="text-sm bg-muted px-1 rounded">ACB_PASSWORD</code> - Mật khẩu ACB API</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button variant="secondary" onClick={handleUpdateTokens}>
            <Key className="w-4 h-4 mr-2" />
            Mở Supabase Secrets Manager
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn cấu hình</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">1. Thông tin Ngân hàng</h4>
              <p className="text-muted-foreground">
                Cập nhật thông tin tài khoản ngân hàng nhận tiền. Thông tin này sẽ hiển thị 
                trên trang nạp tiền cho khách hàng.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">2. Prefix nội dung</h4>
              <p className="text-muted-foreground">
                Prefix sẽ được ghép với ID số của người dùng. Ví dụ: "chicken123" 
                (nếu prefix là "chicken" và user ID là 123).
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Webhook Tokens</h4>
              <p className="text-muted-foreground">
                Token webhook dùng để xác thực các request từ Web2M API. 
                Bạn cần lấy token từ Web2M Dashboard và cập nhật vào Supabase Secrets.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">4. Kiểm tra hoạt động</h4>
              <p className="text-muted-foreground">
                Sau khi cập nhật, thử thực hiện một giao dịch nạp tiền để kiểm tra 
                hệ thống hoạt động đúng.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
