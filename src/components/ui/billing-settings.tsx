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
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleStatus, setScheduleStatus] = useState<{ jobname: string; schedule: string; active: boolean } | null>(null);
  const [cronExpr, setCronExpr] = useState('0 1 * * *');
  const [running, setRunning] = useState(false);
useEffect(() => {
  Promise.all([fetchBillingSettings(), fetchScheduleStatus()]);
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

const fetchScheduleStatus = async () => {
  try {
    setScheduleLoading(true);
    const { data, error } = await supabase.rpc('get_process_monthly_billing_status');
    if (error) throw error as any;
    const row = Array.isArray(data) ? data[0] : data;
    if (row) {
      setScheduleStatus(row as any);
      if ((row as any).schedule) setCronExpr((row as any).schedule as string);
    } else {
      setScheduleStatus(null);
    }
  } catch (error) {
    console.error('Error fetching schedule status:', error);
    toast.error('Lỗi khi tải trạng thái lịch');
  } finally {
    setScheduleLoading(false);
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

const handleEnableSchedule = async () => {
  try {
    setScheduleLoading(true);
    const { error } = await supabase.rpc('enable_process_monthly_billing', { cron_expr: cronExpr });
    if (error) throw error as any;
    toast.success('Đã bật lịch tính phí');
    await fetchScheduleStatus();
  } catch (error) {
    console.error('Enable schedule error:', error);
    toast.error('Lỗi khi bật lịch');
  } finally {
    setScheduleLoading(false);
  }
};

const handleDisableSchedule = async () => {
  try {
    setScheduleLoading(true);
    const { error } = await supabase.rpc('disable_process_monthly_billing');
    if (error) throw error as any;
    toast.success('Đã tắt lịch tính phí');
    await fetchScheduleStatus();
  } catch (error) {
    console.error('Disable schedule error:', error);
    toast.error('Lỗi khi tắt lịch');
  } finally {
    setScheduleLoading(false);
  }
};

const handleRunNow = async () => {
  try {
    setRunning(true);
    const { error } = await supabase.functions.invoke('process-monthly-billing', { body: { force: true, dryRun: false } });
    if (error) throw error as any;
    toast.success('Đã chạy tính phí ngay');
  } catch (error) {
    console.error('Run now error:', error);
    toast.error('Lỗi khi chạy tính phí');
  } finally {
    setRunning(false);
  }
};

const handleDryRun = async () => {
  try {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke('process-monthly-billing', { body: { force: false, dryRun: true } });
    if (error) throw error as any;
    toast.success('Chạy thử thành công');
    console.log('Dry run result:', data);
  } catch (error) {
    console.error('Dry run error:', error);
    toast.error('Lỗi khi chạy thử');
  } finally {
    setRunning(false);
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

<div className="h-px bg-border my-4" />

<div className="space-y-3">
  <h4 className="font-medium">Lập lịch tự động tính phí</h4>
  <p className="text-sm text-muted-foreground">
    Trạng thái: {scheduleLoading ? 'Đang tải...' : (scheduleStatus ? `${scheduleStatus.active ? 'Đang bật' : 'Đang tắt'}` + (scheduleStatus.schedule ? ` • ${scheduleStatus.schedule}` : '') : 'Chưa thiết lập')}
  </p>

  <div className="space-y-2">
    <Label htmlFor="cron_expr">Biểu thức CRON (mặc định: 0 1 * * *)</Label>
    <Input
      id="cron_expr"
      value={cronExpr}
      onChange={(e) => setCronExpr(e.target.value)}
      placeholder="0 1 * * *"
      disabled={scheduleLoading}
    />
    <p className="text-xs text-muted-foreground">
      Ví dụ: 0 1 * * * = chạy 01:00 hàng ngày. Hệ thống sẽ chỉ trừ tiền vào ngày BillingDate.
    </p>
  </div>

  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    <Button variant="secondary" onClick={handleEnableSchedule} disabled={scheduleLoading}>
      Bật lịch
    </Button>
    <Button variant="outline" onClick={handleDisableSchedule} disabled={scheduleLoading}>
      Tắt lịch
    </Button>
    <Button variant="outline" onClick={handleDryRun} disabled={running}>
      Chạy thử
    </Button>
    <Button onClick={handleRunNow} disabled={running}>
      Chạy ngay
    </Button>
  </div>
</div>
      </CardContent>
    </Card>
  );
};