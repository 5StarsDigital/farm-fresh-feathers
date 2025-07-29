import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, DollarSign } from "lucide-react";

const AvailableFarmsSection = () => {
  const farms = [
    {
      id: 1,
      name: "Trang trại Mini Hải Dương",
      image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      address: "Hải Dương",
      minChickens: 5,
      maxChickens: 15,
      rentalCost: 500000,
      monthlyFee: 200000,
      available: true
    },
    {
      id: 2,
      name: "Trang trại Mini Hà Nội",
      image: "https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      address: "Hà Nội",
      minChickens: 8,
      maxChickens: 20,
      rentalCost: 750000,
      monthlyFee: 300000,
      available: true
    },
    {
      id: 3,
      name: "Trang trại Mini Bắc Ninh",
      image: "https://images.unsplash.com/photo-1612900922865-0a3b9a8e5e1a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
      address: "Bắc Ninh",
      minChickens: 6,
      maxChickens: 18,
      rentalCost: 600000,
      monthlyFee: 250000,
      available: false
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trang Trại Mini Có Sẵn
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Khám phá các trang trại mini được thiết kế chuyên nghiệp, sẵn sàng cho việc nuôi gà của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {farms.map((farm) => (
            <Card key={farm.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative">
                <img 
                  src={farm.image} 
                  alt={farm.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge variant={farm.available ? "default" : "secondary"}>
                    {farm.available ? "Có sẵn" : "Đã thuê"}
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-xl">{farm.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {farm.address}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Số lượng gà: {farm.minChickens} - {farm.maxChickens} con</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span>Chi phí thuê: {formatCurrency(farm.rentalCost)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span>Phí duy trì/tháng: {formatCurrency(farm.monthlyFee)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  disabled={!farm.available}
                  variant={farm.available ? "default" : "secondary"}
                >
                  {farm.available ? "Thuê Ngay" : "Đã được thuê"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AvailableFarmsSection;