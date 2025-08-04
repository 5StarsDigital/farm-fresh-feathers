import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ACBAutoTopup() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successAmount, setSuccessAmount] = useState<number>(0);
  const { toast } = useToast();

  const checkACB = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('acb-auto-topup');
      
      if (error) {
        console.error('Error calling ACB auto top-up:', error);
      } else {
        console.log('ACB check result:', data);
        setLastCheck(new Date());
        
        // Kiểm tra nếu có giao dịch thành công
        if (data?.success && data?.processed_transactions?.length > 0) {
          const totalAmount = data.processed_transactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
          setSuccessAmount(totalAmount);
          setShowSuccessDialog(true);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Auto check every 10 seconds
  useEffect(() => {
    checkACB(); // Initial check
    const interval = setInterval(checkACB, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-green-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Auto Nạp Tiền ACB
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              Hệ thống tự động kiểm tra giao dịch ACB mỗi 10 giây
            </p>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-500">
                {lastCheck 
                  ? `Lần cuối: ${lastCheck.toLocaleTimeString()}`
                  : 'Chưa kiểm tra'
                }
              </span>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-800">
            🔄 Đang hoạt động
          </Badge>
        </div>

        <div className="bg-white/80 p-3 rounded-lg border">
          <p className="text-sm font-medium mb-2">💡 Cách thức hoạt động:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Chuyển khoản với nội dung: <code>chicken1</code>, <code>chicken2</code>, v.v.</li>
            <li>• Số ID tương ứng với numeric_id trong hệ thống</li>
            <li>• Tiền sẽ tự động được cộng vào tài khoản trang trại</li>
          </ul>
        </div>

        {isChecking && (
          <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Đang kiểm tra giao dịch...</span>
          </div>
        )}
      </CardContent>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Nạp tiền thành công!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                +{successAmount.toLocaleString('vi-VN')} VNĐ
              </div>
              <p className="text-gray-600">
                Số tiền đã được cộng vào tài khoản trang trại của bạn
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSuccessDialog(false)}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Đóng
            </Button>
            <Button 
              onClick={() => setShowSuccessDialog(false)}
              className="flex-1"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}