import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, RefreshCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface FarmRental {
  id: string;
  user_id: string;
  farm_id: string;
  rental_price: number;
  monthly_cost: number;
  status: string;
  created_at: string;
  last_billed_at: string | null;
  available_farms?: {
    name: string;
    location: string;
  } | null;
  profiles?: {
    email: string;
    full_name: string;
  } | null;
  farms?: {
    farm_name: string;
  } | null;
}

export const FarmRentalsManagement = () => {
  const [farmRentals, setFarmRentals] = useState<FarmRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchFarmRentals();
  }, []);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { 
      style: "currency", 
      currency: "VND" 
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const fetchFarmRentals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("farm_rentals")
        .select(`
          *,
          available_farms!farm_rentals_available_farm_id_fkey(name, location),
          profiles!farm_rentals_user_id_fkey(email, full_name),
          farms!farm_rentals_farm_id_fkey(farm_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFarmRentals((data as any) || []);
    } catch (error: any) {
      console.error("Error fetching farm rentals:", error);
      toast.error("Không thể tải dữ liệu thuê chuồng");
    } finally {
      setLoading(false);
    }
  };

  const deleteFarmRental = async (rentalId: string) => {
    try {
      setDeleting(rentalId);
      const { error } = await supabase
        .from("farm_rentals")
        .delete()
        .eq("id", rentalId);

      if (error) throw error;
      
      toast.success("Đã xóa thuê chuồng thành công");
      await fetchFarmRentals();
    } catch (error: any) {
      console.error("Error deleting farm rental:", error);
      toast.error("Không thể xóa thuê chuồng: " + (error.message || "Unknown error"));
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Đang hoạt động</Badge>;
      case "suspended":
        return <Badge variant="secondary">Tạm dừng</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quản lý Thuê Chuồng</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFarmRentals}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : farmRentals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Không có thuê chuồng nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trang trại</TableHead>
                  <TableHead>Chuồng thuê</TableHead>
                  <TableHead>Giá thuê</TableHead>
                  <TableHead>Chi phí tháng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày thuê</TableHead>
                  <TableHead>Lần tính tiền cuối</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {farmRentals.map((rental) => (
                  <TableRow key={rental.id}>
                    <TableCell className="font-medium">
                      {rental.profiles?.full_name || "Không có tên"}
                    </TableCell>
                    <TableCell>{rental.profiles?.email}</TableCell>
                    <TableCell>{rental.farms?.farm_name}</TableCell>
                    <TableCell>
                      {rental.available_farms?.name || "Không rõ"}
                      {rental.available_farms?.location && (
                        <div className="text-sm text-muted-foreground">
                          {rental.available_farms.location}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatVND(rental.rental_price)}</TableCell>
                    <TableCell>{formatVND(rental.monthly_cost)}</TableCell>
                    <TableCell>{getStatusBadge(rental.status)}</TableCell>
                    <TableCell>{formatDate(rental.created_at)}</TableCell>
                    <TableCell>
                      {rental.last_billed_at 
                        ? formatDate(rental.last_billed_at)
                        : "Chưa tính tiền"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleting === rental.id}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa thuê chuồng này không? 
                              Hành động này không thể hoàn tác và sẽ ngừng tính tiền thuê chuồng cho khách hàng này.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteFarmRental(rental.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Xác nhận xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};