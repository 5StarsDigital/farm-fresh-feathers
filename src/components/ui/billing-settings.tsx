import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Play, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface BillingSetting {
  id: string;
  monthly_billing_date: number;
  auto_monthly_billing_enabled: boolean;
  auto_cron_billing_enabled: boolean;
}

interface PreviewResult {
  customer_id: string;
  customer_name: string;
  packages: {
    package_id: string;
    package_name: string;
    daily_price: number;
    quantity: number;
    days_elapsed: number;
    amount: number;
  }[];
  balance_before: number;
  balance_after: number;
  action: 'normal' | 'suspend' | 'skip';
}

export const BillingSettings = () => {
  const [billingSettings, setBillingSettings] = useState<BillingSetting | null>(null);
  const [newBillingDate, setNewBillingDate] = useState(1);
  const [autoMonthlyBilling, setAutoMonthlyBilling] = useState(true);
  const [autoCronBilling, setAutoCronBilling] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleStatus, setScheduleStatus] = useState<{ jobname: string; schedule: string; active: boolean } | null>(null);
  const [cronExpr, setCronExpr] = useState('0 1 * * *');
  const [running, setRunning] = useState(false);
  const [previewResults, setPreviewResults] = useState<PreviewResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [manualProcessing, setManualProcessing] = useState(false);

  useEffect(() => {
    fetchBillingSettings();
    fetchScheduleStatus();
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
        setAutoMonthlyBilling(data.auto_monthly_billing_enabled ?? true);
        setAutoCronBilling(data.auto_cron_billing_enabled ?? true);
      } else {
        // Nếu không có data, tạo record mới với giá trị mặc định
        const { data: newSettings, error: insertError } = await supabase
          .from('billing_settings')
          .insert({
            monthly_billing_date: 1,
            auto_monthly_billing_enabled: true,
            auto_cron_billing_enabled: true
          })
          .select()
          .single();

        if (!insertError && newSettings) {
          setBillingSettings(newSettings);
          setNewBillingDate(newSettings.monthly_billing_date);
          setAutoMonthlyBilling(newSettings.auto_monthly_billing_enabled);
          setAutoCronBilling(newSettings.auto_cron_billing_enabled);
        }
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
          .update({ 
            monthly_billing_date: newBillingDate,
            auto_monthly_billing_enabled: autoMonthlyBilling,
            auto_cron_billing_enabled: autoCronBilling
          })
          .eq('id', billingSettings.id);

        if (error) throw error;
      } else {
        // Insert new settings
        const { error } = await supabase
          .from('billing_settings')
          .insert({ 
            monthly_billing_date: newBillingDate,
            auto_monthly_billing_enabled: autoMonthlyBilling,
            auto_cron_billing_enabled: autoCronBilling
          });

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
  // Kiểm tra nếu auto cron billing bị tắt
  if (!autoCronBilling) {
    toast.error('Tính năng tự động chạy CRON đã bị tắt');
    return;
  }

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
  // Kiểm tra nếu auto cron billing bị tắt
  if (!autoCronBilling) {
    toast.error('Tính năng tự động chạy CRON đã bị tắt');
    return;
  }

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
  // Kiểm tra nếu auto cron billing bị tắt
  if (!autoCronBilling) {
    toast.error('Tính năng tự động chạy CRON đã bị tắt');
    return;
  }

  try {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke('process-monthly-billing', { 
      body: { force: true, dryRun: false } 
    });
    
    if (error) {
      console.error('Edge function error:', error);
      toast.error(`Lỗi khi chạy tính phí: ${error.message || 'Unknown error'}`);
      return;
    }
    
    if (data) {
      console.log('Billing result:', data);
      toast.success('Đã chạy tính phí thành công');
    } else {
      toast.success('Đã khởi chạy quá trình tính phí');
    }
  } catch (error) {
    console.error('Run now error:', error);
    toast.error('Lỗi khi chạy tính phí');
  } finally {
    setRunning(false);
  }
};

const handleManualPreview = async () => {
  // Kiểm tra nếu auto monthly billing bị tắt
  if (!autoMonthlyBilling) {
    toast.error('Tính năng thanh toán thủ công đã bị tắt');
    return;
  }

  try {
    setManualProcessing(true);
    const { data, error } = await supabase.functions.invoke('manual-billing-preview', {
      body: {}
    });
    
    if (error) {
      console.error('Manual preview error:', error);
      toast.error(`Lỗi khi xem trước: ${error.message || 'Unknown error'}`);
      return;
    }
    
    if (data) {
      setPreviewResults(data.customers || []);
      setShowPreview(true);
      toast.success('Xem trước thành công');
    }
  } catch (error) {
    console.error('Manual preview error:', error);
    toast.error('Lỗi khi xem trước thanh toán');
  } finally {
    setManualProcessing(false);
  }
};

const handleManualCommit = async () => {
  // Kiểm tra nếu auto monthly billing bị tắt
  if (!autoMonthlyBilling) {
    toast.error('Tính năng thanh toán thủ công đã bị tắt');
    return;
  }

  try {
    setManualProcessing(true);
    const { data, error } = await supabase.functions.invoke('manual-billing-commit', {
      body: {}
    });
    
    if (error) {
      console.error('Manual commit error:', error);
      toast.error(`Lỗi khi thanh toán: ${error.message || 'Unknown error'}`);
      return;
    }
    
    if (data) {
      console.log('Manual billing result:', data);
      toast.success('Thanh toán thủ công thành công');
      setShowPreview(false);
      setPreviewResults([]);
    }
  } catch (error) {
    console.error('Manual commit error:', error);
    toast.error('Lỗi khi thanh toán thủ công');
  } finally {
    setManualProcessing(false);
  }
};

const getActionText = (action: string) => {
  switch (action) {
    case 'normal': return 'Trừ tiền bình thường';
    case 'suspend': return 'Trừ tiền và tạm dừng';
    case 'skip': return 'Bỏ qua';
    default: return action;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'normal': return 'text-green-600';
    case 'suspend': return 'text-red-600';
    case 'skip': return 'text-gray-500';
    default: return 'text-gray-500';
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
      <CardContent className="space-y-6">
        {/* Auto Billing Switches - Đặt ở đầu, tách biệt */}
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Cài đặt tổng quan</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="auto_monthly">Tự động thanh toán hàng tháng</Label>
                <p className="text-sm text-muted-foreground">Bật/tắt tính năng thanh toán tự động theo lịch</p>
              </div>
              <Switch
                id="auto_monthly"
                checked={autoMonthlyBilling}
                onCheckedChange={setAutoMonthlyBilling}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="auto_cron">Tự động chạy CRON</Label>
                <p className="text-sm text-muted-foreground">Bật/tắt job CRON tự động</p>
              </div>
              <Switch
                id="auto_cron"
                checked={autoCronBilling}
                onCheckedChange={setAutoCronBilling}
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Đang lưu...' : 'Cập nhật cài đặt'}
          </Button>
        </div>

        {/* Billing Date Settings - Chỉ hiển thị khi auto monthly billing được bật */}
        {autoMonthlyBilling && (
          <>
            <div className="h-px bg-border" />
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Cài đặt ngày thanh toán</h4>
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
            </div>
          </>
        )}

        {/* Manual Billing Section - Chỉ hiển thị khi auto monthly billing được bật */}
        {autoMonthlyBilling && (
          <div className="space-y-4">
            <h4 className="font-medium text-lg">Thanh toán thủ công</h4>
            <p className="text-sm text-muted-foreground">
              Tính toán và thanh toán cho tất cả các gói dịch vụ đang hoạt động và tạm dừng theo số ngày tích lũy.
            </p>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={handleManualPreview}
                disabled={manualProcessing}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {manualProcessing ? 'Đang xử lý...' : 'Xem trước'}
              </Button>
              
              <Button 
                onClick={handleManualCommit}
                disabled={manualProcessing}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {manualProcessing ? 'Đang xử lý...' : 'Thanh toán thủ công'}
              </Button>
            </div>

            {/* Preview Results Table */}
            {showPreview && previewResults.length > 0 && (
              <div className="space-y-4">
                <h5 className="font-medium">Kết quả xem trước:</h5>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Gói dịch vụ</TableHead>
                        <TableHead>Giá/ngày</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead>Ngày tích lũy</TableHead>
                        <TableHead>Thành tiền</TableHead>
                        <TableHead>Số dư trước</TableHead>
                        <TableHead>Số dư sau</TableHead>
                        <TableHead>Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewResults.map((customer) =>
                        customer.packages.map((pkg, index) => (
                          <TableRow key={`${customer.customer_id}-${pkg.package_id}`}>
                            {index === 0 && (
                              <TableCell rowSpan={customer.packages.length} className="font-medium">
                                {customer.customer_name}
                              </TableCell>
                            )}
                            <TableCell>{pkg.package_name}</TableCell>
                            <TableCell>{pkg.daily_price.toLocaleString('vi-VN')} VND</TableCell>
                            <TableCell>{pkg.quantity}</TableCell>
                            <TableCell>{pkg.days_elapsed}</TableCell>
                            <TableCell>{pkg.amount.toLocaleString('vi-VN')} VND</TableCell>
                            {index === 0 && (
                              <>
                                <TableCell rowSpan={customer.packages.length}>
                                  {customer.balance_before.toLocaleString('vi-VN')} VND
                                </TableCell>
                                <TableCell rowSpan={customer.packages.length}>
                                  {customer.balance_after.toLocaleString('vi-VN')} VND
                                </TableCell>
                                <TableCell rowSpan={customer.packages.length}>
                                  <span className={getActionColor(customer.action)}>
                                    {getActionText(customer.action)}
                                  </span>
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        {(autoMonthlyBilling || autoCronBilling) && (
          <div className="h-px bg-border my-4" />
        )}

        {/* Legacy Auto Schedule Section - Chỉ hiển thị khi auto cron billing được bật */}
        {autoCronBilling && (
          <div className="space-y-3">
            <h4 className="font-medium">Lập lịch tự động tính phí (Legacy)</h4>
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
              <Button 
                variant={scheduleStatus?.active ? "outline" : "default"} 
                onClick={handleEnableSchedule} 
                disabled={scheduleLoading || scheduleStatus?.active}
              >
                {scheduleLoading ? 'Đang xử lý...' : 'Bật lịch'}
              </Button>
              <Button 
                variant={!scheduleStatus?.active ? "outline" : "default"} 
                onClick={handleDisableSchedule} 
                disabled={scheduleLoading || !scheduleStatus?.active}
              >
                {scheduleLoading ? 'Đang xử lý...' : 'Tắt lịch'}
              </Button>
              <Button variant="outline" onClick={handleRunNow} disabled={running}>
                {running ? 'Đang chạy...' : 'Chạy ngay (Legacy)'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};