import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ServicePackage {
  id: string;
  package_name: string;
  rtsp_url: string | null;
  status: string;
  coop_name: string;
}

export default function CameraMonitoring() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserPackages();
    }
  }, [user]);

  const fetchUserPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('service_packages')
        .select('id, package_name, rtsp_url, status, coop_name')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="h-6 w-6" />
          <h2 className="text-xl font-bold text-gray-800">Camera giám sát</h2>
        </div>
        <p className="text-gray-600 mb-6">Theo dõi trang trại của bạn trong thời gian thực</p>
        
        {packages.length === 0 ? (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Chưa có camera nào được cấu hình</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="space-y-3">
                <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  {pkg.rtsp_url ? (
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={pkg.rtsp_url} 
                      frameBorder="0" 
                      allowFullScreen
                      className="absolute inset-0"
                      title={`Camera ${pkg.package_name}`}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <div className="text-center">
                        <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Chưa cấu hình camera</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-700">{pkg.package_name}</h3>
                    <p className="text-sm text-gray-500">{pkg.coop_name}</p>
                  </div>
                  <Badge variant={pkg.rtsp_url ? "default" : "secondary"}>
                    {pkg.rtsp_url ? "Hoạt động" : "Chưa setup"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-2">Tính năng camera:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Theo dõi hoạt động của gà 24/7</li>
            <li>• Cảnh báo khi có bất thường</li>
            <li>• Ghi lại các khoảnh khắc quan trọng</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}