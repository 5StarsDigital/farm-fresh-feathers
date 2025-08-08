import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Settings, Zap } from 'lucide-react';

interface ProductionSetting {
  id: string;
  setting_name: string;
  setting_value: any;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ProductionSettingsProps {
  onActivityLog?: (action: string, description: string, details?: any) => void;
}

export function ProductionSettings({ onActivityLog }: ProductionSettingsProps) {
  const [settings, setSettings] = useState<ProductionSetting[]>([]);
  const [editingSetting, setEditingSetting] = useState<ProductionSetting | null>(null);
  const [isAddingSetting, setIsAddingSetting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('production_settings')
        .select('*')
        .order('setting_name');
      
      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching production settings:', error);
      toast.error('Lỗi khi tải cài đặt sản xuất');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (settingData: any) => {
    try {
      const { error } = await supabase
        .from('production_settings')
        .upsert({
          setting_name: settingData.setting_name,
          setting_value: settingData.setting_value,
          description: settingData.description
        }, { onConflict: 'setting_name' });
      
      if (error) throw error;
      
      if (onActivityLog) {
        onActivityLog(
          'production_setting_update',
          `Cập nhật cài đặt sản xuất: ${settingData.setting_name}`,
          { settingData }
        );
      }
      
      toast.success('Cập nhật cài đặt thành công');
      setEditingSetting(null);
      setIsAddingSetting(false);
      fetchSettings();
    } catch (error) {
      console.error('Error saving production setting:', error);
      toast.error('Lỗi khi lưu cài đặt');
    }
  };

  const renderSettingValue = (setting: ProductionSetting) => {
    const value = setting.setting_value;
    
    if (setting.setting_name === 'egg_collection_enabled') {
      return (
        <Badge variant={value === 'true' ? 'default' : 'secondary'}>
          {value === 'true' ? 'Bật' : 'Tắt'}
        </Badge>
      );
    }
    
    if (typeof value === 'number' || !isNaN(Number(value))) {
      return <span className="font-mono">{value}</span>;
    }
    
    return <span>{String(value)}</span>;
  };

  const getSettingIcon = (settingName: string) => {
    switch (settingName) {
      case 'egg_collection_enabled':
        return <Zap className="h-4 w-4" />;
      case 'max_uncollected_eggs_per_chicken':
        return <span className="text-sm">🥚</span>;
      case 'production_efficiency_bonus':
        return <span className="text-sm">⚡</span>;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Cài đặt sản xuất trứng
          </CardTitle>
          <Dialog open={isAddingSetting} onOpenChange={setIsAddingSetting}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Thêm cài đặt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm cài đặt sản xuất mới</DialogTitle>
              </DialogHeader>
              <SettingForm 
                onSave={handleSaveSetting}
                onCancel={() => setIsAddingSetting(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên cài đặt</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Cập nhật lần cuối</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getSettingIcon(setting.setting_name)}
                      <span className="font-medium">{setting.setting_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderSettingValue(setting)}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="text-sm text-muted-foreground">
                      {setting.description || 'Không có mô tả'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(setting.updated_at).toLocaleDateString('vi-VN')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingSetting(setting)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Chỉnh sửa cài đặt</DialogTitle>
                        </DialogHeader>
                        <SettingForm 
                          setting={editingSetting}
                          onSave={handleSaveSetting}
                          onCancel={() => setEditingSetting(null)}
                        />
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

interface SettingFormProps {
  setting?: ProductionSetting | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

function SettingForm({ setting, onSave, onCancel }: SettingFormProps) {
  const [formData, setFormData] = useState({
    setting_name: setting?.setting_name || '',
    setting_value: setting?.setting_value || '',
    description: setting?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string values to appropriate types
    let processedValue = formData.setting_value;
    
    // Handle boolean values
    if (formData.setting_name === 'egg_collection_enabled') {
      processedValue = formData.setting_value === 'true' || formData.setting_value === true ? 'true' : 'false';
    }
    
    // Handle numeric values
    if (formData.setting_name.includes('efficiency') || formData.setting_name.includes('max_')) {
      processedValue = Number(formData.setting_value);
    }
    
    onSave({
      ...formData,
      setting_value: processedValue
    });
  };

  const renderValueInput = () => {
    if (formData.setting_name === 'egg_collection_enabled') {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={formData.setting_value === 'true' || formData.setting_value === true}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, setting_value: checked ? 'true' : 'false' })
            }
          />
          <Label>
            {formData.setting_value === 'true' || formData.setting_value === true ? 'Bật' : 'Tắt'}
          </Label>
        </div>
      );
    }

    return (
      <Input
        type={formData.setting_name.includes('efficiency') || formData.setting_name.includes('max_') ? 'number' : 'text'}
        value={formData.setting_value}
        onChange={(e) => setFormData({ ...formData, setting_value: e.target.value })}
        step={formData.setting_name.includes('efficiency') ? '0.1' : '1'}
        min={formData.setting_name.includes('efficiency') ? '0.1' : '1'}
        required
      />
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="setting_name">Tên cài đặt</Label>
        <Input
          id="setting_name"
          value={formData.setting_name}
          onChange={(e) => setFormData({ ...formData, setting_name: e.target.value })}
          placeholder="vd: egg_collection_enabled"
          disabled={!!setting} // Disable editing name for existing settings
          required
        />
      </div>
      
      <div>
        <Label htmlFor="setting_value">Giá trị</Label>
        {renderValueInput()}
      </div>
      
      <div>
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Mô tả về cài đặt này..."
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit">
          {setting ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </form>
  );
}