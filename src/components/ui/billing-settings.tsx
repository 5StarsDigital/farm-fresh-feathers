import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface BillingSetting {
  id: string;
  monthly_billing_date: number;
}

export const BillingSettings = () => {
  const [billingSettings, setBillingSettings] = useState<BillingSetting | null>(null);
  const [newBillingDate, setNewBillingDate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBillingSettings();
  }, []);

  const fetchBillingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setBillingSettings(data);
        setNewBillingDate(data.monthly_billing_date);
      }
    } catch (error) {
      console.error('Error fetching billing settings:', error);
      toast.error('Lỗi khi tải cài đặt thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (newBillingDate < 1 || newBillingDate > 28) {
      toast.error('Ngày thanh toán phải từ 1 đến 28');
      return;
    }

    setSaving(true);
    try {
      if (billingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('billing_settings')
          .update({ monthly_billing_date: newBillingDate })
          .eq('id', billingSettings.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('billing_settings')
          .insert({ monthly_billing_date: newBillingDate });

        if (error) throw error;
      }

      toast.success('Cập nhật cài đặt thanh toán thành công');
      fetchBillingSettings();
    } catch (error) {
      console.error('Error saving billing settings:', error);
      toast.error('Lỗi khi lưu cài đặt thanh toán');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Đang tải...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Cài Đặt Thanh Toán Hàng Tháng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="billing_date">Ngày thanh toán hàng tháng</Label>
          <Input
            id="billing_date"
            type="number"
            min="1"
            max="28"
            value={newBillingDate}
            onChange={(e) => setNewBillingDate(Number(e.target.value))}
          />
          <p className="text-sm text-muted-foreground">
            Chọn ngày trong tháng (từ 1-28) để tự động tính tiền gói gà cho khách hàng
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Ngày thanh toán hiện tại:</h4>
          <p className="text-lg font-bold text-primary">
            Ngày {billingSettings?.monthly_billing_date || newBillingDate} hàng tháng
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Đang lưu...' : 'Cập nhật cài đặt'}
        </Button>
      </CardContent>
    </Card>
  );
};