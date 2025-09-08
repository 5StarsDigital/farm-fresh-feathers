import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface ServicePackage {
  id: string;
  package_code: string;
  package_name: string;
  coop_name: string;
  selected_chicken_quantity: number;
  selected_chicken_type_name: string;
  status: string;
  created_at: string;
  rtsp_url?: string;
}

interface FarmRental {
  id: string;
  available_farm_id: string;
  rental_price: number;
  monthly_cost: number;
  status: string;
  created_at: string;
  available_farms: {
    name: string;
    location: string;
  };
}

interface ServicePackagesSectionProps {
  farmId: string | undefined;
  refreshTrigger?: number;
}

const ServicePackagesSection = ({ farmId, refreshTrigger }: ServicePackagesSectionProps) => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [farmRentals, setFarmRentals] = useState<FarmRental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (farmId) {
      loadServicePackages();
      loadFarmRentals();
    }
  }, [farmId, refreshTrigger]);

  const loadServicePackages = async () => {
    try {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading service packages:', error);
    }
  };

  const loadFarmRentals = async () => {
    try {
      const { data, error } = await supabase
        .from('farm_rentals')
        .select(`
          id,
          available_farm_id,
          rental_price,
          monthly_cost,
          status,
          created_at,
          available_farms (
            name,
            location
          )
        `)
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFarmRentals(data || []);
    } catch (error) {
      console.error('Error loading farm rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const copyPackageCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã copy mã gói: ${code}`);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      expired: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'active' ? 'Đang hoạt động' : 
         status === 'inactive' ? 'Tạm dừng' : 
         status === 'expired' ? 'Hết hạn' : status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (packages.length === 0 && farmRentals.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Chưa có gói dịch vụ nào
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Packages */}
      {packages.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Gói dịch vụ chăm sóc</h4>
          <div className="grid gap-3">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-mono text-lg font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                          {pkg.package_code}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyPackageCode(pkg.package_code)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <h5 className="font-medium">{pkg.package_name}</h5>
                      <p className="text-sm text-muted-foreground">
                        🏠 Chuồng: {pkg.coop_name || 'Chưa gán'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        🐔 {pkg.selected_chicken_quantity} con {pkg.selected_chicken_type_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        📅 Ngày tạo: {formatDate(pkg.created_at)}
                      </p>
                      {pkg.rtsp_url && (
                        <p className="text-sm text-muted-foreground">
                          📹 Có camera theo dõi
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {getStatusBadge(pkg.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Farm Rentals */}
      {farmRentals.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Trại gà đã thuê</h4>
          <div className="grid gap-3">
            {farmRentals.map((rental) => (
              <Card key={rental.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{rental.available_farms?.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        📍 {rental.available_farms?.location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Thuê từ: {formatDate(rental.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">
                        {formatCurrency(rental.rental_price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Chi phí: {formatCurrency(rental.monthly_cost)}/tháng
                      </p>
                      <Badge variant={rental.status === 'active' ? 'default' : 'secondary'}>
                        {rental.status === 'active' ? 'Đang hoạt động' : 'Đã kết thúc'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicePackagesSection;