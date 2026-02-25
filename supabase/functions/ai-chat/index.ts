import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { message, conversationId, imageUrl } = await req.json();
    console.log('Processing chat request:', { message, conversationId, hasImage: !!imageUrl });

    // Get AI settings from admin user (all users share admin's settings)
    // First, find the admin user
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (!adminRole) {
      throw new Error('No admin user found in the system.');
    }

    // Get AI settings from admin
    const { data: settings, error: settingsError } = await supabase
      .from('ai_quote_settings')
      .select('*')
      .eq('user_id', adminRole.user_id)
      .single();

    if (settingsError || !settings) {
      throw new Error('AI chưa được cấu hình. Vui lòng liên hệ admin để cấu hình AI trong phần Cài đặt.');
    }

    // Get items data for context
    const { data: items } = await supabase
      .from('items')
      .select('id, name, category, unit, price, mode, pot_type');

    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('name')
      .order('display_order');

    // Get distinct units from items
    const { data: unitsData } = await supabase
      .from('items')
      .select('unit')
      .not('unit', 'is', null);

    // Get pot pricing settings
    const { data: potSettings } = await supabase
      .from('pot_pricing_settings')
      .select('*')
      .single();

    // Build context for AI
    const itemsContext = items ? items.map(item => {
      const modeLabel = item.mode === 'standard' ? 'standard-price' : 
                       item.mode === 'auto_quantity' ? 'auto-quantity' : 
                       'formula-based';
      return `-${item.name} (${item.category}): ${item.price.toLocaleString('vi-VN')} VND/${item.unit} [${modeLabel}]${item.mode === 'customizable' ? ` PotType: ${item.pot_type}` : ''}`;
    }).join('\n') : '';

    const categoriesContext = categories ? categories.map(c => c.name).join(', ') : '';

    const existingUnits = [...new Set(unitsData?.map(item => item.unit) || [])];
    const unitsContext = existingUnits.length > 0 
      ? existingUnits.join(', ') 
      : 'cái, bao, cây';

    const potPricingContext = potSettings ? `
Pot Pricing Formula:
- Material price by thickness: 0.8cm=${potSettings.price_08cm}, 1.0cm=${potSettings.price_10cm}, 1.2cm=${potSettings.price_12cm}, 1.5cm=${potSettings.price_15cm}, 1.7cm=${potSettings.price_17cm}
- Regular pot multiplier: ${potSettings.multiplier_regular_low} (below ${potSettings.threshold_low}), ${potSettings.multiplier_regular_mid} (${potSettings.threshold_low}-${potSettings.threshold_high}), ${potSettings.multiplier_regular_high} (above ${potSettings.threshold_high})
- Curved pot multiplier: ${potSettings.multiplier_curved}
- Fence pot multiplier: ${potSettings.multiplier_fence}
- Aquarium pot multiplier: ${potSettings.multiplier_aquarium}
- Baki pot multiplier: ${potSettings.multiplier_baki}
- Landscape pot multiplier: ${potSettings.multiplier_landscape}
- Fiberglass price: ${potSettings.multiplier_fiberglass} VND/m3
- Min charge: ${potSettings.min_charge}
- Rounding: ${potSettings.rounding_mode}
` : '';

    // Build dynamic context sections
    const contextSections = {
      itemsLibrary: itemsContext || 'No items in library',
      categories: categoriesContext || 'No categories',
      units: unitsContext,
      potPricing: potPricingContext
    };

    // Use system prompt from settings with dynamic context
    let systemPrompt = settings.system_prompt || '';
    
    // Replace context placeholders in the system prompt
    systemPrompt = systemPrompt
      .replace('{ITEMS_LIBRARY}', contextSections.itemsLibrary)
      .replace('{CATEGORIES}', contextSections.categories)
      .replace('{UNITS}', contextSections.units)
      .replace('{POT_PRICING}', contextSections.potPricing);

    // Enforce inclusion of customer info when present in user input
    // This ensures all users (sharing admin prompt) return a 'customer' object consistently
    systemPrompt += `

QUAN TRỌNG - THÔNG TIN KHÁCH HÀNG:
- Khi người dùng cung cấp TÊN / SỐ ĐIỆN THOẠI / ĐỊA CHỈ, LUÔN bao gồm object "customer" trong JSON:
  { "name": string | null, "phone": string | null, "address": string | null }
- Nếu không có thông tin cho một trường, đặt trường đó = null hoặc bỏ qua.
- Ví dụ JSON (bọc trong code block):
\n\`\`\`json
{ "action": "create_quote", "customer": { "name": "Nguyễn Văn A", "phone": "0901234567", "address": "Q1, HCM" }, "items": [ ... ] }
\`\`\`
`;

    // Save user message to history
    const newConvId = conversationId || crypto.randomUUID();
    await supabase.from('ai_chat_history').insert({
      conversation_id: newConvId,
      user_id: user.id,
      role: 'user',
      content: message,
      image_url: imageUrl,
    });

    // Get conversation history
    const { data: history } = await supabase
      .from('ai_chat_history')
      .select('role, content, image_url')
      .eq('conversation_id', newConvId)
      .order('created_at', { ascending: true });

    // Build messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map(h => {
        if (h.image_url && h.role === 'user') {
          return {
            role: h.role,
            content: [
              { type: 'text', text: h.content },
              { type: 'image_url', image_url: { url: h.image_url } }
            ]
          };
        }
        return { role: h.role, content: h.content };
      })
    ];

    let aiResponse = '';

    // Call AI based on provider
    if (settings.provider === 'openai' || settings.provider === 'openrouter' || settings.provider === 'custom') {
      const isOpenRouter = (settings.provider === 'openrouter') || (settings.api_endpoint?.includes('openrouter.ai'));
      const endpoint = settings.api_endpoint || (
        isOpenRouter
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions'
      );
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${settings.api_key}`,
        'Content-Type': 'application/json',
      };
      
      if (isOpenRouter) {
        headers['HTTP-Referer'] = 'https://lovable.dev';
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: settings.model,
          messages: messages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const providerName = isOpenRouter ? 'OpenRouter' : (settings.provider === 'openai' ? 'OpenAI' : 'Custom');
        console.error(`${providerName} API error:`, response.status, errorText);
        throw new Error(`${providerName} API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      aiResponse = data.choices?.[0]?.message?.content || data.choices?.[0]?.delta?.content || '';

    } else if (settings.provider === 'google') {
      const endpoint = settings.api_endpoint || 
        `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent`;
      
      // Convert messages to Gemini format
      const geminiContents = messages.slice(1).map(msg => {
        if (Array.isArray(msg.content)) {
          const parts = msg.content.map(c => {
            if (c.type === 'text') return { text: c.text };
            if (c.type === 'image_url') {
              // Extract base64 from data URL
              const base64Match = c.image_url.url.match(/^data:image\/(.*?);base64,(.*)$/);
              if (base64Match) {
                return {
                  inline_data: {
                    mime_type: `image/${base64Match[1]}`,
                    data: base64Match[2]
                  }
                };
              }
            }
            return null;
          }).filter(Boolean);
          
          return {
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: parts
          };
        }
        
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        };
      });

      const response = await fetch(`${endpoint}?key=${settings.api_key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiContents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      aiResponse = data.candidates[0].content.parts[0].text;

    } else if (settings.provider === 'anthropic') {
      const endpoint = settings.api_endpoint || 'https://api.anthropic.com/v1/messages';
      
      // Convert messages to Anthropic format (system is separate)
      const systemMessage = messages.find(m => m.role === 'system');
      const userMessages = messages.filter(m => m.role !== 'system');
      
      const anthropicMessages = userMessages.map(msg => {
        if (Array.isArray(msg.content)) {
          const content = msg.content.map(c => {
            if (c.type === 'text') return { type: 'text', text: c.text };
            if (c.type === 'image_url') {
              // Extract base64 from data URL
              const base64Match = c.image_url.url.match(/^data:image\/(.*?);base64,(.*)$/);
              if (base64Match) {
                return {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: `image/${base64Match[1]}`,
                    data: base64Match[2]
                  }
                };
              }
            }
            return null;
          }).filter(Boolean);
          
          return {
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: content
          };
        }
        
        return {
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        };
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': settings.api_key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.model,
          max_tokens: 4096,
          system: systemMessage?.content || systemPrompt,
          messages: anthropicMessages,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Anthropic API error:', response.status, errorText);
        throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      aiResponse = data.content[0].text;

    } else {
      throw new Error(`Unsupported provider: ${settings.provider}`);
    }

    // Save AI response to history
    await supabase.from('ai_chat_history').insert({
      conversation_id: newConvId,
      user_id: user.id,
      role: 'assistant',
      content: aiResponse,
    });

    console.log('Chat processed successfully');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        conversationId: newConvId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
