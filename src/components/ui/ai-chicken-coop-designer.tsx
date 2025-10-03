import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Palette, Hammer, Ruler, Sparkles, Download, DollarSign, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AiChickenCoopDesigner = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageBlob, setGeneratedImageBlob] = useState<Blob | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<any>(null);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [isRequestingQuote, setIsRequestingQuote] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [zaloContact, setZaloContact] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    material: '',
    color: '',
    size: '',
    features: '',
    style: '',
    additional: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePrompt = () => {
    const prompt = `Thiết kế một chuồng gà hiện đại và chức năng với các thông số sau:
    - Vật liệu: ${formData.material || 'gỗ tự nhiên'}
    - Màu sắc: ${formData.color || 'màu tự nhiên'}
    - Kích thước: ${formData.size || 'trung bình'}
    - Tính năng đặc biệt: ${formData.features || 'cơ bản'}
    - Phong cách: ${formData.style || 'truyền thống'}
    ${formData.additional ? `- Yêu cầu thêm: ${formData.additional}` : ''}
    
    Tạo một hình ảnh 3D chất lượng cao, chi tiết, với góc nhìn 3/4, ánh sáng tự nhiên, cho thấy toàn bộ chuồng gà với môi trường xung quanh đẹp mắt.`;
    
    return prompt;
  };

  const handleGenerate = async () => {
    if (!formData.material && !formData.color && !formData.size) {
      toast.error('Vui lòng nhập ít nhất một thông số thiết kế');
      return;
    }

    setIsGenerating(true);
    setEstimatedPrice(null);
    setGeneratedImageBlob(null);
    try {
      const prompt = generatePrompt();
      
      const { data, error } = await supabase.functions.invoke('generate-chicken-coop', {
        body: { prompt }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        
        // Fetch and store the blob immediately for download
        try {
          const response = await fetch(data.imageUrl);
          if (response.ok) {
            const blob = await response.blob();
            setGeneratedImageBlob(blob);
          }
        } catch (fetchError) {
          console.error('Error fetching image blob:', fetchError);
        }
        
        toast.success('Thiết kế chuồng gà đã được tạo thành công!');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Có lỗi xảy ra khi tạo thiết kế. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      if (generatedImageBlob) {
        const url = window.URL.createObjectURL(generatedImageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chuong-ga-thiet-ke-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Đã tải xuống thiết kế!');
        return;
      }

      if (generatedImage) {
        // Fallback qua edge function để vượt CORS
        const { data, error } = await supabase.functions.invoke('proxy-image-download', {
          body: { imageUrl: generatedImage }
        });
        if (error) throw error;
        if (data?.image) {
          const a = document.createElement('a');
          a.href = data.image; // data URL
          a.download = `chuong-ga-thiet-ke-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success('Đã tải xuống thiết kế!');
          return;
        }
      }

      toast.error('Không có thiết kế để tải xuống.');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Không thể tải xuống. Vui lòng thử lại.');
    }
  };

  const handleEstimatePrice = async () => {
    setIsEstimating(true);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-coop-price', {
        body: {
          material: formData.material || 'gỗ tự nhiên',
          size: formData.size || 'trung bình',
          features: formData.features || 'cơ bản',
          style: formData.style || 'truyền thống',
          additional: formData.additional
        }
      });

      if (error) throw error;

      setEstimatedPrice(data);
      setShowPriceDialog(true);
    } catch (error) {
      console.error('Error estimating price:', error);
      toast.error('Không thể ước tính giá. Vui lòng thử lại.');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleRequestQuote = async () => {
    if (!generatedImage) {
      toast.error('Vui lòng tạo thiết kế trước khi yêu cầu báo giá.');
      return;
    }

    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      toast.error('Vui lòng đăng nhập để yêu cầu báo giá.');
      return;
    }

    setIsRequestingQuote(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-coop-quote', {
        body: {
          imageUrl: generatedImage,
          designParams: formData,
          estimatedPrice: estimatedPrice?.estimatedPrice
        }
      });

      if (error) {
        console.error('Quote request error:', error);
        throw error;
      }

      if (data?.success) {
        if (data?.zaloContact) {
          setZaloContact(data.zaloContact);
        }
        setShowQuoteDialog(true);
        toast.success(data?.message || 'Yêu cầu báo giá đã được gửi!');
      } else {
        throw new Error(data?.error || 'Không thể gửi yêu cầu');
      }
    } catch (error) {
      console.error('Error requesting quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể gửi yêu cầu. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setIsRequestingQuote(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Thiết Kế Chuồng Gà AI
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sử dụng công nghệ AI để tạo ra thiết kế chuồng gà hoàn hảo theo ý tưởng của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Form thiết kế */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Tùy Chỉnh Thiết Kế
              </CardTitle>
              <CardDescription>
                Nhập thông tin để AI tạo thiết kế chuồng gà theo yêu cầu của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="material" className="flex items-center gap-2">
                    <Hammer className="h-4 w-4" />
                    Vật liệu
                  </Label>
                  <Select onValueChange={(value) => handleInputChange('material', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vật liệu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gỗ tự nhiên">Gỗ tự nhiên</SelectItem>
                      <SelectItem value="gỗ composite">Gỗ composite</SelectItem>
                      <SelectItem value="kim loại">Kim loại</SelectItem>
                      <SelectItem value="nhựa">Nhựa cao cấp</SelectItem>
                      <SelectItem value="tre">Tre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Màu sắc
                  </Label>
                  <Select onValueChange={(value) => handleInputChange('color', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn màu sắc" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="màu tự nhiên">Màu tự nhiên</SelectItem>
                      <SelectItem value="xanh lá">Xanh lá</SelectItem>
                      <SelectItem value="nâu">Nâu</SelectItem>
                      <SelectItem value="trắng">Trắng</SelectItem>
                      <SelectItem value="xám">Xám</SelectItem>
                      <SelectItem value="đỏ">Đỏ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size" className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Kích thước
                </Label>
                <Select onValueChange={(value) => handleInputChange('size', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn kích thước" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nhỏ">Nhỏ (2-5 con gà)</SelectItem>
                    <SelectItem value="trung bình">Trung bình (6-15 con gà)</SelectItem>
                    <SelectItem value="lớn">Lớn (16-30 con gà)</SelectItem>
                    <SelectItem value="rất lớn">Rất lớn (30+ con gà)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Tính năng đặc biệt</Label>
                <Select onValueChange={(value) => handleInputChange('features', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tính năng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cơ bản">Cơ bản</SelectItem>
                    <SelectItem value="tự động cho ăn">Hệ thống tự động cho ăn</SelectItem>
                    <SelectItem value="tự động uống nước">Hệ thống tự động uống nước</SelectItem>
                    <SelectItem value="điều hòa nhiệt độ">Điều hòa nhiệt độ</SelectItem>
                    <SelectItem value="camera giám sát">Camera giám sát</SelectItem>
                    <SelectItem value="năng lượng mặt trời">Năng lượng mặt trời</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Phong cách</Label>
                <Select onValueChange={(value) => handleInputChange('style', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phong cách" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truyền thống">Truyền thống</SelectItem>
                    <SelectItem value="hiện đại">Hiện đại</SelectItem>
                    <SelectItem value="rustic">Rustic</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional">Yêu cầu thêm (tùy chọn)</Label>
                <Textarea
                  placeholder="Mô tả thêm yêu cầu đặc biệt của bạn..."
                  value={formData.additional}
                  onChange={(e) => handleInputChange('additional', e.target.value)}
                  className="min-h-20"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Đang tạo thiết kế...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Tạo Thiết Kế
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Kết quả */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Kết Quả Thiết Kế</CardTitle>
              <CardDescription>
                Thiết kế chuồng gà được tạo bởi AI sẽ hiển thị ở đây
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted/30 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center">
                {isGenerating ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Đang tạo thiết kế...</p>
                  </div>
                ) : generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Thiết kế chuồng gà AI"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <Sparkles className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Thiết kế của bạn sẽ xuất hiện ở đây
                    </p>
                  </div>
                )}
              </div>
              
              {generatedImage && (
                <div className="mt-6 space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Tải Xuống Thiết Kế
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={handleEstimatePrice}
                    disabled={isEstimating}
                  >
                    {isEstimating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Đang ước tính...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Giá Tham Khảo
                      </>
                    )}
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={handleRequestQuote}
                    disabled={isRequestingQuote}
                  >
                    {isRequestingQuote ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Yêu Cầu Báo Giá
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Price Estimation Dialog */}
        <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Giá Tham Khảo</DialogTitle>
              <DialogDescription>
                Ước tính chi phí xây dựng chuồng gà theo thiết kế của bạn
              </DialogDescription>
            </DialogHeader>
            {estimatedPrice && (
              <div className="space-y-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Tổng ước tính</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(estimatedPrice.estimatedPrice)}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold">Chi tiết:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Vật liệu:</span>
                      <span>{formatCurrency(estimatedPrice.breakdown.materials)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nhân công:</span>
                      <span>{formatCurrency(estimatedPrice.breakdown.labor)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tính năng đặc biệt:</span>
                      <span>{formatCurrency(estimatedPrice.breakdown.features)}</span>
                    </div>
                  </div>
                </div>
                {estimatedPrice.notes && (
                  <div className="bg-muted p-3 rounded text-sm">
                    <p className="font-semibold mb-1">Ghi chú:</p>
                    <p className="text-muted-foreground">{estimatedPrice.notes}</p>
                  </div>
                )}
                <Button 
                  className="w-full"
                  onClick={() => {
                    setShowPriceDialog(false);
                    handleRequestQuote();
                  }}
                >
                  Yêu Cầu Báo Giá Chi Tiết
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Quote Request Dialog */}
        <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yêu Cầu Đã Được Gửi!</DialogTitle>
              <DialogDescription>
                Chúng tôi đã nhận được yêu cầu báo giá của bạn
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Đội ngũ của chúng tôi sẽ xem xét thiết kế và liên hệ với bạn sớm nhất có thể.
              </p>
              {zaloContact && (
                <div className="bg-primary/10 p-4 rounded-lg space-y-3">
                  <p className="font-semibold">Hoặc liên hệ ngay qua Zalo:</p>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      window.open(`https://zalo.me/${zaloContact}`, '_blank');
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat với chúng tôi trên Zalo
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default AiChickenCoopDesigner;