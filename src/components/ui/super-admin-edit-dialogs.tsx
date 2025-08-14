import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Farm Edit Dialog
interface FarmEditDialogProps {
  farm: any;
  users: any[];
  onSave: (farmData: any) => void;
  onClose: () => void;
}

export function FarmEditDialog({ farm, users, onSave, onClose }: FarmEditDialogProps) {
  const [formData, setFormData] = useState({
    farm_name: farm.farm_name || '',
    account_balance: farm.account_balance || 0,
    user_id: farm.user_id || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa trại gà</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="farm_name">Tên trại</Label>
            <Input
              id="farm_name"
              value={formData.farm_name}
              onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="account_balance">Số dư tài khoản</Label>
            <Input
              id="account_balance"
              type="number"
              step="0.01"
              value={formData.account_balance}
              onChange={(e) => setFormData({ ...formData, account_balance: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div>
            <Label htmlFor="user_id">Chủ trại</Label>
            <Select
              value={formData.user_id}
              onValueChange={(value) => setFormData({ ...formData, user_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn chủ trại" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">
              Lưu
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Package Edit Dialog
interface PackageEditDialogProps {
  package: any;
  onSave: (packageData: any) => void;
  onClose: () => void;
}

export function PackageEditDialog({ package: pkg, onSave, onClose }: PackageEditDialogProps) {
  const [formData, setFormData] = useState({
    package_name: pkg.package_name || '',
    selected_chicken_quantity: pkg.selected_chicken_quantity || 0,
    total_amount: pkg.total_amount || 0,
    package_price: pkg.package_price || 0,
    coop_price: pkg.coop_price || 0,
    status: pkg.status || 'active',
    coop_name: pkg.coop_name || '',
    rtsp_url: pkg.rtsp_url || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa gói nuôi gà</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="package_name">Tên gói</Label>
              <Input
                id="package_name"
                value={formData.package_name}
                onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="coop_name">Tên chuồng</Label>
              <Input
                id="coop_name"
                value={formData.coop_name}
                onChange={(e) => setFormData({ ...formData, coop_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="selected_chicken_quantity">Số lượng gà</Label>
              <Input
                id="selected_chicken_quantity"
                type="number"
                value={formData.selected_chicken_quantity}
                onChange={(e) => setFormData({ ...formData, selected_chicken_quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="package_price">Giá gói</Label>
              <Input
                id="package_price"
                type="number"
                step="0.01"
                value={formData.package_price}
                onChange={(e) => setFormData({ ...formData, package_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="coop_price">Giá chuồng</Label>
              <Input
                id="coop_price"
                type="number"
                step="0.01"
                value={formData.coop_price}
                onChange={(e) => setFormData({ ...formData, coop_price: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <Label htmlFor="total_amount">Tổng tiền</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="rtsp_url">RTSP URL</Label>
            <Textarea
              id="rtsp_url"
              value={formData.rtsp_url}
              onChange={(e) => setFormData({ ...formData, rtsp_url: e.target.value })}
              placeholder="rtsp://..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">
              Lưu
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Chicken Edit Dialog
interface ChickenEditDialogProps {
  chicken: any;
  onSave: (chickenData: any) => void;
  onClose: () => void;
}

export function ChickenEditDialog({ chicken, onSave, onClose }: ChickenEditDialogProps) {
  const [formData, setFormData] = useState({
    quantity: chicken.quantity || 0,
    leftover_time_minutes: chicken.leftover_time_minutes || 0,
    last_egg_collection: chicken.last_egg_collection ? 
      new Date(chicken.last_egg_collection).toISOString().slice(0, 16) : ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      last_egg_collection: formData.last_egg_collection ? 
        new Date(formData.last_egg_collection).toISOString() : null
    };
    onSave(dataToSave);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin gà</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quantity">Số lượng gà</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div>
            <Label htmlFor="leftover_time_minutes">Thời gian còn lại (phút)</Label>
            <Input
              id="leftover_time_minutes"
              type="number"
              step="0.01"
              value={formData.leftover_time_minutes}
              onChange={(e) => setFormData({ ...formData, leftover_time_minutes: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label htmlFor="last_egg_collection">Lần thu hoạch cuối</Label>
            <Input
              id="last_egg_collection"
              type="datetime-local"
              value={formData.last_egg_collection}
              onChange={(e) => setFormData({ ...formData, last_egg_collection: e.target.value })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit">
              Lưu
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}