import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Package, MapPin, Egg } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: string;
  description: string;
  created_at: string;
  amount: number;
  quantity: number;
}

interface UserChicken {
  id: string;
  quantity: number;
  chicken_types: {
    id: string;
    name: string;
    description: string;
    egg_production_rate: number;
  };
}

interface UserAccessory {
  id: string;
  quantity: number;
  accessories: {
    id: string;
    name: string;
    description: string;
    effect_type: string;
    effect_value: number;
  };
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
    image_url?: string;
  };
}

interface PackageTransactionDetailsProps {
  farmId: string | undefined;
  refreshTrigger?: number;
}

interface PackageGroup {
  transaction: Transaction;
  chickens: UserChicken[];
  accessories: UserAccessory[];
  farmRental?: FarmRental;
}

const PackageTransactionDetails = ({ farmId, refreshTrigger }: PackageTransactionDetailsProps) => {
  const [packageGroups, setPackageGroups] = useState<PackageGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (farmId) {
      loadPackageDetails();
    }
  }, [farmId, refreshTrigger]);

  const loadPackageDetails = async () => {
    try {
      setLoading(true);

      // Get all package purchase transactions
      const { data: packageTransactions, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('farm_id', farmId)
        .eq('transaction_type', 'package_purchase')
        .order('created_at', { ascending: false });

      if (transactionError) throw transactionError;

      // Get user chickens with chicken type details
      const { data: userChickens, error: chickenError } = await supabase
        .from('user_chickens')
        .select(`
          *,
          chicken_types (
            id,
            name,
            description,
            egg_production_rate
          )
        `)
        .eq('farm_id', farmId);

      if (chickenError) throw chickenError;

      // Get user accessories with accessory details
      const { data: userAccessories, error: accessoryError } = await supabase
        .from('user_accessories')
        .select(`
          *,
          accessories (
            id,
            name,
            description,
            effect_type,
            effect_value
          )
        `)
        .eq('farm_id', farmId);

      if (accessoryError) throw accessoryError;

      // Get farm rentals
      const { data: farmRentals, error: rentalError } = await supabase
        .from('farm_rentals')
        .select(`
          *,
          available_farms (
            name,
            location,
            image_url
          )
        `)
        .eq('farm_id', farmId);

      if (rentalError) throw rentalError;

      // Group data by packages
      const groups: PackageGroup[] = (packageTransactions || []).map(transaction => {
        const relatedChickens = userChickens?.filter(chicken => {
          // Logic to associate chickens with packages could be based on creation time
          const chickenDate = new Date(chicken.created_at);
          const transactionDate = new Date(transaction.created_at);
          const timeDiff = Math.abs(chickenDate.getTime() - transactionDate.getTime());
          return timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours
        }) || [];

        const relatedAccessories = userAccessories?.filter(accessory => {
          const accessoryDate = new Date(accessory.created_at);
          const transactionDate = new Date(transaction.created_at);
          const timeDiff = Math.abs(accessoryDate.getTime() - transactionDate.getTime());
          return timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours
        }) || [];

        const relatedFarmRental = farmRentals?.find(rental => {
          const rentalDate = new Date(rental.created_at);
          const transactionDate = new Date(transaction.created_at);
          const timeDiff = Math.abs(rentalDate.getTime() - transactionDate.getTime());
          return timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours
        });

        return {
          transaction,
          chickens: relatedChickens,
          accessories: relatedAccessories,
          farmRental: relatedFarmRental
        };
      });

      setPackageGroups(groups);
    } catch (error) {
      console.error('Error loading package details:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePackageExpansion = (transactionId: string) => {
    const newExpanded = new Set(expandedPackages);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedPackages(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.abs(amount)) + 'đ';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-center py-4">Đang tải chi tiết gói...</div>;
  }

  if (packageGroups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Bạn chưa mua gói dịch vụ nào. Hãy mua gói từ trang chủ!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Chi tiết gói dịch vụ đã mua</h3>
      </div>
      
      {packageGroups.map((group) => {
        const isExpanded = expandedPackages.has(group.transaction.id);
        
        return (
          <Card key={group.transaction.id} className="border-l-4 border-l-primary">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <CardHeader 
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => togglePackageExpansion(group.transaction.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base font-medium">
                          {group.transaction.description}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>📅 {formatDate(group.transaction.created_at)}</span>
                          <span>💰 {formatCurrency(group.transaction.amount)}</span>
                          {group.transaction.quantity && (
                            <span>📦 Số lượng: {group.transaction.quantity}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Đang hoạt động
                    </Badge>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0 pb-6">
                  <div className="pl-7 space-y-4">
                    
                    {/* Farm Rental Section */}
                    {group.farmRental && (
                      <div className="border rounded-lg p-4 bg-blue-50/50">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium text-blue-900">Trại gà đã thuê</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium">{group.farmRental.available_farms?.name}</h5>
                            <p className="text-sm text-muted-foreground">
                              📍 {group.farmRental.available_farms?.location}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Thuê từ: {formatDate(group.farmRental.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600">
                              {formatCurrency(group.farmRental.rental_price)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Chi phí: {formatCurrency(group.farmRental.monthly_cost)}/tháng
                            </p>
                            <Badge variant={group.farmRental.status === 'active' ? 'default' : 'secondary'}>
                              {group.farmRental.status === 'active' ? 'Đang hoạt động' : 'Đã kết thúc'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Chickens Section */}
                    {group.chickens.length > 0 && (
                      <div className="border rounded-lg p-4 bg-orange-50/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Egg className="h-4 w-4 text-orange-600" />
                          <h4 className="font-medium text-orange-900">Gà trong gói ({group.chickens.length} loại)</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {group.chickens.map((chicken) => (
                            <div key={chicken.id} className="bg-white rounded p-3 border">
                              <h5 className="font-medium">{chicken.chicken_types.name}</h5>
                              <p className="text-sm text-muted-foreground mb-2">
                                {chicken.chicken_types.description}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Số lượng: <strong>{chicken.quantity} con</strong></span>
                                <Badge variant="secondary">
                                  {chicken.chicken_types.egg_production_rate} trứng/2 ngày
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Accessories Section */}
                    {group.accessories.length > 0 && (
                      <div className="border rounded-lg p-4 bg-purple-50/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="h-4 w-4 text-purple-600" />
                          <h4 className="font-medium text-purple-900">Phụ kiện trong gói ({group.accessories.length} loại)</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {group.accessories.map((accessory) => (
                            <div key={accessory.id} className="bg-white rounded p-3 border">
                              <h5 className="font-medium">{accessory.accessories.name}</h5>
                              <p className="text-sm text-muted-foreground mb-2">
                                {accessory.accessories.description}
                              </p>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Số lượng: <strong>{accessory.quantity}</strong></span>
                                <Badge variant="outline">
                                  {accessory.accessories.effect_type}: +{accessory.accessories.effect_value}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {group.chickens.length === 0 && group.accessories.length === 0 && !group.farmRental && (
                      <div className="text-center py-4 text-muted-foreground">
                        <p>Không tìm thấy chi tiết cho gói này</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};

export default PackageTransactionDetails;