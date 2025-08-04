import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Minus, Wallet as WalletIcon, CreditCard, Banknote } from 'lucide-react';

interface Farm {
  id: string;
  account_balance: number;
}

const Wallet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    loadFarmData();
  }, []);

  const loadFarmData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: farmData, error } = await supabase
        .from('farms')
        .select('id, account_balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setFarm(farmData);
    } catch (error) {
      console.error('Error loading farm data:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải thông tin tài khoản',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!farm || !depositAmount) return;

    const amount = parseFloat(depositAmount);
    if (amount <= 0) {
      toast({
        title: 'Lỗi',
        description: 'Số tiền nạp phải lớn hơn 0',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    try {
      const newBalance = farm.account_balance + amount;
      
      const { error } = await supabase
        .from('farms')
        .update({ account_balance: newBalance })
        .eq('id', farm.id);

      if (error) throw error;

      setFarm({ ...farm, account_balance: newBalance });
      setDepositAmount('');
      
      toast({
        title: 'Thành công',
        description: `Đã nạp ${amount.toLocaleString('vi-VN')} VND vào tài khoản`
      });
    } catch (error) {
      console.error('Error depositing:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thực hiện nạp tiền',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!farm || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0) {
      toast({
        title: 'Lỗi',
        description: 'Số tiền rút phải lớn hơn 0',
        variant: 'destructive'
      });
      return;
    }

    if (amount > farm.account_balance) {
      toast({
        title: 'Lỗi',
        description: 'Số dư không đủ để thực hiện giao dịch',
        variant: 'destructive'
      });
      return;
    }

    setProcessing(true);
    try {
      const newBalance = farm.account_balance - amount;
      
      const { error } = await supabase
        .from('farms')
        .update({ account_balance: newBalance })
        .eq('id', farm.id);

      if (error) throw error;

      setFarm({ ...farm, account_balance: newBalance });
      setWithdrawAmount('');
      
      toast({
        title: 'Thành công',
        description: `Đã rút ${amount.toLocaleString('vi-VN')} VND từ tài khoản`
      });
    } catch (error) {
      console.error('Error withdrawing:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thực hiện rút tiền',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const quickAmounts = [10000, 50000, 100000, 500000, 1000000];

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
          <h1 className="text-2xl font-bold text-foreground">Ví điện tử</h1>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <WalletIcon className="w-6 h-6" />
              <span>Số dư hiện tại</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {farm?.account_balance.toLocaleString('vi-VN')} VND
            </div>
          </CardContent>
        </Card>

        {/* Deposit/Withdraw Tabs */}
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nạp tiền</span>
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center space-x-2">
              <Minus className="w-4 h-4" />
              <span>Rút tiền</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Nạp tiền vào ví</span>
                </CardTitle>
                <CardDescription>
                  Nạp tiền để mua gà, phụ kiện và thuê trang trại
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Số tiền (VND)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Nhập số tiền muốn nạp"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Số tiền thông dụng</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setDepositAmount(amount.toString())}
                        className="text-xs"
                      >
                        {amount.toLocaleString('vi-VN')}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleDeposit}
                  disabled={processing || !depositAmount}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {processing ? 'Đang xử lý...' : 'Nạp tiền'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Banknote className="w-5 h-5" />
                  <span>Rút tiền từ ví</span>
                </CardTitle>
                <CardDescription>
                  Rút tiền từ ví về tài khoản ngân hàng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawAmount">Số tiền (VND)</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Nhập số tiền muốn rút"
                    min="0"
                    max={farm?.account_balance}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Số tiền thông dụng</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.filter(amount => amount <= (farm?.account_balance || 0)).map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawAmount(amount.toString())}
                        className="text-xs"
                      >
                        {amount.toLocaleString('vi-VN')}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Số dư khả dụng: {farm?.account_balance.toLocaleString('vi-VN')} VND
                </div>

                <Button 
                  onClick={handleWithdraw}
                  disabled={processing || !withdrawAmount}
                  variant="secondary"
                  className="w-full"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  {processing ? 'Đang xử lý...' : 'Rút tiền'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Wallet;