import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Users, Store, ShoppingCart, AlertTriangle, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
interface AvailableFarm {
  id: string;
  name: string;
  location: string;
  image_url: string;
  monthly_cost: number;
  rating: number;
  review_count: number;
  available_coops: number;
  total_coops: number;
  rental_price: number;
}
interface ChickenType {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  egg_production_rate: number;
}
interface Transaction {
  id: string;
  farm_id: string;
  transaction_type: string;
  amount: number;
  quantity: number;
  description: string;
  created_at: string;
  user_email: string;
  user_name: string;
}
interface PaymentTransaction {
  id: string;
  user_id: string;
  farm_id: string;
  amount: number;
  status: string;
  payment_method: string;
  transaction_id: string;
  created_at: string;
  user_email: string;
  user_name: string;
}
export default function AdminDashboard() {
  const {
    user,
    userRole,
    loading
  } = useAuth();
  const [farms, setFarms] = useState<AvailableFarm[]>([]);
  const [chickenTypes, setChickenTypes] = useState<ChickenType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFarm, setEditingFarm] = useState<AvailableFarm | null>(null);
  const [isAddingFarm, setIsAddingFarm] = useState(false);
  const [editingChicken, setEditingChicken] = useState<ChickenType | null>(null);
  const [isAddingChicken, setIsAddingChicken] = useState(false);
  useEffect(() => {
    if (user && (userRole === 'admin' || userRole === 'super_admin')) {
      fetchAllData();
    }
  }, [user, userRole]);
  const fetchAllData = async () => {
    try {
      // Fetch farms
      const {
        data: farmsData
      } = await supabase.from('available_farms').select('*').order('created_at', {
        ascending: false
      });

      // Fetch chicken types
      const {
        data: chickenData
      } = await supabase.from('chicken_types').select('*').order('created_at', {
        ascending: false
      });

      // Fetch transactions
      const {
        data: transactionsData
      } = await supabase.from('transactions').select('*').order('created_at', {
        ascending: false
      });

      // Fetch payment transactions  
      const {
        data: paymentData
      } = await supabase.from('payment_transactions').select('*').order('created_at', {
        ascending: false
      });
      setFarms(farmsData || []);
      setChickenTypes(chickenData || []);
      setTransactions(transactionsData || []);
      setPaymentTransactions(paymentData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Lỗi khi tải dữ liệu');
    }
  };
  const handleSaveFarm = async (farmData: any) => {
    try {
      if (editingFarm) {
        // Update existing farm
        const {
          error
        } = await supabase.from('available_farms').update(farmData).eq('id', editingFarm.id);
        if (error) throw error;
        toast.success('Cập nhật trại thành công');
      } else {
        // Add new farm
        const {
          error
        } = await supabase.from('available_farms').insert(farmData);
        if (error) throw error;
        toast.success('Thêm trại mới thành công');
      }
      setEditingFarm(null);
      setIsAddingFarm(false);
      fetchAllData();
    } catch (error) {
      console.error('Error saving farm:', error);
      toast.error('Lỗi khi lưu trại');
    }
  };
  const handleDeleteFarm = async (farmId: string) => {
    try {
      const {
        error
      } = await supabase.from('available_farms').delete().eq('id', farmId);
      if (error) throw error;
      toast.success('Xóa trại thành công');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting farm:', error);
      toast.error('Lỗi khi xóa trại');
    }
  };
  const handleSaveChicken = async (chickenData: any) => {
    try {
      if (editingChicken) {
        // Update existing chicken type
        const {
          error
        } = await supabase.from('chicken_types').update(chickenData).eq('id', editingChicken.id);
        if (error) throw error;
        toast.success('Cập nhật giống gà thành công');
      } else {
        // Add new chicken type
        const {
          error
        } = await supabase.from('chicken_types').insert(chickenData);
        if (error) throw error;
        toast.success('Thêm giống gà mới thành công');
      }
      setEditingChicken(null);
      setIsAddingChicken(false);
      fetchAllData();
    } catch (error) {
      console.error('Error saving chicken type:', error);
      toast.error('Lỗi khi lưu giống gà');
    }
  };
  const handleDeleteChicken = async (chickenId: string) => {
    try {
      const {
        error
      } = await supabase.from('chicken_types').delete().eq('id', chickenId);
      if (error) throw error;
      toast.success('Xóa giống gà thành công');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting chicken type:', error);
      toast.error('Lỗi khi xóa giống gà');
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };
  const getStatusBadge = (status: string) => {
    const variants: {
      [key: string]: "default" | "secondary" | "destructive" | "outline";
    } = {
      completed: "default",
      pending: "secondary",
      failed: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };
  const filteredTransactions = transactions.filter(t => t.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) || t.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredPayments = paymentTransactions.filter(p => p.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) || p.user_name?.toLowerCase().includes(searchQuery.toLowerCase()));
  if (loading) {
    return <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>;
  }
  if (!user || userRole !== 'admin' && userRole !== 'super_admin') {
    return <Navigate to="/" replace />;
  }
  return <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Khu vực Quản trị</h1>
          <p className="text-muted-foreground">Quản lý hệ thống và cửa hàng</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng trại</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{farms.length}</div>
              <p className="text-xs text-muted-foreground">Trại có sẵn</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giống gà</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chickenTypes.length}</div>
              <p className="text-xs text-muted-foreground">Loại có sẵn</p>
            </CardContent>
          </Card>

        </div>

        <Tabs defaultValue="farms" className="space-y-4">
          <TabsList>
            <TabsTrigger value="farms">Quản lý Trại</TabsTrigger>
            <TabsTrigger value="chickens">Giống gà</TabsTrigger>
            <TabsTrigger value="activities">Hoạt động</TabsTrigger>
          </TabsList>

          <TabsContent value="farms" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Quản lý Trại gà cho thuê</h2>
              <Dialog open={isAddingFarm} onOpenChange={setIsAddingFarm}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsAddingFarm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm trại mới
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm trại mới</DialogTitle>
                  </DialogHeader>
                  <FarmForm onSave={handleSaveFarm} onCancel={() => setIsAddingFarm(false)} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {farms.map(farm => <Card key={farm.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        {farm.image_url && <img src={farm.image_url} alt={farm.name} className="w-20 h-20 object-cover rounded-lg" />}
                        <div>
                          <h3 className="font-semibold text-lg">{farm.name}</h3>
                          <p className="text-muted-foreground">{farm.location}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span>Giá thuê: {formatCurrency(farm.rental_price)}</span>
                            <span>Chi phí hàng tháng: {formatCurrency(farm.monthly_cost)}</span>
                            <span>Chuồng: {farm.available_coops}/{farm.total_coops}</span>
                            <span>⭐ {farm.rating} ({farm.review_count} đánh giá)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingFarm(farm)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Chỉnh sửa trại</DialogTitle>
                            </DialogHeader>
                            <FarmForm farm={farm} onSave={handleSaveFarm} onCancel={() => setEditingFarm(null)} />
                          </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteFarm(farm.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </TabsContent>

          <TabsContent value="chickens" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Quản lý Giống gà</h2>
              <Dialog open={isAddingChicken} onOpenChange={setIsAddingChicken}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsAddingChicken(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm giống gà mới
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm giống gà mới</DialogTitle>
                  </DialogHeader>
                  <ChickenForm onSave={handleSaveChicken} onCancel={() => setIsAddingChicken(false)} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {chickenTypes.map(chicken => <Card key={chicken.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        {chicken.image_url && <img src={chicken.image_url} alt={chicken.name} className="w-20 h-20 object-cover rounded-lg" />}
                        <div>
                          <h3 className="font-semibold text-lg">{chicken.name}</h3>
                          <p className="text-muted-foreground">{chicken.description}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span>Giá: {formatCurrency(chicken.price)}</span>
                            <span>Tỷ lệ đẻ trứng: {chicken.egg_production_rate}/ngày</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingChicken(chicken)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Chỉnh sửa giống gà</DialogTitle>
                            </DialogHeader>
                            <ChickenForm chicken={chicken} onSave={handleSaveChicken} onCancel={() => setEditingChicken(null)} />
                          </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteChicken(chicken.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </TabsContent>


          <TabsContent value="activities" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Hoạt động hệ thống</h2>
              <Input placeholder="Tìm kiếm giao dịch..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-64" />
            </div>

            <Tabs defaultValue="transactions" className="space-y-4">
              <TabsList>
                <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
                <TabsTrigger value="payments">Thanh toán</TabsTrigger>
              </TabsList>

              <TabsContent value="transactions">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Người dùng</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead>Ngày</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map(transaction => <TableRow key={transaction.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{transaction.user_name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{transaction.user_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{transaction.transaction_type}</TableCell>
                          <TableCell>{formatCurrency(transaction.amount || 0)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{new Date(transaction.created_at).toLocaleDateString('vi-VN')}</TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Người dùng</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Phương thức</TableHead>
                        <TableHead>Ngày</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map(payment => <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{payment.user_name || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{payment.user_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{getStatusBadge(payment.status)}</TableCell>
                          <TableCell>{payment.payment_method}</TableCell>
                          <TableCell>{new Date(payment.created_at).toLocaleDateString('vi-VN')}</TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}

// Farm form component
function FarmForm({
  farm,
  onSave,
  onCancel
}: {
  farm?: AvailableFarm;
  onSave: (data: Partial<AvailableFarm>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: farm?.name || '',
    location: farm?.location || '',
    image_url: farm?.image_url || '',
    monthly_cost: farm?.monthly_cost || 0,
    rental_price: farm?.rental_price || 0,
    rating: farm?.rating || 4.5,
    review_count: farm?.review_count || 0,
    available_coops: farm?.available_coops || 0,
    total_coops: farm?.total_coops || 0
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  return <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Tên trại</Label>
        <Input id="name" value={formData.name} onChange={e => setFormData({
        ...formData,
        name: e.target.value
      })} required />
      </div>
      
      <div>
        <Label htmlFor="location">Địa điểm</Label>
        <Input id="location" value={formData.location} onChange={e => setFormData({
        ...formData,
        location: e.target.value
      })} required />
      </div>
      
      <div>
        <Label htmlFor="image_url">URL hình ảnh</Label>
        <Input id="image_url" value={formData.image_url} onChange={e => setFormData({
        ...formData,
        image_url: e.target.value
      })} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rental_price">Giá thuê</Label>
          <Input id="rental_price" type="number" value={formData.rental_price} onChange={e => setFormData({
          ...formData,
          rental_price: Number(e.target.value)
        })} required />
        </div>
        
        <div>
          <Label htmlFor="monthly_cost">Chi phí hàng tháng</Label>
          <Input id="monthly_cost" type="number" value={formData.monthly_cost} onChange={e => setFormData({
          ...formData,
          monthly_cost: Number(e.target.value)
        })} required />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="available_coops">Chuồng có sẵn</Label>
          <Input id="available_coops" type="number" value={formData.available_coops} onChange={e => setFormData({
          ...formData,
          available_coops: Number(e.target.value)
        })} required />
        </div>
        
        <div>
          <Label htmlFor="total_coops">Tổng chuồng</Label>
          <Input id="total_coops" type="number" value={formData.total_coops} onChange={e => setFormData({
          ...formData,
          total_coops: Number(e.target.value)
        })} required />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit">
          {farm ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </form>;
}

// Chicken form component
function ChickenForm({
  chicken,
  onSave,
  onCancel
}: {
  chicken?: ChickenType;
  onSave: (data: Partial<ChickenType>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: chicken?.name || '',
    description: chicken?.description || '',
    price: chicken?.price || 0,
    image_url: chicken?.image_url || '',
    egg_production_rate: chicken?.egg_production_rate || 1
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  return <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="chicken_name">Tên giống gà</Label>
        <Input id="chicken_name" value={formData.name} onChange={e => setFormData({
        ...formData,
        name: e.target.value
      })} required />
      </div>
      
      <div>
        <Label htmlFor="chicken_description">Mô tả</Label>
        <Input id="chicken_description" value={formData.description} onChange={e => setFormData({
        ...formData,
        description: e.target.value
      })} />
      </div>
      
      <div>
        <Label htmlFor="chicken_image_url">URL hình ảnh</Label>
        <Input id="chicken_image_url" value={formData.image_url} onChange={e => setFormData({
        ...formData,
        image_url: e.target.value
      })} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="chicken_price">Giá (VND)</Label>
          <Input id="chicken_price" type="number" value={formData.price} onChange={e => setFormData({
          ...formData,
          price: Number(e.target.value)
        })} required />
        </div>
        
        <div>
          <Label htmlFor="egg_production_rate">Tỷ lệ đẻ trứng/ngày</Label>
          <Input id="egg_production_rate" type="number" value={formData.egg_production_rate} onChange={e => setFormData({
          ...formData,
          egg_production_rate: Number(e.target.value)
        })} required />
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit">
          {chicken ? 'Cập nhật' : 'Thêm mới'}
        </Button>
      </div>
    </form>;
}