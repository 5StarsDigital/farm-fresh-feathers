import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function CameraMonitoring() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📹</span>
          <h2 className="text-xl font-bold text-gray-800">Camera giám sát</h2>
        </div>
        <p className="text-gray-600 mb-6">Theo dõi trang trại của bạn trong thời gian thực</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Camera 1 */}
          <div className="space-y-3">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <iframe 
                width="100%" 
                height="100%" 
                src="https://rtsp.me/embed/bz78RBsB/" 
                frameBorder="0" 
                allowFullScreen
                className="absolute inset-0"
                title="Camera 1 - Khu vực chính"
              >
              </iframe>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-700">Camera 1 - Khu vực chính</h3>
            </div>
          </div>

          {/* Camera 2 */}
          <div className="space-y-3">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <iframe 
                width="100%" 
                height="100%" 
                src="https://rtsp.me/embed/QRKErRyA/" 
                frameBorder="0" 
                title="Camera 2 - Khu ăn uống" 
                allowFullScreen
                className="absolute inset-0"
              >
              </iframe>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-700">Camera 2 - Khu ăn uống</h3>
            </div>
          </div>
        </div>

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