import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image, Video, File, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string[];
  maxSize?: number; // in bytes
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFilesSelected,
  accept = ['image/*', 'video/*'],
  maxSize = 50 * 1024 * 1024, // 50MB
  multiple = true,
  disabled = false,
  className
}) => {
  const [dragError, setDragError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setDragError('');
    
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles[0].errors;
      if (errors.some((e: any) => e.code === 'file-too-large')) {
        setDragError(`File quá lớn. Tối đa ${Math.round(maxSize / (1024 * 1024))}MB`);
      } else if (errors.some((e: any) => e.code === 'file-invalid-type')) {
        setDragError('Định dạng file không được hỗ trợ');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected, maxSize]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple,
    disabled
  });

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image className="w-8 h-8" />;
    if (type.includes('video')) return <Video className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  return (
    <div className={cn("w-full", className)}>
      <Card 
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed cursor-pointer transition-all duration-200 hover:border-primary/50",
          {
            "border-primary bg-primary/5": isDragActive && !isDragReject,
            "border-destructive bg-destructive/5": isDragReject || dragError,
            "opacity-50 cursor-not-allowed": disabled,
          }
        )}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              "p-4 rounded-full transition-colors",
              {
                "bg-primary/10 text-primary": isDragActive && !isDragReject,
                "bg-destructive/10 text-destructive": isDragReject || dragError,
                "bg-muted text-muted-foreground": !isDragActive && !dragError,
              }
            )}>
              <Upload className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {isDragActive 
                  ? (isDragReject ? 'File không hợp lệ' : 'Thả file vào đây') 
                  : 'Kéo thả file hoặc click để chọn'
                }
              </h3>
              
              {!dragError && (
                <p className="text-sm text-muted-foreground">
                  Hỗ trợ: {accept.join(', ')} • Tối đa {Math.round(maxSize / (1024 * 1024))}MB
                  {multiple && ' • Có thể chọn nhiều file'}
                </p>
              )}

              {dragError && (
                <p className="text-sm text-destructive font-medium">{dragError}</p>
              )}
            </div>

            <Button variant="outline" disabled={disabled}>
              <Upload className="w-4 h-4 mr-2" />
              Chọn file
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface UploadProgressListProps {
  uploads: Array<{
    file: File;
    progress: number;
    status: 'uploading' | 'success' | 'error';
  }>;
  onRemove?: (index: number) => void;
}

export const UploadProgressList: React.FC<UploadProgressListProps> = ({
  uploads,
  onRemove
}) => {
  if (uploads.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <X className="w-4 h-4 text-destructive" />;
      default:
        return <Upload className="w-4 h-4 text-primary animate-pulse" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-destructive';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className="space-y-2">
      {uploads.map((upload, index) => (
        <Card key={index} className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {upload.file.type.includes('image') && (
                <Image className="w-5 h-5 text-muted-foreground" />
              )}
              {upload.file.type.includes('video') && (
                <Video className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{upload.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(upload.file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
              {upload.status === 'uploading' && (
                <Progress 
                  value={upload.progress} 
                  className="mt-1 h-1"
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              {getStatusIcon(upload.status)}
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0"
                  onClick={() => onRemove(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};