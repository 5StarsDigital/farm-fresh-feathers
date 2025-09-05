import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MediaFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  thumbnail_path?: string;
  alt_text?: string;
  url?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  id?: string;
}

export const useMediaUpload = () => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const compressImage = async (file: File, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const uploadFile = async (file: File, folder = 'general'): Promise<MediaFile | null> => {
    try {
      setIsUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Bạn cần đăng nhập để upload file');
        return null;
      }

      // Compress image if it's an image
      let processedFile = file;
      if (file.type.startsWith('image/')) {
        processedFile = await compressImage(file);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${folder}/${fileName}`;

      // Add to uploads tracking
      const uploadId = Math.random().toString(36);
      setUploads(prev => [...prev, { 
        file, 
        progress: 0, 
        status: 'uploading',
        id: uploadId
      }]);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        setUploads(prev => prev.map(u => 
          u.id === uploadId ? { ...u, status: 'error' as const } : u
        ));
        toast.error(`Lỗi upload: ${uploadError.message}`);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Save to database
      const { data: mediaData, error: dbError } = await supabase
        .from('media_files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: processedFile.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if DB insert failed
        await supabase.storage.from('media').remove([filePath]);
        setUploads(prev => prev.map(u => 
          u.id === uploadId ? { ...u, status: 'error' as const } : u
        ));
        toast.error(`Lỗi lưu thông tin file: ${dbError.message}`);
        return null;
      }

      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, status: 'success' as const, progress: 100 } : u
      ));

      const result: MediaFile = {
        ...mediaData,
        url: publicUrl
      };

      toast.success(`Upload thành công: ${file.name}`);
      return result;

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Có lỗi xảy ra khi upload file');
      return null;
    } finally {
      setIsUploading(false);
      // Clear completed uploads after a delay
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.status === 'uploading'));
      }, 3000);
    }
  };

  const uploadMultipleFiles = async (files: File[], folder = 'general'): Promise<MediaFile[]> => {
    const results: MediaFile[] = [];
    
    for (const file of files) {
      const result = await uploadFile(file, folder);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  };

  const deleteFile = async (mediaFile: MediaFile): Promise<boolean> => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([mediaFile.file_path]);

      if (storageError) {
        toast.error(`Lỗi xóa file: ${storageError.message}`);
        return false;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', mediaFile.id);

      if (dbError) {
        toast.error(`Lỗi xóa thông tin file: ${dbError.message}`);
        return false;
      }

      toast.success('Đã xóa file thành công');
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Có lỗi xảy ra khi xóa file');
      return false;
    }
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    uploads,
    isUploading,
  };
};