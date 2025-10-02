import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { material, size, features, style, additional } = await req.json();

    console.log('Estimating price for:', { material, size, features, style, additional });

    const prompt = `Bạn là chuyên gia xây dựng chuồng gà. Hãy ước tính giá xây dựng chuồng gà với các thông số sau:
- Vật liệu: ${material || 'gỗ tự nhiên'}
- Kích thước: ${size || 'trung bình'}
- Tính năng: ${features || 'cơ bản'}
- Phong cách: ${style || 'truyền thống'}
${additional ? `- Yêu cầu thêm: ${additional}` : ''}

Hãy trả về ước tính giá chi tiết theo định dạng JSON với các trường sau:
{
  "estimatedPrice": số tiền tổng ước tính (VND),
  "breakdown": {
    "materials": chi phí vật liệu (VND),
    "labor": chi phí nhân công (VND),
    "features": chi phí tính năng đặc biệt (VND)
  },
  "notes": "Ghi chú về ước tính giá"
}

Lưu ý: Giá phải thực tế và phù hợp với thị trường Việt Nam năm 2025.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Bạn là chuyên gia xây dựng chuồng gà chuyên nghiệp. Trả lời bằng tiếng Việt và chỉ trả về JSON hợp lệ.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response:', content);

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback estimation
      result = {
        estimatedPrice: 5000000,
        breakdown: {
          materials: 3000000,
          labor: 1500000,
          features: 500000
        },
        notes: 'Đây là ước tính cơ bản. Vui lòng liên hệ để được tư vấn chi tiết hơn.'
      };
    }

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