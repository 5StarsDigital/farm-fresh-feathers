import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Image, 
  Video, 
  Link, 
  Type,
  Plus,
  X,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

interface RichTextEditorProps {
  value: {
    content: string;
    images: Array<{url: string; caption?: string}>;
    videos: Array<{url: string; caption?: string}>;
  };
  onChange: (value: {
    content: string;
    images: Array<{url: string; caption?: string}>;
    videos: Array<{url: string; caption?: string}>;
  }) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Nhập nội dung chi tiết..."
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  const handleContentChange = (newContent: string) => {
    onChange({
      ...value,
      content: newContent
    });
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const newText = before + selectedText + after;
    
    const newContent = 
      textarea.value.substring(0, start) + 
      newText + 
      textarea.value.substring(end);
    
    handleContentChange(newContent);
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      } else {
        textarea.setSelectionRange(start + before.length, start + before.length);
      }
    }, 0);
  };

  const addImage = () => {
    if (!imageUrl.trim()) {
      toast.error('Vui lòng nhập URL hình ảnh');
      return;
    }

    const newImages = [...value.images, { url: imageUrl.trim(), caption: imageCaption.trim() }];
    onChange({
      ...value,
      images: newImages
    });

    setImageUrl('');
    setImageCaption('');
    setIsImageDialogOpen(false);
    toast.success('Đã thêm hình ảnh');
  };

  const addVideo = () => {
    if (!videoUrl.trim()) {
      toast.error('Vui lòng nhập URL video');
      return;
    }

    const newVideos = [...value.videos, { url: videoUrl.trim(), caption: videoCaption.trim() }];
    onChange({
      ...value,
      videos: newVideos
    });

    setVideoUrl('');
    setVideoCaption('');
    setIsVideoDialogOpen(false);
    toast.success('Đã thêm video');
  };

  const removeImage = (index: number) => {
    const newImages = value.images.filter((_, i) => i !== index);
    onChange({
      ...value,
      images: newImages
    });
    toast.success('Đã xóa hình ảnh');
  };

  const removeVideo = (index: number) => {
    const newVideos = value.videos.filter((_, i) => i !== index);
    onChange({
      ...value,
      videos: newVideos
    });
    toast.success('Đã xóa video');
  };

  const formatButtons = [
    { icon: Bold, action: () => insertText('**', '**'), tooltip: 'In đậm' },
    { icon: Italic, action: () => insertText('*', '*'), tooltip: 'In nghiêng' },
    { icon: Underline, action: () => insertText('<u>', '</u>'), tooltip: 'Gạch chân' },
    { icon: List, action: () => insertText('- '), tooltip: 'Danh sách' },
    { icon: ListOrdered, action: () => insertText('1. '), tooltip: 'Danh sách số' },
    { icon: Type, action: () => insertText('# '), tooltip: 'Tiêu đề' },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
        {formatButtons.map((button, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={button.action}
            title={button.tooltip}
          >
            <button.icon className="w-4 h-4" />
          </Button>
        ))}
        
        <div className="w-px bg-border mx-1" />
        
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" title="Thêm hình ảnh">
              <Image className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm hình ảnh</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageUrl">URL hình ảnh</Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="imageCaption">Chú thích (tùy chọn)</Label>
                <Input
                  id="imageCaption"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Mô tả hình ảnh..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={addImage}>
                  Thêm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" title="Thêm video">
              <Video className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm video</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="videoUrl">URL video (YouTube, Vimeo, hoặc file video)</Label>
                <Input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... hoặc https://example.com/video.mp4"
                />
              </div>
              <div>
                <Label htmlFor="videoCaption">Chú thích (tùy chọn)</Label>
                <Input
                  id="videoCaption"
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                  placeholder="Mô tả video..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={addVideo}>
                  Thêm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Text Editor */}
      <div>
        <Label>Nội dung chi tiết</Label>
        <Textarea
          ref={textareaRef}
          value={value.content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[300px] font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Hỗ trợ Markdown: **đậm**, *nghiêng*, # tiêu đề, - danh sách
        </p>
      </div>

      {/* Images */}
      {value.images.length > 0 && (
        <div>
          <Label>Hình ảnh đã thêm ({value.images.length})</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
            {value.images.map((image, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-2">
                  <img 
                    src={image.url} 
                    alt={image.caption || `Hình ${index + 1}`}
                    className="w-full h-20 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  {image.caption && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {image.caption}
                    </p>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                    onClick={() => removeImage(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {value.videos.length > 0 && (
        <div>
          <Label>Video đã thêm ({value.videos.length})</Label>
          <div className="space-y-2 mt-2">
            {value.videos.map((video, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{video.url}</p>
                      {video.caption && (
                        <p className="text-xs text-muted-foreground truncate">
                          {video.caption}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-8 h-8 p-0 flex-shrink-0"
                      onClick={() => removeVideo(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
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