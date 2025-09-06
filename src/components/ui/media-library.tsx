import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, Copy, Upload, Image, Video, File, Search, ExternalLink } from 'lucide-react';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { FileUploadZone } from '@/components/ui/file-upload-zone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  thumbnail_path?: string;
  alt_text?: string;
  created_at: string;
  url?: string;
}

export const MediaLibrary: React.FC = () => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'other'>('all');
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null);
  const { uploadMultipleFiles, deleteFile, isUploading } = useMediaUpload();

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get public URLs for files
      const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(file.file_path);
          
          return {
            ...file,
            url: urlData.publicUrl
          };
        })
      );

      setMediaFiles(filesWithUrls);
    } catch (error) {
      console.error('Error fetching media files:', error);
      toast.error('Lỗi khi tải danh sách media');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      const uploadedFiles = await uploadMultipleFiles(files, 'uploads');
      if (uploadedFiles.length > 0) {
        toast.success(`Đã upload ${uploadedFiles.length} file thành công`);
        fetchMediaFiles(); // Refresh the list
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Lỗi khi upload file');
    }
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    
    try {
      const success = await deleteFile(fileToDelete);
      if (success) {
        toast.success('Đã xóa file thành công');
        fetchMediaFiles(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Lỗi khi xóa file');
    } finally {
      setFileToDelete(null);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Đã copy URL vào clipboard');
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = mediaFiles.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || 
      (filterType === 'image' && file.mime_type.startsWith('image/')) ||
      (filterType === 'video' && file.mime_type.startsWith('video/')) ||
      (filterType === 'other' && !file.mime_type.startsWith('image/') && !file.mime_type.startsWith('video/'));
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kho Media</h2>
          <p className="text-muted-foreground">Quản lý ảnh và video của bạn</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Media Files</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <FileUploadZone
                onFilesSelected={handleFileUpload}
                accept={["image/*", "video/*"]}
                maxSize={10 * 1024 * 1024} // 10MB
                multiple
                disabled={isUploading}
              />
              {isUploading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Đang upload...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
            size="sm"
          >
            Tất cả
          </Button>
          <Button
            variant={filterType === 'image' ? 'default' : 'outline'}
            onClick={() => setFilterType('image')}
            size="sm"
          >
            Ảnh
          </Button>
          <Button
            variant={filterType === 'video' ? 'default' : 'outline'}
            onClick={() => setFilterType('video')}
            size="sm"
          >
            Video
          </Button>
          <Button
            variant={filterType === 'other' ? 'default' : 'outline'}
            onClick={() => setFilterType('other')}
            size="sm"
          >
            Khác
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFiles.map((file) => (
          <Card key={file.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader className="p-3">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-3">
                {file.mime_type.startsWith('image/') ? (
                  <img
                    src={file.url}
                    alt={file.alt_text || file.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : file.mime_type.startsWith('video/') ? (
                  <video
                    src={file.url}
                    className="w-full h-full object-cover"
                    controls={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <File className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getFileIcon(file.mime_type)}
                  <h3 className="font-medium text-sm truncate">{file.file_name}</h3>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{formatFileSize(file.file_size)}</span>
                  <Badge variant="outline" className="text-xs">
                    {file.mime_type.split('/')[0]}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleCopyUrl(file.url!)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy URL
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setFileToDelete(file)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa file "{file.file_name}" không? Hành động này không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setFileToDelete(null)}>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteFile} className="bg-destructive hover:bg-destructive/90">
                        Xóa
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Chưa có media nào</h3>
          <p className="text-muted-foreground mb-4">
            Upload ảnh và video đầu tiên của bạn
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Media Files</DialogTitle>
              </DialogHeader>
              <FileUploadZone
                onFilesSelected={handleFileUpload}
                accept={["image/*", "video/*"]}
                maxSize={10 * 1024 * 1024} // 10MB
                multiple
                disabled={isUploading}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;