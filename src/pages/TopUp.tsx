import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, QrCode, Copy, CheckCircle, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ACBAutoTopup from '@/components/ui/acb-auto-topup';

const TopUp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userNumericId, setUserNumericId] = useState<number | null>(null);
  const { toast } = useToast();
  const [copySuccess, setCopySuccess] = useState('');

  const [bankInfo, setBankInfo] = useState({
    bankName: 'ACB',
    accountNumber: '18144631',
    accountName: 'NGUYỄN THẾ ANH',
    transferPrefix: 'chicken'
  });

  // Lấy numeric_id của user và bank settings
  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        // Fetch user numeric ID
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('numeric_id')
          .eq('id', user.id)
          .single();
        
        if (profileData && !profileError) {
          setUserNumericId((profileData as any).numeric_id);
        }

        // Fetch bank settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('production_settings')
          .select('setting_value')
          .eq('setting_name', 'bank_settings')
          .single();

        if (settingsData && !settingsError) {
          const settings = settingsData.setting_value as any;
          setBankInfo({
            bankName: settings.bank_name || 'ACB',
            accountNumber: settings.account_number || '18144631',
            accountName: settings.account_name || 'NGUYỄN THẾ ANH',
            transferPrefix: settings.transfer_prefix || 'chicken'
          });
        }
      }
    };

    fetchData();
  }, [user?.id]);

  const transferContent = `${bankInfo.transferPrefix}${userNumericId || ''}`;

  // URL QR Code từ VietQR
  const qrCodeUrl = `https://img.vietqr.io/image/${bankInfo.bankName.toLowerCase()}-${bankInfo.accountNumber}-compact2.jpg?accountName=${encodeURIComponent(bankInfo.accountName)}&addInfo=${transferContent}`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      toast({
        title: "Đã sao chép!",
        description: `${label} đã được sao chép vào clipboard`,
      });
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-20">
          <Alert>
            <AlertDescription>
              Vui lòng <Link to="/auth" className="text-primary underline">đăng nhập</Link> để sử dụng chức năng nạp tiền.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Nạp tiền tự động</h1>
          </div>

          {/* ACB Auto Top-up Status */}
          <div className="mb-6">
            <ACBAutoTopup />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* QR Code Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Mã QR chuyển khoản
                </CardTitle>
                <CardDescription>
                  Quét mã QR bằng app ngân hàng để chuyển khoản
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block border">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code chuyển khoản" 
                    className="w-64 h-64 mx-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <Smartphone className="w-4 h-4" />
                    <span className="text-sm font-medium">Quét QR bằng app ngân hàng</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Info Section */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin chuyển khoản</CardTitle>
                <CardDescription>
                  Thông tin chi tiết để chuyển khoản thủ công
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Ngân hàng</div>
                      <div className="font-semibold">{bankInfo.bankName}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Số tài khoản</div>
                      <div className="font-semibold font-mono">{bankInfo.accountNumber}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(bankInfo.accountNumber, 'Số tài khoản')}
                      className="ml-2"
                    >
                      {copySuccess === 'Số tài khoản' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Chủ tài khoản</div>
                      <div className="font-semibold">{bankInfo.accountName}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(bankInfo.accountName, 'Tên chủ tài khoản')}
                      className="ml-2"
                    >
                      {copySuccess === 'Tên chủ tài khoản' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm text-yellow-700 font-medium">Nội dung chuyển khoản</div>
                      <div className="font-bold font-mono text-yellow-800">{transferContent}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(transferContent, 'Nội dung chuyển khoản')}
                      className="ml-2"
                    >
                      {copySuccess === 'Nội dung chuyển khoản' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Notes */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Hướng dẫn nạp tiền
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <div className="font-medium mb-2">Cách 1: Quét mã QR</div>
                    <ul className="space-y-1 ml-4">
                      <li>• Mở app ngân hàng của bạn</li>
                      <li>• Chọn "Chuyển khoản" → "Quét QR"</li>
                      <li>• Quét mã QR ở bên trái</li>
                      <li>• Nhập số tiền và xác nhận</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-2">Cách 2: Chuyển khoản thủ công</div>
                    <ul className="space-y-1 ml-4">
                      <li>• Chọn ngân hàng ACB</li>
                      <li>• Nhập số tài khoản: <span className="font-mono">{bankInfo.accountNumber}</span></li>
                      <li>• <strong>Quan trọng:</strong> Ghi đúng nội dung: <span className="font-mono font-bold">{transferContent}</span></li>
                      <li>• Nhập số tiền và thực hiện chuyển khoản</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-100 rounded border border-yellow-300">
                  <div className="text-yellow-800 font-medium text-center">
                    ⚠️ Chuyển khoản đúng nội dung: <span className="font-mono font-bold">{transferContent}</span>
                    <br />
                    💰 Tiền sẽ tự động cộng vào tài khoản trong vòng 1 phút
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TopUp;