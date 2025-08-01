import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const TopUp = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Predefined amounts
  const predefinedAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString());
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Vui lòng đăng nhập để nạp tiền');
      return;
    }

    const numAmount = parseInt(amount);
    if (!numAmount || numAmount < 10000) {
      setError('Số tiền nạp tối thiểu là 10,000 VND');
      return;
    }

    if (numAmount > 50000000) {
      setError('Số tiền nạp tối đa là 50,000,000 VND');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('web2m-payment', {
        body: {
          amount: numAmount,
          description: `Nạp tiền vào tài khoản Nuôi Gà 5.0 - ${formatCurrency(numAmount)}`
        }
      });

      if (error) {
        throw error;
      }

      if (data?.payment_url) {
        // Open payment URL in new tab
        window.open(data.payment_url, '_blank');
      } else {
        throw new Error('Không nhận được URL thanh toán');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Đã xảy ra lỗi khi tạo thanh toán');
    } finally {
      setLoading(false);
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
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Nạp tiền</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Nạp tiền vào tài khoản
              </CardTitle>
              <CardDescription>
                Nạp tiền để mua gà, phụ kiện và thuê chuồng gà
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTopUp} className="space-y-6">
                <div>
                  <Label htmlFor="amount">Số tiền nạp (VND)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Nhập số tiền"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="10000"
                    max="50000000"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Tối thiểu: 10,000 VND - Tối đa: 50,000,000 VND
                  </p>
                </div>

                <div>
                  <Label>Chọn nhanh số tiền</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {predefinedAmounts.map((preAmount) => (
                      <Button
                        key={preAmount}
                        type="button"
                        variant={amount === preAmount.toString() ? "default" : "outline"}
                        className="h-12"
                        onClick={() => handleAmountSelect(preAmount)}
                      >
                        {formatCurrency(preAmount)}
                      </Button>
                    ))}
                  </div>
                </div>

                {amount && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Số tiền nạp:</span>
                      <span className="font-semibold text-lg">{formatCurrency(parseInt(amount) || 0)}</span>
                    </div>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg" 
                  disabled={loading || !amount}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Tiến hành nạp tiền
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Lưu ý:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Giao dịch được xử lý qua cổng thanh toán Web2M</li>
                  <li>• Tiền sẽ được cộng vào tài khoản sau khi thanh toán thành công</li>
                  <li>• Vui lòng kiểm tra email xác nhận sau khi hoàn tất</li>
                  <li>• Liên hệ hỗ trợ nếu có vấn đề với giao dịch</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TopUp;