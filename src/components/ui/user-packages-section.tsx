import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface UserPackage {
  id: string;
  transaction_type: string;
  description: string;
  created_at: string;
  amount: number;
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

interface UserPackagesSectionProps {
  farmId: string | undefined;
}

const UserPackagesSection = ({ farmId }: UserPackagesSectionProps) => {
  const [packages, setPackages] = useState<UserPackage[]>([]);
  const [farmRentals, setFarmRentals] = useState<FarmRental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (farmId) {
      loadUserPackages();
      loadFarmRentals();
    }
  }, [farmId]);

  const loadUserPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('farm_id', farmId)
        .eq('transaction_type', 'package_purchase')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading packages:', error);
        return;
      }

      setPackages(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadFarmRentals = async () => {
    try {
      const { data, error } = await supabase
        .from('farm_rentals')
        .select(`
          *,
          available_farms (
            name,
            location
          )
        `)
        .eq('farm_id', farmId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading farm rentals:', error);
        return;
      }

      setFarmRentals(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>;
  }

  if (packages.length === 0 && farmRentals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Bạn chưa mua gói dịch vụ nào. Hãy mua gói từ trang chủ!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Service Packages */}
      {packages.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">Gói dịch vụ chăm sóc</h4>
          <div className="grid gap-3">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{pkg.description}</h5>
                      <p className="text-sm text-muted-foreground">
                        Mua ngày: {formatDate(pkg.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(Math.abs(pkg.amount))}
                      </p>
                      <Badge variant="secondary">Đang hoạt động</Badge>
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

export default UserPackagesSection;