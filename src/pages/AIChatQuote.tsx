import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Image as ImageIcon, Settings, Loader2, MessageSquare, Trash2, FileText } from "lucide-react";
import AISettingsDialog from "@/components/AISettingsDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { calculatePotUnitPrice, POT_TYPE_LABELS, type PotType, type PotPricingSettings, DEFAULT_POT_PRICING_SETTINGS } from "@/lib/potPricingUtils";
import QuoteResultCard from "@/components/QuoteResultCard";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  calculatedItems?: CalculatedItem[];
  customerInfo?: CustomerInfo;
  pendingItem?: PendingItemData;
}

interface PendingItemData {
  name: string;
  price: number;
  unit: string;
  category: string;
  mode: string;
  pot_type?: string;
  newCategory?: string;
  newUnit?: string;
}

interface ParsedItem {
  name: string;
  quantity: number;
  unitPrice?: number | null;
  length?: number;
  width?: number;
  height?: number;
  thickness?: number;
  layers?: number;
  color?: string;
  potType?: PotType;
}

interface CustomerInfo {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface CalculatedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  length?: number;
  width?: number;
  height?: number;
  thickness?: number;
  layers?: number;
  color?: string;
  potType?: PotType;
  breakdown?: string;
}

const AIChatQuote = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [potSettings, setPotSettings] = useState<PotPricingSettings>(DEFAULT_POT_PRICING_SETTINGS);
  const [itemsMap, setItemsMap] = useState<Record<string, { price: number; unit: string; mode: string; pot_type?: string }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? "instant" : "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    (async () => {
      await loadPotSettings();
      const map = await loadItemsLibrary();
      await loadConversation(map);
    })();
  }, []);

  const loadPotSettings = async () => {
    try {
      const { data } = await supabase
        .from('pot_pricing_settings')
        .select('*')
        .maybeSingle();
      
      if (data) {
        setPotSettings(data as PotPricingSettings);
      }
    } catch (error) {
      console.error('Error loading pot settings:', error);
    }
  };

  const loadItemsLibrary = async () => {
    try {
      const { data } = await supabase
        .from('items')
        .select('name, price, unit, mode, pot_type');
      const map: Record<string, { price: number; unit: string; mode: string; pot_type?: string }> = {};
      (data || []).forEach((i: any) => {
        map[String(i.name).trim().toLowerCase()] = {
          price: i.price,
          unit: i.unit,
          mode: i.mode,
          pot_type: i.pot_type,
        };
      });
      setItemsMap(map);
      return map;
    } catch (error) {
      console.error('Error loading items library:', error);
      return {};
    }
  };

  const loadConversation = async (loadedItemsMap: Record<string, { price: number; unit: string; mode: string; pot_type?: string }>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const latestConvId = (data[0] as any).conversation_id;
        setConversationId(latestConvId);

        const { data: history, error: historyError } = await (supabase as any)
          .from('ai_chat_history')
          .select('*')
          .eq('conversation_id', latestConvId)
          .order('created_at', { ascending: true });

        if (historyError) throw historyError;

        if (history) {
          setMessages(history.map((h: any) => {
            const message: Message = {
              role: h.role as 'user' | 'assistant',
              content: h.content,
              imageUrl: h.image_url || undefined,
            };

            // For assistant messages, parse JSON if present to reconstruct display
            if (h.role === 'assistant') {
              try {
                const jsonMatch = h.content.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[1]);
                  
                  // Reconstruct displayContent based on action
                  if (parsed.action === 'create_quote' || (parsed.items && Array.isArray(parsed.items))) {
                    let displayContent = h.content.replace(/```json[\s\S]*?```/g, '').trim();
                    
                    // Extract customer info if present
                    if (parsed.customer && (parsed.customer.name || parsed.customer.phone || parsed.customer.address)) {
                      message.customerInfo = parsed.customer;
                    }
                    
                    // Calculate items with pricing
                    if (parsed.items && Array.isArray(parsed.items)) {
                      const calculatedItems = parsed.items.map((item: ParsedItem) => {
                        // Prefer library mode/price when available
                        const lib = loadedItemsMap[(item.name || '').trim().toLowerCase()];
                        const libMode = lib?.mode;

                        if (item.unitPrice === null || item.unitPrice === undefined) {
                          // If library says this is NOT customizable, use library price and ignore pot fields
                          if (lib && libMode !== 'customizable') {
                            const effectiveUnit = lib?.price ?? 0;
                            return {
                              ...item,
                              unitPrice: effectiveUnit,
                              totalPrice: effectiveUnit * item.quantity,
                              breakdown: undefined,
                              length: undefined,
                              width: undefined,
                              height: undefined,
                              thickness: undefined,
                              layers: undefined,
                              potType: undefined,
                            };
                          }

                          // Otherwise treat as customizable and compute using pot formula
                          const { unitPrice, breakdown } = calculatePotUnitPrice(
                            (item.potType as PotType) || (lib?.pot_type as PotType) || 'regular',
                            item.length || 0,
                            item.width || 0,
                            item.height || 0,
                            item.thickness || 8,
                            potSettings,
                            item.layers || 1
                          );
                          return {
                            ...item,
                            unitPrice,
                            totalPrice: unitPrice * item.quantity,
                            breakdown,
                          };
                        } else {
                          // For standard/auto_quantity: always take price from library if available
                          const effectiveUnit = lib?.price ?? item.unitPrice ?? 0;
                          return {
                            ...item,
                            unitPrice: effectiveUnit,
                            totalPrice: effectiveUnit * item.quantity,
                            breakdown: undefined,
                            length: undefined,
                            width: undefined,
                            height: undefined,
                            thickness: undefined,
                            layers: undefined,
                            potType: undefined,
                          };
                        }
                      });
                      
                      message.calculatedItems = calculatedItems;
                      
                      // Reconstruct display content
                      displayContent = "";
                      
                      if (message.customerInfo) {
                        displayContent += "👤 **THÔNG TIN KHÁCH HÀNG:**\n";
                        if (message.customerInfo.name) displayContent += `Tên: ${message.customerInfo.name}\n`;
                        if (message.customerInfo.phone) displayContent += `SĐT: ${message.customerInfo.phone}\n`;
                        if (message.customerInfo.address) displayContent += `Địa chỉ: ${message.customerInfo.address}\n`;
                        displayContent += "\n";
                      }
                      
                      displayContent += "✅ **Đã tính toán giá cho các hạng mục:**\n\n";
                      calculatedItems.forEach((item, idx) => {
                        displayContent += `**${idx + 1}. ${item.name}**`;
                        if (item.potType) {
                          displayContent += ` (${POT_TYPE_LABELS[item.potType]})`;
                        }
                        displayContent += `\n`;
                        
                        if (item.length && item.width && item.height) {
                          displayContent += `📏 Kích thước: ${item.length}×${item.width}×${item.height}cm`;
                          if (item.thickness) {
                            displayContent += `, dày ${item.thickness}mm`;
                          }
                          displayContent += `\n`;
                        }
                        
                        if (item.layers && item.layers > 1) {
                          displayContent += `🏗️ Số tầng: ${item.layers}\n`;
                        }
                        
                        displayContent += `💰 Đơn giá: ${formatCurrency(item.unitPrice)}\n`;
                        
                        if (item.breakdown) {
                          displayContent += `📊 Chi tiết: ${item.breakdown}\n`;
                        }
                        
                        displayContent += `🔢 Số lượng: ${item.quantity} → **Tổng: ${formatCurrency(item.totalPrice)}**\n\n`;
                      });
                      
                      const grandTotal = calculatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
                      displayContent += `\n💵 **Tổng cộng: ${formatCurrency(grandTotal)}**`;
                    }
                    
                    message.content = displayContent;
                  } else if (parsed.action === 'create_item' && parsed.newItem) {
                    // Handle pending item creation
                    if (parsed.newItem.name && parsed.newItem.price && parsed.newItem.unit && parsed.newItem.category && parsed.newItem.mode) {
                      message.pendingItem = {
                        name: parsed.newItem.name,
                        price: parsed.newItem.price,
                        unit: parsed.newItem.unit,
                        category: parsed.newItem.category,
                        mode: parsed.newItem.mode,
                        pot_type: parsed.newItem.pot_type,
                        newCategory: parsed.newCategory,
                        newUnit: parsed.newUnit
                      };
                    }
                    // Keep original content with JSON removed
                    message.content = h.content.replace(/```json[\s\S]*?```/g, '').trim();
                  } else {
                    // Unknown action, just remove JSON blocks
                    message.content = h.content.replace(/```json[\s\S]*?```/g, '').trim();
                  }
                }
              } catch (e) {
                // Not JSON or parsing failed, keep original
                console.log('Could not parse JSON from history message');
              }
            }
            
            return message;
          }));
          
          // Scroll to bottom instantly after loading history
          setTimeout(() => scrollToBottom(true), 100);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn file ảnh",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setImageFile(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
          
          toast({
            title: "Đã dán ảnh",
            description: "Ảnh đã được thêm vào tin nhắn",
          });
        }
        break;
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !imageFile) return;

    const userMessage = input.trim();
    let imageDataUrl = imagePreview;

    // Add user message immediately
    const newMessage: Message = {
      role: 'user',
      content: userMessage || "(Đã gửi ảnh)",
      imageUrl: imageDataUrl || undefined,
    };
    setMessages(prev => [...prev, newMessage]);
    setInput("");
    setImageFile(null);
    setImagePreview(null);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Vui lòng đăng nhập');
      }

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage,
          conversationId: conversationId,
          imageUrl: imageDataUrl,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setConversationId(data.conversationId);

      const assistantMessage = data.response;
      
      // Try to parse JSON response from AI
      let calculatedItems: CalculatedItem[] | undefined;
      let customerInfo: CustomerInfo | undefined;
      let pendingItem: PendingItemData | undefined;
      let displayContent = assistantMessage;
      
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : assistantMessage;
        
        const parsed = JSON.parse(jsonStr);
        
        // Handle different actions from AI
        if (parsed.action === 'create_item') {
          // AI is requesting to create a new item
          displayContent = assistantMessage;
          
          // If AI has provided complete newItem data, store it for user confirmation
          if (parsed.newItem && parsed.newItem.name && parsed.newItem.price && parsed.newItem.unit && parsed.newItem.category && parsed.newItem.mode) {
            pendingItem = {
              name: parsed.newItem.name,
              price: parsed.newItem.price,
              unit: parsed.newItem.unit,
              category: parsed.newItem.category,
              mode: parsed.newItem.mode,
              pot_type: parsed.newItem.pot_type,
              newCategory: parsed.newCategory,
              newUnit: parsed.newUnit
            };
            
            // Add confirmation prompt to display
            displayContent += "\n\n📋 **THÔNG TIN HẠNG MỤC MỚI:**\n";
            displayContent += `✏️ Tên: **${pendingItem.name}**\n`;
            displayContent += `💰 Giá: **${pendingItem.price.toLocaleString('vi-VN')} đ/${pendingItem.unit}**\n`;
            displayContent += `📂 Danh mục: **${pendingItem.newCategory || pendingItem.category}**${pendingItem.newCategory ? ' (mới)' : ''}\n`;
            displayContent += `⚙️ Chế độ: **${pendingItem.mode}**\n`;
            if (pendingItem.pot_type) {
              displayContent += `🏺 Loại chậu: **${pendingItem.pot_type}**\n`;
            }
            displayContent += "\n✅ Nhấn nút bên dưới để xác nhận tạo hạng mục này vào thư viện.";
          }
          
        } else if (parsed.action === 'create_quote') {
          // Extract customer info
          if (parsed.customer && (parsed.customer.name || parsed.customer.phone || parsed.customer.address)) {
            customerInfo = parsed.customer;
          }
          
          if (parsed.items && Array.isArray(parsed.items)) {
            calculatedItems = parsed.items.map((item: ParsedItem) => {
              // Prefer library mode/price when available
              const lib = itemsMap[(item.name || '').trim().toLowerCase()];
              const libMode = lib?.mode;

              if (item.unitPrice === null || item.unitPrice === undefined) {
                if (lib && libMode !== 'customizable') {
                  const effectiveUnit = lib?.price ?? 0;
                  return {
                    ...item,
                    unitPrice: effectiveUnit,
                    totalPrice: effectiveUnit * item.quantity,
                    breakdown: undefined,
                    length: undefined,
                    width: undefined,
                    height: undefined,
                    thickness: undefined,
                    layers: undefined,
                    potType: undefined,
                  };
                }

                const { unitPrice, breakdown } = calculatePotUnitPrice(
                  (item.potType as PotType) || (lib?.pot_type as PotType) || 'regular',
                  item.length || 0,
                  item.width || 0,
                  item.height || 0,
                  item.thickness || 8,
                  potSettings,
                  item.layers || 1
                );
                
                return {
                  ...item,
                  unitPrice,
                  totalPrice: unitPrice * item.quantity,
                  breakdown
                };
              } else {
                // For standard/auto_quantity: always take price from library if available
                const effectiveUnit = lib?.price ?? item.unitPrice ?? 0;
                return {
                  ...item,
                  unitPrice: effectiveUnit,
                  totalPrice: effectiveUnit * item.quantity,
                  breakdown: undefined,
                  length: undefined,
                  width: undefined,
                  height: undefined,
                  thickness: undefined,
                  layers: undefined,
                  potType: undefined,
                };
              }
            });
            
            // Create display content with calculations
            displayContent = "";
            
            // Add customer info if present
            if (customerInfo) {
              displayContent += "👤 **THÔNG TIN KHÁCH HÀNG:**\n";
              if (customerInfo.name) displayContent += `Tên: ${customerInfo.name}\n`;
              if (customerInfo.phone) displayContent += `SĐT: ${customerInfo.phone}\n`;
              if (customerInfo.address) displayContent += `Địa chỉ: ${customerInfo.address}\n`;
              displayContent += "\n";
            }
            
            displayContent += "✅ **Đã xác nhận các hạng mục từ thư viện:**\n\n";
            calculatedItems.forEach((item, idx) => {
              displayContent += `**${idx + 1}. ${item.name}**`;
              if (item.potType) {
                displayContent += ` (${POT_TYPE_LABELS[item.potType]})`;
              }
              displayContent += `\n`;
              
              if (item.length && item.width && item.height) {
                displayContent += `📏 Kích thước: ${item.length}×${item.width}×${item.height}cm`;
                if (item.thickness) {
                  displayContent += `, dày ${item.thickness}mm`;
                }
                displayContent += `\n`;
              }
              
              if (item.layers && item.layers > 1) {
                displayContent += `🏗️ Số tầng: ${item.layers}\n`;
              }
              
              displayContent += `💰 Đơn giá: ${formatCurrency(item.unitPrice)}\n`;
              
              if (item.breakdown) {
                displayContent += `📊 Chi tiết: ${item.breakdown}\n`;
              }
              
              displayContent += `🔢 Số lượng: ${item.quantity} → **Tổng: ${formatCurrency(item.totalPrice)}**\n\n`;
            });
            
            const grandTotal = calculatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
            displayContent += `\n💵 **Tổng cộng: ${formatCurrency(grandTotal)}**`;
          }
        } else {
          // Legacy format or no action - try to parse items
          if (parsed.customer && (parsed.customer.name || parsed.customer.phone || parsed.customer.address)) {
            customerInfo = parsed.customer;
          }
          
          if (parsed.items && Array.isArray(parsed.items)) {
            calculatedItems = parsed.items.map((item: ParsedItem) => {
              // Prefer library mode/price when available
              const lib = itemsMap[(item.name || '').trim().toLowerCase()];
              const libMode = lib?.mode;

              if (item.unitPrice === null || item.unitPrice === undefined) {
                if (lib && libMode !== 'customizable') {
                  const effectiveUnit = lib?.price ?? 0;
                  return {
                    ...item,
                    unitPrice: effectiveUnit,
                    totalPrice: effectiveUnit * item.quantity,
                    breakdown: undefined,
                    length: undefined,
                    width: undefined,
                    height: undefined,
                    thickness: undefined,
                    layers: undefined,
                    potType: undefined,
                  };
                }

                const { unitPrice, breakdown } = calculatePotUnitPrice(
                  (item.potType as PotType) || (lib?.pot_type as PotType) || 'regular',
                  item.length || 0,
                  item.width || 0,
                  item.height || 0,
                  item.thickness || 8,
                  potSettings,
                  item.layers || 1
                );
                
                return {
                  ...item,
                  unitPrice,
                  totalPrice: unitPrice * item.quantity,
                  breakdown
                };
              } else {
                // For standard/auto_quantity: always take price from library if available
                const effectiveUnit = lib?.price ?? item.unitPrice ?? 0;
                return {
                  ...item,
                  unitPrice: effectiveUnit,
                  totalPrice: effectiveUnit * item.quantity,
                  breakdown: undefined,
                  length: undefined,
                  width: undefined,
                  height: undefined,
                  thickness: undefined,
                  layers: undefined,
                  potType: undefined,
                };
              }
            });
            
            // Create display content with calculations
            displayContent = "";
            
            // Add customer info if present
            if (customerInfo) {
              displayContent += "👤 **THÔNG TIN KHÁCH HÀNG:**\n";
              if (customerInfo.name) displayContent += `Tên: ${customerInfo.name}\n`;
              if (customerInfo.phone) displayContent += `SĐT: ${customerInfo.phone}\n`;
              if (customerInfo.address) displayContent += `Địa chỉ: ${customerInfo.address}\n`;
              displayContent += "\n";
            }
            
            displayContent += "✅ **Đã tính toán giá cho các hạng mục:**\n\n";
            calculatedItems.forEach((item, idx) => {
              displayContent += `**${idx + 1}. ${item.name}**`;
              if (item.potType) {
                displayContent += ` (${POT_TYPE_LABELS[item.potType]})`;
              }
              displayContent += `\n`;
              
              if (item.length && item.width && item.height) {
                displayContent += `📏 Kích thước: ${item.length}×${item.width}×${item.height}cm`;
                if (item.thickness) {
                  displayContent += `, dày ${item.thickness}mm`;
                }
                displayContent += `\n`;
              }
              
              if (item.layers && item.layers > 1) {
                displayContent += `🏗️ Số tầng: ${item.layers}\n`;
              }
              
              displayContent += `💰 Đơn giá: ${formatCurrency(item.unitPrice)}\n`;
              
              if (item.breakdown) {
                displayContent += `📊 Chi tiết: ${item.breakdown}\n`;
              }
              
              displayContent += `🔢 Số lượng: ${item.quantity} → **Tổng: ${formatCurrency(item.totalPrice)}**\n\n`;
            });
            
            const grandTotal = calculatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
            displayContent += `\n💵 **Tổng cộng: ${formatCurrency(grandTotal)}**`;
          }
        }
      } catch (e) {
        // Not JSON or parsing failed, use original message
        console.log('Not a JSON response, displaying as-is');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: displayContent,
        calculatedItems,
        customerInfo,
        pendingItem
      }]);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi tin nhắn. Vui lòng kiểm tra cấu hình AI.",
        variant: "destructive",
      });
      // Remove the user message if failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      // Delete conversation from database if exists
      if (conversationId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await (supabase as any)
            .from('ai_chat_history')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', user.id);
          
          if (error) {
            console.error('Error deleting conversation:', error);
            toast({
              title: "Lỗi",
              description: "Không thể xóa hội thoại",
              variant: "destructive",
            });
            return;
          }
          
          toast({
            title: "Đã xóa",
            description: "Hội thoại đã được xóa khỏi lịch sử",
          });
        }
      }
      
      // Clear local state
      setMessages([]);
      setConversationId(null);
      setInput("");
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error in handleNewChat:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa hội thoại",
        variant: "destructive",
      });
    }
  };

  const formatMessage = (content: string) => {
    // Remove JSON code blocks - chỉ hiển thị văn bản tự nhiên
    let displayContent = content.replace(/```json[\s\S]*?```/g, '').trim();
    
    // Simple markdown-like formatting
    return displayContent
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold mt-3 mb-2">{line.slice(3)}</h2>;
        }
        // Bold
        if (line.includes('**')) {
          const parts = line.split('**');
          return (
            <p key={i} className="mb-1">
              {parts.map((part, j) => 
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
              )}
            </p>
          );
        }
        // Regular line
        if (line.trim()) {
          return <p key={i} className="mb-1 whitespace-pre-wrap">{line}</p>;
        }
        return <br key={i} />;
      });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleCreateQuote = (msg: Message) => {
    if (!msg.calculatedItems || msg.calculatedItems.length === 0) return;
    
    // Store both customer info and items in localStorage
    const quoteData = {
      customer: msg.customerInfo || null,
      items: msg.calculatedItems.map(item => ({
        name: item.name,
        potType: item.potType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        length: item.length,
        width: item.width,
        height: item.height,
        thickness: item.thickness,
        layers: item.layers || 1,
        color: item.color || null
      }))
    };
    
    localStorage.setItem('ai_quote_data', JSON.stringify(quoteData));
    toast({
      title: "Đã lưu",
      description: "Chuyển đến trang tạo báo giá...",
    });
    navigate('/create-quote?from=ai');
  };

  const handleCreateItem = async (itemData: PendingItemData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Lỗi",
          description: "Vui lòng đăng nhập",
          variant: "destructive",
        });
        return;
      }

      // Check if need to create new category first
      if (itemData.newCategory) {
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('name')
          .eq('name', itemData.newCategory)
          .maybeSingle();

        if (!existingCategory) {
          const { error: categoryError } = await supabase
            .from('categories')
            .insert({ name: itemData.newCategory });

          if (categoryError) {
            toast({
              title: "Lỗi tạo danh mục",
              description: categoryError.message,
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Create new item
      const newItemData: any = {
        name: itemData.name,
        price: itemData.price,
        unit: itemData.unit,
        category: itemData.newCategory || itemData.category,
        mode: itemData.mode,
        user_id: user.id,
      };

      if (itemData.pot_type) {
        newItemData.pot_type = itemData.pot_type;
      }

      const { data: createdItem, error: itemError } = await supabase
        .from('items')
        .insert(newItemData)
        .select()
        .single();

      if (itemError) {
        toast({
          title: "Lỗi tạo hạng mục",
          description: itemError.message,
          variant: "destructive",
        });
        return;
      }

      // Prepare success message info
      const unitInfo = itemData.newUnit 
        ? `đơn vị mới **${itemData.newUnit}**` 
        : `đơn vị **${itemData.unit}**`;
      
      const categoryInfo = itemData.newCategory 
        ? `danh mục mới **${itemData.newCategory}**` 
        : `danh mục **${itemData.category}**`;

      toast({
        title: "✅ Đã tạo hạng mục mới",
        description: `${itemData.name} đã được thêm vào thư viện`,
      });

      // Add success message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ Đã tạo thành công hạng mục **${itemData.name}** vào thư viện!\n\n📂 Danh mục: ${categoryInfo}\n📏 Đơn vị: ${unitInfo}\n💰 Giá: ${itemData.price.toLocaleString('vi-VN')} đ/${itemData.unit}\n\nBạn có thể tiếp tục chat để tạo báo giá hoặc thêm hạng mục khác.`
      }]);

    } catch (error: any) {
      console.error('Error creating item:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo hạng mục",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="w-8 h-8" />
              Chat AI Báo Giá
            </h1>
            <div className="max-w-[270px] sm:max-w-none">
              <p className="text-muted-foreground mt-1">
                Hỏi báo giá, gửi ảnh, AI sẽ tính toán chi tiết cho bạn
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleNewChat}
              title="Chat mới"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                title="Cấu hình AI"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
         <Card className="flex flex-col h-[calc(100vh-240px)] overflow-hidden">
         {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Bắt đầu chat với AI để nhận báo giá</p>
                <p className="text-sm mt-2">Bạn có thể gửi text hoặc ảnh chụp yêu cầu</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded"
                      className="max-w-full rounded mb-2 max-h-64 object-contain"
                    />
                  )}
                  
                  {/* Show QuoteResultCard for calculated items */}
                  {msg.role === 'assistant' && msg.calculatedItems && msg.calculatedItems.length > 0 ? (
                    <div className="space-y-4">
                      {/* Show any text content before the quote */}
                      {msg.content && !msg.content.includes('✅') && (
                        <div className="text-sm mb-4">
                          {formatMessage(msg.content)}
                        </div>
                      )}
                      
                      <QuoteResultCard 
                        items={msg.calculatedItems}
                        customerInfo={msg.customerInfo}
                      />
                      
                      <Button
                        onClick={() => handleCreateQuote(msg)}
                        className="w-full"
                        variant="default"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Tạo báo giá từ kết quả này
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className={msg.role === 'assistant' ? 'text-sm' : ''}>
                        {msg.role === 'assistant' ? formatMessage(msg.content) : msg.content}
                      </div>
                      
                      {msg.role === 'assistant' && msg.pendingItem && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <Button
                            onClick={() => handleCreateItem(msg.pendingItem!)}
                            className="w-full bg-green-600 hover:bg-green-700"
                            variant="default"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            ✅ Tạo hạng mục mới vào thư viện
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">AI đang trả lời</span>
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 rounded border"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  ×
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                placeholder="Nhập yêu cầu báo giá của bạn hoặc dán ảnh (Ctrl+V)..."
                className="resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={loading}
              />
              
              <Button
                onClick={handleSend}
                disabled={loading || (!input.trim() && !imageFile)}
                size="icon"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <AISettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default AIChatQuote;
