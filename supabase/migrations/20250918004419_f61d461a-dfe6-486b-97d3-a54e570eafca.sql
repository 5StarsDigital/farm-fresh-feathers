-- Thêm trường giá cho gà trống và gà mái vào bảng chicken_types
ALTER TABLE public.chicken_types 
ADD COLUMN rooster_price numeric DEFAULT 0,
ADD COLUMN hen_price numeric DEFAULT 0;

-- Cập nhật dữ liệu hiện tại: sao chép giá hiện tại vào cả 2 trường mới
UPDATE public.chicken_types 
SET rooster_price = price, hen_price = price;

-- Đặt NOT NULL constraint sau khi đã có dữ liệu
ALTER TABLE public.chicken_types 
ALTER COLUMN rooster_price SET NOT NULL,
ALTER COLUMN hen_price SET NOT NULL;