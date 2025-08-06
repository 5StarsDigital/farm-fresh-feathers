-- Add RTSP column to service_packages table
ALTER TABLE public.service_packages 
ADD COLUMN rtsp_url TEXT DEFAULT NULL;

-- Create index for better performance
CREATE INDEX idx_service_packages_rtsp ON public.service_packages(rtsp_url) WHERE rtsp_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.service_packages.rtsp_url IS 'RTSP URL for camera monitoring of this package';