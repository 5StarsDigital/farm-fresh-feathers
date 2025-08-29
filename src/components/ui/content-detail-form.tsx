import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from './rich-text-editor';
import { Plus, X, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface ContentDetailFormProps {
  type: 'farm' | 'chicken';
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: any) => void;
}

export const ContentDetailForm: React.FC<ContentDetailFormProps> = ({
  type,
  item,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    ...item,
    detailed_content: item.detailed_content || { content: '', images: [], videos: [] },
    features: item.features || [],
    characteristics: item.characteristics || [],
    care_requirements: item.care_requirements || [],
    gallery_images: item.gallery_images || []
  });

  const [newFeature, setNewFeature] = useState('');
  const [newCharacteristic, setNewCharacteristic] = useState('');
  const [newCareRequirement, setNewCareRequirement] = useState('');
  const [newGalleryImage, setNewGalleryImage] = useState('');
  const [activeTab, setActiveTab] = useState('content');

  const handleSave = async () => {
    try {
      await onSave(formData);
      toast.success(`Đã cập nhật ${type === 'farm' ? 'thông tin trại' : 'thông tin gà giống'}`);
      onClose();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu');
    }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setFormData({
      ...formData,
      features: [...formData.features, newFeature.trim()]
    });
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const addCharacteristic = () => {
    if (!newCharacteristic.trim()) return;
    setFormData({
      ...formData,
      characteristics: [...formData.characteristics, newCharacteristic.trim()]
    });
    setNewCharacteristic('');
  };

  const removeCharacteristic = (index: number) => {
    setFormData({
      ...formData,
      characteristics: formData.characteristics.filter((_, i) => i !== index)
    });
  };

  const addCareRequirement = () => {
    if (!newCareRequirement.trim()) return;
    setFormData({
      ...formData,
      care_requirements: [...formData.care_requirements, newCareRequirement.trim()]
    });
    setNewCareRequirement('');
  };

  const removeCareRequirement = (index: number) => {
    setFormData({
      ...formData,
      care_requirements: formData.care_requirements.filter((_, i) => i !== index)
    });
  };

  const addGalleryImage = () => {
    if (!newGalleryImage.trim()) return;
    setFormData({
      ...formData,
      gallery_images: [...formData.gallery_images, newGalleryImage.trim()]
    });
    setNewGalleryImage('');
  };

  const removeGalleryImage = (index: number) => {
    setFormData({
      ...formData,
      gallery_images: formData.gallery_images.filter((_, i) => i !== index)
    });
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n/g, '<br>');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Chỉnh sửa nội dung chi tiết - {item.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Nội dung</TabsTrigger>
            <TabsTrigger value="features">
              {type === 'farm' ? 'Tiện ích' : 'Đặc điểm'}
            </TabsTrigger>
            <TabsTrigger value="gallery">Thư viện</TabsTrigger>
            <TabsTrigger value="preview">Xem trước</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <RichTextEditor
              value={formData.detailed_content}
              onChange={(value) => setFormData({
                ...formData,
                detailed_content: value
              })}
              placeholder={`Nhập mô tả chi tiết về ${type === 'farm' ? 'trang trại' : 'giống gà'}...`}
            />
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            {type === 'farm' ? (
              <Card>
                <CardHeader>
                  <CardTitle>Tiện ích trang trại</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="VD: Camera giám sát 24/7"
                      onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                    />
                    <Button onClick={addFeature}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature: string, index: number) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {feature}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-destructive" 
                          onClick={() => removeFeature(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Đặc điểm nổi bật</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newCharacteristic}
                        onChange={(e) => setNewCharacteristic(e.target.value)}
                        placeholder="VD: Năng suất đẻ trứng cao"
                        onKeyPress={(e) => e.key === 'Enter' && addCharacteristic()}
                      />
                      <Button onClick={addCharacteristic}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.characteristics.map((char: string, index: number) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {char}
                          <X 
                            className="w-3 h-3 cursor-pointer hover:text-destructive" 
                            onClick={() => removeCharacteristic(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Yêu cầu chăm sóc</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newCareRequirement}
                        onChange={(e) => setNewCareRequirement(e.target.value)}
                        placeholder="VD: Cần không gian rộng rãi"
                        onKeyPress={(e) => e.key === 'Enter' && addCareRequirement()}
                      />
                      <Button onClick={addCareRequirement}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.care_requirements.map((req: string, index: number) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {req}
                          <X 
                            className="w-3 h-3 cursor-pointer hover:text-destructive" 
                            onClick={() => removeCareRequirement(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thư viện hình ảnh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newGalleryImage}
                    onChange={(e) => setNewGalleryImage(e.target.value)}
                    placeholder="URL hình ảnh..."
                  />
                  <Button onClick={addGalleryImage}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.gallery_images.map((url: string, index: number) => (
                    <div key={index} className="relative">
                      <img 
                        src={url} 
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0"
                        onClick={() => removeGalleryImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Xem trước nội dung
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdown(formData.detailed_content.content) 
                  }}
                />
                
                {formData.detailed_content.images.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Hình ảnh trong nội dung:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.detailed_content.images.map((img: any, index: number) => (
                        <div key={index}>
                          <img src={img.url} alt={img.caption} className="w-full h-32 object-cover rounded" />
                          {img.caption && (
                            <p className="text-xs text-muted-foreground mt-1">{img.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Lưu thay đổi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};