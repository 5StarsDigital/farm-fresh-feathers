import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Palette, Hammer, Ruler, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AiChickenCoopDesigner = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
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
    try {
      const prompt = generatePrompt();
      
      const { data, error } = await supabase.functions.invoke('generate-chicken-coop', {
        body: { prompt }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success('Thiết kế chuồng gà đã được tạo thành công!');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Có lỗi xảy ra khi tạo thiết kế. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
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
                  <Button variant="outline" className="w-full">
                    Tải Xuống Thiết Kế
                  </Button>
                  <Button variant="secondary" className="w-full">
                    Yêu Cầu Báo Giá
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AiChickenCoopDesigner;