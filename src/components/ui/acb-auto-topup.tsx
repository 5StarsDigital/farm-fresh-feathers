import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ACBAutoTopup() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  const manualCheck = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('acb-auto-topup');
      
      if (error) {
        console.error('Error calling ACB auto top-up:', error);
        toast({
          title: "Lỗi kiểm tra ACB",
          description: "Không thể kết nối với hệ thống ACB",
          variant: "destructive"
        });
      } else {
        console.log('ACB check result:', data);
        setLastCheck(new Date());
        toast({
          title: "Kiểm tra ACB thành công",
          description: data?.message || "Đã kiểm tra giao dịch ACB",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Lỗi hệ thống",
        description: "Có lỗi xảy ra khi kiểm tra ACB",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

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
              Hệ thống tự động kiểm tra giao dịch ACB mỗi 15 giây
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

        <Button 
          onClick={manualCheck}
          disabled={isChecking}
          className="w-full"
          variant="outline"
        >
          {isChecking ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Đang kiểm tra...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Kiểm tra thủ công
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}