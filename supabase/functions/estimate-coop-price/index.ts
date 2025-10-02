import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Price factors based on specifications
const materialPrices: Record<string, number> = {
  'gỗ tự nhiên': 1.0,
  'gỗ composite': 1.3,
  'kim loại': 1.5,
  'nhựa': 0.8,
  'tre': 0.7
};

const sizePrices: Record<string, number> = {
  'nhỏ': 3000000,
  'trung bình': 5000000,
  'lớn': 8000000,
  'rất lớn': 12000000
};

const featurePrices: Record<string, number> = {
  'cơ bản': 0,
  'tự động cho ăn': 1500000,
  'tự động uống nước': 800000,
  'điều hòa nhiệt độ': 3000000,
  'camera giám sát': 2000000,
  'năng lượng mặt trời': 5000000
};

const stylePrices: Record<string, number> = {
  'truyền thống': 0,
  'hiện đại': 1000000,
  'rustic': 500000,
  'minimalist': 800000,
  'industrial': 1200000
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { material, size, features, style, additional } = await req.json();

    console.log('Estimating price for:', { material, size, features, style, additional });

    // Calculate base price
    const basePrice = sizePrices[size] || sizePrices['trung bình'];
    
    // Apply material multiplier
    const materialMultiplier = materialPrices[material] || 1.0;
    const materialsPrice = Math.round(basePrice * materialMultiplier * 0.6);
    
    // Calculate labor cost (40% of materials)
    const laborPrice = Math.round(materialsPrice * 0.67);
    
    // Add feature cost
    const featuresPrice = featurePrices[features] || 0;
    
    // Add style premium
    const stylePremium = stylePrices[style] || 0;
    
    // Additional requirements add 10-20%
    const additionalCost = additional ? Math.round(basePrice * 0.15) : 0;
    
    // Calculate totals
    const totalMaterialsCost = materialsPrice + stylePremium;
    const totalPrice = totalMaterialsCost + laborPrice + featuresPrice + additionalCost;

    const result = {
      estimatedPrice: totalPrice,
      breakdown: {
        materials: totalMaterialsCost,
        labor: laborPrice,
        features: featuresPrice + additionalCost
      },
      notes: `Ước tính dựa trên ${material || 'gỗ tự nhiên'}, kích thước ${size || 'trung bình'} với ${features || 'tính năng cơ bản'}. Giá chưa bao gồm VAT và phí vận chuyển. Liên hệ để được báo giá chính xác.`
    };

    console.log('Estimated price:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in estimate-coop-price:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        estimatedPrice: 5000000,
        breakdown: {
          materials: 3000000,
          labor: 1500000,
          features: 500000
        },
        notes: 'Không thể ước tính chính xác. Đây là giá tham khảo cơ bản.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});