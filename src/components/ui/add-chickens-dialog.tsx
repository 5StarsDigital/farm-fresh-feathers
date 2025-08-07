import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Plus, Minus } from 'lucide-react';

interface ServicePackage {
  id: string;
  package_name: string;
  package_price: number;
  coop_name: string;
  coop_price: number;
  selected_chicken_type_name: string;
  selected_chicken_quantity: number;
  total_amount: number;
  purchased_at: string;
  status: string;
  selected_chicken_type_id: string;
}

interface ChickenType {
  id: string;
  name: string;
  price: number;
  description: string;
  eggs_per_period: number;
  days_per_period: number;
}

interface CoopLimits {
  min_chickens: number;
  max_chickens: number;
}

interface AddChickensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package: ServicePackage;
  onSuccess: (packageId: string, additionalQuantity: number) => void;
  currentBalance: number;
}

export const AddChickensDialog = ({ 
  open, 
  onOpenChange, 
  package: pkg, 
  onSuccess,
  currentBalance 
}: AddChickensDialogProps) => {
  const [additionalQuantity, setAdditionalQuantity] = useState(1);
  const [chickenType, setChickenType] = useState<ChickenType | null>(null);
  const [coopLimits, setCoopLimits] = useState<CoopLimits | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  useEffect(() => {
    if (open && pkg) {
      loadChickenTypeAndCoopLimits();
    }
  }, [open, pkg]);

  const loadChickenTypeAndCoopLimits = async () => {
    try {
      // Load chicken type details
      const { data: chickenData, error: chickenError } = await supabase
        .from('chicken_types')
        .select('*')
        .eq('id', pkg.selected_chicken_type_id)
        .single();

      if (chickenError) throw chickenError;
      setChickenType(chickenData);

      // Load coop limits from available_farms (assuming coop_name matches farm name)
      const { data: coopData, error: coopError } = await supabase
        .from('available_farms')
        .select('min_chickens_per_coop, max_chickens_per_coop')
        .eq('name', pkg.coop_name)
        .single();

      if (coopError) {
        console.warn('Could not load coop limits:', coopError);
        // Set default limits if coop not found
        setCoopLimits({ min_chickens: 10, max_chickens: 100 });
      } else {
        setCoopLimits({
          min_chickens: coopData.min_chickens_per_coop || 10,
          max_chickens: coopData.max_chickens_per_coop || 100
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setCoopLimits({ min_chickens: 10, max_chickens: 100 });
    }
  };

  const validateQuantity = (quantity: number) => {
    if (!coopLimits) return '';

    const newTotal = pkg.selected_chicken_quantity + quantity;
    
    if (newTotal > coopLimits.max_chickens) {
      return `Tổng số gà không được vượt quá ${coopLimits.max_chickens} con (hiện có ${pkg.selected_chicken_quantity} con)`;
    }

    if (newTotal < coopLimits.min_chickens) {
      return `Tổng số gà phải ít nhất ${coopLimits.min_chickens} con (hiện có ${pkg.selected_chicken_quantity} con)`;
    }

    if (chickenType) {
      const totalCost = quantity * chickenType.price;
      if (totalCost > currentBalance) {
        return `Không đủ số dư. Cần ${totalCost.toLocaleString()} VND, còn ${currentBalance.toLocaleString()} VND`;
      }
    }

    return '';
  };

  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    setAdditionalQuantity(value);
    setValidationError(validateQuantity(value));
  };

  const handleSubmit = () => {
    const error = validateQuantity(additionalQuantity);
    if (error) {
      setValidationError(error);
      return;
    }

    setLoading(true);
    onSuccess(pkg.id, additionalQuantity);
    onOpenChange(false);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const totalCost = chickenType ? additionalQuantity * chickenType.price : 0;
  const newTotal = pkg.selected_chicken_quantity + additionalQuantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold text-orange-600">
            Mua thêm gà cho gói
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Package Info Card */}
          <Card className="bg-orange-50 border-2 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-600 text-sm">{pkg.package_name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span>🏠</span>
                <span><strong>Chuồng:</strong> {pkg.coop_name}</span>
                {coopLimits && (
                  <Badge variant="outline" className="text-xs">
                    {coopLimits.min_chickens}-{coopLimits.max_chickens} con
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>🐔</span>
                <span><strong>Gà:</strong> {pkg.selected_chicken_type_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>📊</span>
                <span><strong>Số lượng hiện có:</strong> <Badge variant="secondary">{pkg.selected_chicken_quantity} con</Badge></span>
              </div>
              {chickenType && (
                <div className="flex items-center gap-2 text-sm">
                  <span>💰</span>
                  <span><strong>Giá mỗi con:</strong> <span className="font-semibold text-green-600">{formatCurrency(chickenType.price)}</span></span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quantity Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Số lượng gà muốn mua thêm</Label>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuantityChange(additionalQuantity - 1)}
                disabled={additionalQuantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <Input
                type="number"
                value={additionalQuantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="text-center font-semibold"
                min="1"
              />
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuantityChange(additionalQuantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Limits Info */}
            {coopLimits && (
              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <div><strong>Giới hạn chuồng:</strong> {coopLimits.min_chickens} - {coopLimits.max_chickens} con</div>
                <div><strong>Tổng sau khi mua:</strong> {newTotal} con</div>
              </div>
            )}
          </div>

          {/* Cost Summary */}
          <Card className="bg-green-50 border-2 border-green-200">
            <CardContent className="p-3">
              <div className="flex justify-between items-center text-sm">
                <span>Thêm {additionalQuantity} con:</span>
                <span className="font-bold text-green-600">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
                <span>Số dư hiện tại:</span>
                <span>{formatCurrency(currentBalance)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {validationError}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !!validationError || !chickenType}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {loading ? "Đang xử lý..." : `Mua thêm (${formatCurrency(totalCost)})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};