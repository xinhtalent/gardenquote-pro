import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, FileText, ArrowLeft, CalendarIcon, ChevronLeft, ChevronRight, GripVertical, Search } from "lucide-react";
import { QuoteItemModeInputs } from "@/components/QuoteItemModeInputs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { quoteKeys } from "@/hooks/useQuotes";
import { dashboardKeys } from "@/hooks/useDashboard";
import { customerKeys } from "@/hooks/useCustomers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface QuoteItem {
  id: number;
  itemId: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  category?: string;
  order?: number;
  mode?: 'standard' | 'auto_quantity' | 'customizable';
  dimension_1?: number | null;
  dimension_2?: number | null;
  variant_length?: number | null;
  variant_width?: number | null;
  variant_height?: number | null;
  variant_thickness?: number | null;
  variant_color?: string | null;
  variant_layers?: number | null;
  pot_type?: string | null;
}

interface AvailableItem {
  id: string;
  name: string;
  unit: string;
  price: number;
  category: string;
  image_url: string | null;
  mode?: 'standard' | 'auto_quantity' | 'customizable';
  pot_type?: string | null;
}

interface SortableItemProps {
  item: QuoteItem;
  quantityDisplays: {[key: number]: string};
  updateQuantity: (id: number, value: string) => void;
  removeItem: (id: number) => void;
  formatCurrency: (amount: number) => string;
  updateItemDimensions: (id: number, dim1: number | null, dim2: number | null) => void;
  updateItemVariants: (id: number, variants: any) => void;
  updateItemPrice: (id: number, price: number) => void;
}

const SortableItem = ({ item, quantityDisplays, updateQuantity, removeItem, formatCurrency, updateItemDimensions, updateItemVariants, updateItemPrice }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const mode = item.mode || 'standard';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-3 p-4 border border-border rounded-lg bg-background"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-accent rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
            {mode === 'customizable' ? (
              <p className="text-sm text-muted-foreground">
                Đơn giá: {formatCurrency(item.price)}/{item.unit}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {formatCurrency(item.price)}/{item.unit}
              </p>
            )}
          </div>
        </div>
        {mode === 'standard' && (
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-2">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                inputMode="decimal"
                value={quantityDisplays[item.id] !== undefined 
                  ? quantityDisplays[item.id] 
                  : (item.quantity === 0 ? "" : item.quantity)}
                onChange={(e) => updateQuantity(item.id, e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {item.unit}
              </span>
            </div>
            <div className="font-bold text-primary whitespace-nowrap">
              {formatCurrency(item.quantity * item.price)}
            </div>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={() => removeItem(item.id)}
              className="shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
        {mode !== 'standard' && (
          <div className="flex items-center gap-2">
            <div className="font-bold text-primary whitespace-nowrap">
              {formatCurrency(item.quantity * item.price)}
            </div>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={() => removeItem(item.id)}
              className="shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      {mode !== 'standard' && (
        <QuoteItemModeInputs
          mode={mode}
          quantity={item.quantity}
          onQuantityChange={(qty) => updateQuantity(item.id, String(qty))}
          dimensions={{
            dimension_1: item.dimension_1 || null,
            dimension_2: item.dimension_2 || null,
          }}
          onDimensionsChange={(dim1, dim2) => updateItemDimensions(item.id, dim1, dim2)}
          variants={{
            length: item.variant_length || null,
            width: item.variant_width || null,
            height: item.variant_height || null,
            thickness: item.variant_thickness || null,
            color: item.variant_color || null,
            layers: item.variant_layers || null,
          }}
          potType={(item as any).pot_type || null}
          onUnitPriceChange={(price) => updateItemPrice(item.id, price)}
          onVariantsChange={(variants) => updateItemVariants(item.id, variants)}
        />
      )}
    </div>
  );
};

interface SortableCategoryProps {
  category: string;
  categoryItems: QuoteItem[];
  quantityDisplays: {[key: number]: string};
  updateQuantity: (id: number, value: string) => void;
  removeItem: (id: number) => void;
  formatCurrency: (amount: number) => string;
  onItemsReorder: (newItems: QuoteItem[]) => void;
  updateItemDimensions: (id: number, dim1: number | null, dim2: number | null) => void;
  updateItemVariants: (id: number, variants: any) => void;
  updateItemPrice: (id: number, price: number) => void;
}

const SortableCategory = ({ 
  category, 
  categoryItems, 
  quantityDisplays, 
  updateQuantity, 
  removeItem, 
  formatCurrency,
  onItemsReorder,
  updateItemDimensions,
  updateItemVariants,
  updateItemPrice 
}: SortableCategoryProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `category-${category}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categoryItems.findIndex(item => item.id === active.id);
      const newIndex = categoryItems.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(categoryItems, oldIndex, newIndex);
        onItemsReorder(newItems);
      }
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-accent rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </button>
        <h3 className="text-lg font-semibold text-primary flex-1 pb-2 border-b border-primary/20">
          {category}
        </h3>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categoryItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {categoryItems.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                quantityDisplays={quantityDisplays}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
                formatCurrency={formatCurrency}
                updateItemDimensions={updateItemDimensions}
                updateItemVariants={updateItemVariants}
                updateItemPrice={updateItemPrice}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

const CreateQuote = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editQuoteId = searchParams.get('edit');
  const duplicateQuoteId = searchParams.get('duplicate');
  const isEditMode = !!editQuoteId;
  const isDuplicateMode = !!duplicateQuoteId;
  const { isAdmin, loading: roleLoading } = useUserRole();
  
  // Generate quote ID: XINH-DDMMYY-ZXX based on selected date
  const generateQuoteId = async (userId: string, userSeqNum: number, selectedDate: Date) => {
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const year = String(selectedDate.getFullYear()).slice(-2);
    const dateStr = `${day}${month}${year}`;
    
    // User sequence prefix (no leading zero if < 10)
    const userPrefix = userSeqNum.toString();
    
    // Get existing quotes for this user on this date to determine daily sequence
    const dateYear = selectedDate.getFullYear();
    const dateMonth = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dateDay = String(selectedDate.getDate()).padStart(2, '0');
    const fullDateStr = `${dateYear}-${dateMonth}-${dateDay}`;
    
    const { data: existingQuotes } = await supabase
      .from('quotes')
      .select('quote_code')
      .eq('user_id', userId)
      .eq('date', fullDateStr);
    
    // Find max daily sequence for this user on this date
    let maxSeq = 0;
    if (existingQuotes && existingQuotes.length > 0) {
      const pattern = new RegExp(`^${quotePrefix}-${dateStr}-${userPrefix}(\\d{2})$`);
      existingQuotes.forEach(quote => {
        const match = quote.quote_code.match(pattern);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) maxSeq = seq;
        }
      });
    }
    
    const newSeq = maxSeq + 1;
    const seqStr = String(newSeq).padStart(2, '0');
    
    return `${quotePrefix}-${dateStr}-${userPrefix}${seqStr}`;
  };
  
  const [quoteDate, setQuoteDate] = useState<Date>(new Date());
  const [quoteId, setQuoteId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorPhone, setCreatorPhone] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [quantityDisplays, setQuantityDisplays] = useState<{[key: number]: string}>({});
  const [discount, setDiscount] = useState("");
  const [vat, setVat] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quoteOwnerId, setQuoteOwnerId] = useState<string | null>(null);
  const [userSeqNumber, setUserSeqNumber] = useState<number>(1);
  const [quotePrefix, setQuotePrefix] = useState<string>("XINH");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isMobile = useIsMobile();
  const ITEMS_PER_PAGE = 6;
  const selectedItemsRef = useRef<HTMLDivElement>(null);

  // Generate quote ID when date changes
  useEffect(() => {
    const generateCode = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isEditMode && quoteDate && user && userSeqNumber && quotePrefix) {
        const code = await generateQuoteId(user.id, userSeqNumber, quoteDate);
        setQuoteId(code);
      }
    };
    generateCode();
  }, [quoteDate, isEditMode, userSeqNumber, quotePrefix]);

  // Fetch global settings for quote prefix
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      const { data } = await supabase
        .from('global_settings')
        .select('quote_code_format')
        .maybeSingle();
      
      if (data?.quote_code_format) {
        // Extract prefix from format (e.g., "XINH-DDMMYY-###" -> "XINH")
        const prefix = data.quote_code_format.split('-')[0] || "XINH";
        setQuotePrefix(prefix);
      }
    };
    fetchGlobalSettings();
  }, []);

  useEffect(() => {
    if (!roleLoading) {
      fetchData();
      fetchCategories();
    }
  }, [editQuoteId, duplicateQuoteId, isAdmin, roleLoading]);

  // Load AI items after availableItems are fetched
  useEffect(() => {
    if (availableItems.length > 0) {
      loadAIQuoteItems();
    }
  }, [availableItems]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      const categoryNames = data?.map(c => c.name) || [];
      setCategories(categoryNames);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const loadAIQuoteItems = async () => {
    // Only load if coming from AI chat
    const fromAI = searchParams.get('from') === 'ai';
    if (!fromAI || isEditMode || isDuplicateMode) return;

    const storedData = localStorage.getItem('ai_quote_data');
    if (!storedData) return;

    try {
      const aiData = JSON.parse(storedData);
      localStorage.removeItem('ai_quote_data'); // Clear after loading

      // Handle customer info - pre-fill the form fields
      if (aiData.customer) {
        const customer = aiData.customer;
        if (customer.name) setCustomerName(customer.name);
        if (customer.phone) setCustomerPhone(customer.phone);
        if (customer.address) setCustomerAddress(customer.address);
        
        if (customer.name || customer.phone || customer.address) {
          toast.success("Đã điền thông tin khách hàng từ AI Chat");
        }
      }

      // Helper function to find matching item in library
      const findMatchingItem = (aiItemName: string) => {
        const normalizedAIName = aiItemName.toLowerCase().trim();
        
        // Try exact match first
        let match = availableItems.find(item => 
          item.name.toLowerCase().trim() === normalizedAIName
        );
        
        // If no exact match, try partial match
        if (!match) {
          match = availableItems.find(item => {
            const itemName = item.name.toLowerCase().trim();
            return itemName.includes(normalizedAIName) || normalizedAIName.includes(itemName);
          });
        }
        
        return match;
      };

      // Convert AI items to quote items - ONLY if matched in library
      const newItems: QuoteItem[] = [];
      const unmatchedItems: string[] = [];

      (aiData.items || []).forEach((aiItem: any, index: number) => {
        const matchedItem = findMatchingItem(aiItem.name);
        
        if (matchedItem) {
          // Use library item with AI-provided variants
          newItems.push({
            id: Date.now() + index,
            itemId: matchedItem.id,
            name: matchedItem.name,
            unit: matchedItem.unit,
            quantity: aiItem.quantity || 1,
            price: aiItem.unitPrice || matchedItem.price,
            category: matchedItem.category,
            order: index,
            mode: matchedItem.mode || 'customizable',
            dimension_1: null,
            dimension_2: null,
            variant_length: aiItem.length || null,
            variant_width: aiItem.width || null,
            variant_height: aiItem.height || null,
            variant_thickness: aiItem.thickness || null,
            variant_color: aiItem.color || null,
            variant_layers: aiItem.layers || null,
            pot_type: matchedItem.pot_type || aiItem.potType || null,
          });
        } else {
          // Track unmatched items
          unmatchedItems.push(aiItem.name);
        }
      });

      if (unmatchedItems.length > 0) {
        // Show error for unmatched items
        toast.error(
          `Không tìm thấy trong thư viện: ${unmatchedItems.join(', ')}. Vui lòng tạo hạng mục trong thư viện trước.`,
          { duration: 5000 }
        );
        return;
      }

      setItems(newItems);
      
      // Set category order
      const uniqueCategories = Array.from(new Set(newItems.map(item => item.category)));
      setCategoryOrder(uniqueCategories);

      toast.success(`Đã tải ${newItems.length} hạng mục từ thư viện`);
    } catch (error) {
      console.error('Error loading AI quote items:', error);
      toast.error('Không thể tải dữ liệu từ AI Chat');
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // If editing or duplicating, fetch quote data first
      const sourceQuoteId = editQuoteId || duplicateQuoteId;
      if ((isEditMode || isDuplicateMode) && sourceQuoteId) {
        // Build query - Admin can edit/view any quote, agents only their own
        let quoteQuery = supabase
          .from('quotes')
          .select(`
            *,
            customers (
              name,
              phone,
              address
            )
          `)
          .eq('id', sourceQuoteId);

        // If not admin, filter by user_id
        if (!isAdmin) {
          quoteQuery = quoteQuery.eq('user_id', user.id);
        }

        const { data: quoteData, error: quoteError } = await quoteQuery.maybeSingle();

        if (quoteError) throw quoteError;
        if (!quoteData) {
          toast.error("Không tìm thấy báo giá");
          navigate('/quotes');
          return;
        }

        // For edit mode, store the quote owner ID
        if (isEditMode) {
          setQuoteOwnerId(quoteData.user_id);
        }

        // Fetch quote items with order - order by category first, then by item
        const { data: itemsData, error: itemsError } = await supabase
          .from('quote_items')
          .select(`
            *,
            items (
              id,
              name,
              unit,
              price,
              category,
              mode,
              pot_type
            )
          `)
          .eq('quote_id', sourceQuoteId)
          .order('category_order', { ascending: true })
          .order('item_order', { ascending: true });

        if (itemsError) throw itemsError;

        // Set customer info
        setCustomerName(quoteData.customers.name);
        setCustomerPhone(quoteData.customers.phone);
        setCustomerAddress(quoteData.customers.address || '');
        
        // For edit mode, use existing date and code. For duplicate, use new date and generate new code
        if (isEditMode) {
          setQuoteDate(new Date(quoteData.date));
          setQuoteId(quoteData.quote_code);
          // Load discount and VAT values
          setDiscount(quoteData.discount_percent ? String(quoteData.discount_percent) : "");
          setVat(quoteData.vat_percent ? String(quoteData.vat_percent) : "");
        } else if (isDuplicateMode) {
          const today = new Date();
          setQuoteDate(today);
          // Generate new quote code for duplicate
          const newQuoteCode = await generateQuoteId(user.id, userSeqNumber, today);
          setQuoteId(newQuoteCode);
        }

        // Set quote items with order
        const loadedItems = itemsData.map((qi: any, index: number) => ({
          id: qi.id,
          itemId: qi.items.id,
          name: qi.items.name,
          unit: qi.items.unit,
          quantity: Number(qi.quantity),
          price: Number(qi.unit_price),
          category: qi.items.category,
          order: qi.item_order ?? index,
          categoryOrder: qi.category_order ?? 999,
          mode: qi.items.mode || 'standard',
          dimension_1: qi.dimension_1 ? Number(qi.dimension_1) : null,
          dimension_2: qi.dimension_2 ? Number(qi.dimension_2) : null,
          variant_length: qi.variant_length ? Number(qi.variant_length) : null,
          variant_width: qi.variant_width ? Number(qi.variant_width) : null,
          variant_height: qi.variant_height ? Number(qi.variant_height) : null,
          variant_thickness: qi.variant_thickness ? Number(qi.variant_thickness) : null,
          variant_color: qi.variant_color || null,
          variant_layers: qi.variant_layers || null,
          pot_type: qi.items.pot_type || null,
        }));
        setItems(loadedItems);

        // Extract category order from items based on category_order field
        const categoryMap = new Map<string, number>();
        itemsData.forEach((qi: any) => {
          const cat = qi.items.category || "Chưa phân loại";
          const catOrder = qi.category_order ?? 999;
          if (!categoryMap.has(cat) || categoryMap.get(cat)! > catOrder) {
            categoryMap.set(cat, catOrder);
          }
        });
        
        // Sort categories by their order value
        const sortedCategories = Array.from(categoryMap.entries())
          .sort((a, b) => a[1] - b[1])
          .map(entry => entry[0]);
        
        setCategoryOrder(sortedCategories);

        // Set quantity displays
        const displays: {[key: number]: string} = {};
        loadedItems.forEach((item: any) => {
          displays[item.id] = String(item.quantity);
        });
        setQuantityDisplays(displays);
      }

      // Fetch user profile for sequence number (always needed)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, user_sequence_number')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.user_sequence_number) {
        setUserSeqNumber(profile.user_sequence_number);
      }

      // Fetch settings for creator info (priority)
      const { data: settingsData } = await supabase
        .from('settings')
        .select('creator_name, creator_phone')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsData?.creator_name && settingsData?.creator_phone) {
        setCreatorName(settingsData.creator_name);
        setCreatorPhone(settingsData.creator_phone);
      } else if (profile) {
        // Fallback to user profile if settings not available
        setCreatorName(profile.full_name || '');
        setCreatorPhone(profile.phone || '');
      }

      // Fetch available items - Items library is shared for all users
      const { data: itemsData, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableItems((itemsData || []).map(item => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        price: Number(item.price),
        category: item.category,
        image_url: item.image_url,
        mode: (item.mode as 'standard' | 'auto_quantity' | 'customizable') || 'standard',
        pot_type: item.pot_type || null
      })));
    } catch (error: any) {
      toast.error("Không thể tải dữ liệu");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Categories are now fetched from database in sorted order

  // Filter items by selected category and search query
  const filteredAvailableItems = availableItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAvailableItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredAvailableItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Swipe gesture for mobile with transition animation
  useSwipeGesture({
    onSwipeLeft: () => {
      if (currentPage < totalPages && !isTransitioning) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentPage(prev => prev + 1);
          setIsTransitioning(false);
        }, 150);
      }
    },
    onSwipeRight: () => {
      if (currentPage > 1 && !isTransitioning) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentPage(prev => prev - 1);
          setIsTransitioning(false);
        }, 150);
      }
    },
  });

  const addItem = (itemId: string) => {
    const item = availableItems.find(i => i.id === itemId);
    if (item) {
      const newItem: QuoteItem = {
        id: Date.now(),
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        quantity: item.mode === 'auto_quantity' ? 0 : 1,
        price: Number(item.price),
        category: item.category,
        order: items.length,
        mode: item.mode || 'standard',
        dimension_1: null,
        dimension_2: null,
        variant_length: null,
        variant_width: null,
        variant_height: null,
        variant_thickness: null,
        variant_color: null,
        variant_layers: null,
        pot_type: item.pot_type || null,
      };
      setItems([...items, newItem]);
      
      // Update category order if new category
      if (!categoryOrder.includes(item.category)) {
        setCategoryOrder([...categoryOrder, item.category]);
      }

      // Toast notification
      toast.success(`Đã thêm "${item.name}"`, {
        duration: 2000,
      });
    }
  };

  const updateQuantity = (id: number, value: string) => {
    setQuantityDisplays(prev => ({
      ...prev,
      [id]: value
    }));

    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        if (value === "") {
          return { ...item, quantity: 0 };
        }
        const cleanValue = value.replace(/^0+(?=\d)/, '');
        const numValue = parseFloat(cleanValue);
        if (!isNaN(numValue) && numValue >= 0) {
          return { ...item, quantity: numValue };
        }
      }
      return item;
    }));
  };

  const updateItemDimensions = (id: number, dim1: number | null, dim2: number | null) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        return { ...item, dimension_1: dim1, dimension_2: dim2 };
      }
      return item;
    }));
  };

  const updateItemVariants = (id: number, variants: any) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          variant_length: variants.length,
          variant_width: variants.width,
          variant_height: variants.height,
          variant_thickness: variants.thickness,
          variant_color: variants.color,
          variant_layers: variants.layers,
        };
      }
      return item;
    }));
  };

  const updateItemPrice = (id: number, price: number) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        return { ...item, price };
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    const removedItem = items.find(item => item.id === id);
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    
    // Remove category from order if no more items in that category
    if (removedItem?.category) {
      const hasOtherItemsInCategory = newItems.some(item => item.category === removedItem.category);
      if (!hasOtherItemsInCategory) {
        setCategoryOrder(categoryOrder.filter(cat => cat !== removedItem.category));
      }
    }
    
    setQuantityDisplays(prev => {
      const newDisplays = { ...prev };
      delete newDisplays[id];
      return newDisplays;
    });
  };

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const discountAmount = discount ? (subtotal * parseFloat(discount)) / 100 : 0;
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = vat ? (afterDiscount * parseFloat(vat)) / 100 : 0;
    return afterDiscount + vatAmount;
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone || items.length === 0) {
      toast.error("Vui lòng điền số điện thoại khách hàng và thêm ít nhất một hạng mục");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      if (isEditMode && editQuoteId) {
        // Update mode
        const totalAmount = calculateTotal();
        
        // Fetch existing quote and customer to compare total, date, and customer info
        const { data: quoteData } = await supabase
          .from('quotes')
          .select('customer_id, total_amount, date, quote_code')
          .eq('id', editQuoteId)
          .single();

        let customerInfoChanged = false;

        if (quoteData) {
          // Fetch current customer info
          const { data: currentCustomer } = await supabase
            .from('customers')
            .select('name, phone, address')
            .eq('id', quoteData.customer_id)
            .single();

          // Check if customer info changed
          if (currentCustomer) {
            customerInfoChanged = 
              currentCustomer.name !== customerName ||
              currentCustomer.phone !== customerPhone ||
              (currentCustomer.address || null) !== (customerAddress || null);
          }

          // Update customer info
          await supabase
            .from('customers')
            .update({
              name: customerName,
              phone: customerPhone,
              address: customerAddress || null
            })
            .eq('id', quoteData.customer_id);
        }

        // Format selected date to YYYY-MM-DD
        const year = quoteDate.getFullYear();
        const month = String(quoteDate.getMonth() + 1).padStart(2, '0');
        const day = String(quoteDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // Only generate new quote code if total amount OR date OR customer info changed
        let newQuoteCode = quoteData?.quote_code || quoteId;
        
        const totalChanged = Math.abs(totalAmount - Number(quoteData?.total_amount || 0)) > 0.01;
        const dateChanged = quoteData?.date !== dateStr;
        
        if (totalChanged || dateChanged || customerInfoChanged) {
          // Use the quote owner's user_id (in case admin is editing someone else's quote)
          const ownerUserId = quoteOwnerId || user.id;
          
          // Fetch the owner's sequence number
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('user_sequence_number')
            .eq('id', ownerUserId)
            .single();
          
          const ownerSeqNum = ownerProfile?.user_sequence_number || 1;
          newQuoteCode = await generateQuoteId(ownerUserId, ownerSeqNum, quoteDate);
        }
        
        // Update quote
        const { error: quoteError } = await supabase
          .from('quotes')
          .update({
            quote_code: newQuoteCode,
            date: dateStr,
            total_amount: totalAmount,
            discount_percent: discount ? parseFloat(discount) : null,
            vat_percent: vat ? parseFloat(vat) : null,
            notes: discount || vat ? `Chiết khấu: ${discount || 0}%, VAT: ${vat || 0}%` : null
          })
          .eq('id', editQuoteId);

        if (quoteError) throw quoteError;

        // Delete old quote items
        await supabase
          .from('quote_items')
          .delete()
          .eq('quote_id', editQuoteId);

        // Create new quote items with order and category order
        // First, sort items by category order, then by item order within category
        const sortedItems = [...items].sort((a, b) => {
          const catA = a.category || "Chưa phân loại";
          const catB = b.category || "Chưa phân loại";
          const catOrderA = categoryOrder.indexOf(catA);
          const catOrderB = categoryOrder.indexOf(catB);
          
          if (catOrderA !== catOrderB) {
            return catOrderA - catOrderB;
          }
          // Within same category, sort by item order
          return (a.order ?? 0) - (b.order ?? 0);
        });

        const quoteItems = sortedItems.map((item, globalIndex) => {
          const itemCategory = item.category || "Chưa phân loại";
          const categoryIndex = categoryOrder.indexOf(itemCategory);
          return {
            quote_id: editQuoteId,
            item_id: item.itemId,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.quantity * item.price,
            item_order: globalIndex,
            category_order: categoryIndex >= 0 ? categoryIndex : 999,
            dimension_1: item.dimension_1,
            dimension_2: item.dimension_2,
            variant_length: item.variant_length,
            variant_width: item.variant_width,
            variant_height: item.variant_height,
            variant_thickness: item.variant_thickness,
            variant_color: item.variant_color,
            variant_layers: item.variant_layers,
          };
        });

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems);

        if (itemsError) throw itemsError;

        toast.success("Báo giá đã được cập nhật thành công!");
        
        // ✅ Invalidate cache for realtime updates
        queryClient.invalidateQueries({ queryKey: quoteKeys.lists(user.id) });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats(user.id) });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.recentQuotes(user.id) });
        queryClient.invalidateQueries({ queryKey: customerKeys.all(user.id) }); // ✅ Customer may be updated
        
        navigate(`/quote/${editQuoteId}`, { replace: true });
      } else {
        // Create mode (existing code)
        // Check if customer exists, if not create new
        let customerId: string;
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', customerPhone)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingCustomer) {
          customerId = existingCustomer.id;
          // Update customer info if provided
          if (customerName || customerAddress) {
            await supabase
              .from('customers')
              .update({
                name: customerName,
                address: customerAddress || null
              })
              .eq('id', customerId);
          }
        } else {
          // Create new customer
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              name: customerName,
              phone: customerPhone,
              address: customerAddress || null,
              user_id: user.id
            })
            .select()
            .single();

          if (customerError) throw customerError;
          customerId = newCustomer.id;
        }

        // Fetch payment info from settings to create snapshot
        const { data: paymentSettings } = await supabase
          .from('settings')
          .select('bank_name, bank_account_number, bank_account_name')
          .eq('user_id', user.id)
          .maybeSingle();

        // Create quote
        const totalAmount = calculateTotal();
        
        // Format date to YYYY-MM-DD in local timezone
        const year = quoteDate.getFullYear();
        const month = String(quoteDate.getMonth() + 1).padStart(2, '0');
        const day = String(quoteDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const { data: newQuote, error: quoteError } = await supabase
          .from('quotes')
          .insert({
            quote_code: quoteId,
            customer_id: customerId,
            user_id: user.id,
            date: dateStr,
            total_amount: totalAmount,
            status: 'pending',
            discount_percent: discount ? parseFloat(discount) : null,
            vat_percent: vat ? parseFloat(vat) : null,
            notes: discount || vat ? `Chiết khấu: ${discount || 0}%, VAT: ${vat || 0}%` : null,
            payment_bank_name: paymentSettings?.bank_name || null,
            payment_account_number: paymentSettings?.bank_account_number || null,
            payment_account_name: paymentSettings?.bank_account_name || null
          })
          .select()
          .single();

        if (quoteError) throw quoteError;

        // Create quote items with order and category order
        // First, sort items by category order, then by item order within category
        const sortedItems = [...items].sort((a, b) => {
          const catA = a.category || "Chưa phân loại";
          const catB = b.category || "Chưa phân loại";
          const catOrderA = categoryOrder.indexOf(catA);
          const catOrderB = categoryOrder.indexOf(catB);
          
          if (catOrderA !== catOrderB) {
            return catOrderA - catOrderB;
          }
          // Within same category, sort by item order
          return (a.order ?? 0) - (b.order ?? 0);
        });

        const quoteItems = sortedItems.map((item, globalIndex) => {
          const itemCategory = item.category || "Chưa phân loại";
          const categoryIndex = categoryOrder.indexOf(itemCategory);
          return {
            quote_id: newQuote.id,
            item_id: item.itemId,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.quantity * item.price,
            item_order: globalIndex,
            category_order: categoryIndex >= 0 ? categoryIndex : 999,
            dimension_1: item.dimension_1,
            dimension_2: item.dimension_2,
            variant_length: item.variant_length,
            variant_width: item.variant_width,
            variant_height: item.variant_height,
            variant_thickness: item.variant_thickness,
            variant_color: item.variant_color,
            variant_layers: item.variant_layers,
          };
        });

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems);

        if (itemsError) throw itemsError;

        toast.success("Báo giá đã được tạo thành công!");
        
        // ✅ Invalidate cache for realtime updates
        queryClient.invalidateQueries({ queryKey: quoteKeys.lists(user.id) });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.stats(user.id) });
        queryClient.invalidateQueries({ queryKey: dashboardKeys.recentQuotes(user.id) });
        queryClient.invalidateQueries({ queryKey: customerKeys.all(user.id) }); // ✅ Customer may be created/updated
        
        navigate(`/quote/${newQuote.id}`, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể lưu báo giá");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategoryOrder((prevOrder) => {
        const oldIndex = prevOrder.findIndex(cat => `category-${cat}` === active.id);
        const newIndex = prevOrder.findIndex(cat => `category-${cat}` === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(prevOrder, oldIndex, newIndex);
        }
        return prevOrder;
      });
    }
  };

  const handleItemsReorder = (category: string, newCategoryItems: QuoteItem[]) => {
    setItems(prevItems => {
      const otherItems = prevItems.filter(item => (item.category || "Chưa phân loại") !== category);
      // Update order property for reordered items based on their new position
      const updatedCategoryItems = newCategoryItems.map((item, index) => ({
        ...item,
        order: index
      }));
      return [...otherItems, ...updatedCategoryItems];
    });
  };

  // Group items by category and sort by category order
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || "Chưa phân loại";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, QuoteItem[]>);

  // Sort categories by categoryOrder
  const sortedCategories = categoryOrder.length > 0
    ? categoryOrder.filter(cat => groupedItems[cat])
    : Object.keys(groupedItems);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background flex items-center justify-center">
        <FileText className="w-12 h-12 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {isEditMode ? "Chỉnh sửa Báo giá" : "Tạo Báo giá Mới"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? "Cập nhật thông tin báo giá" : "Điền thông tin khách hàng và chọn hạng mục"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Info & Customer Details - Combined */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              {/* Quote ID & Date Section */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 mb-6 border-b border-primary/20">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="text-sm text-muted-foreground">Mã báo giá</h3>
                    <p className="text-2xl font-bold text-primary">{quoteId || "Đang tạo..."}</p>
                  </div>
                </div>
                <div className="w-full sm:flex-1 sm:ml-auto">
                  <Label htmlFor="quoteDate" className="text-sm text-muted-foreground block mb-2">Ngày tạo báo giá</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="quoteDate"
                        variant="outline"
                        className={cn(
                          "w-full sm:w-[240px] justify-start text-left font-normal",
                          !quoteDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {quoteDate ? format(quoteDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={quoteDate}
                        onSelect={(date) => date && setQuoteDate(date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Customer Info Section */}
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded"></span>
                  Thông tin Khách hàng
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Tên khách hàng *</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Số điện thoại *</Label>
                    <Input
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0901234567"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="customerAddress">Địa chỉ</Label>
                    <Input
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Available Items */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Chọn Hạng mục
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm hạng mục..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {filteredAvailableItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Chưa có hạng mục nào. Vui lòng thêm hạng mục trong Thư viện.</p>
                </div>
              ) : (
                <>
                  <div className={cn(
                    "grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[400px] transition-opacity duration-150",
                    isTransitioning && "opacity-50"
                  )}>
                    {paginatedItems.map((item) => (
                      <Button
                        key={item.id}
                        type="button"
                        variant="outline"
                        className="justify-start gap-3 h-auto py-2 px-3 focus-visible:ring-0 focus-visible:ring-offset-0"
                        onClick={(e) => {
                          addItem(item.id);
                          // Remove focus after click to prevent blue outline
                          e.currentTarget.blur();
                        }}
                      >
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded border border-border"
                        />
                        <div className="flex-1 text-left">
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(Number(item.price))}/{item.unit}
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-primary" />
                      </Button>
                    ))}
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="gap-1"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              {!isMobile && <span>Trước</span>}
                            </Button>
                          </PaginationItem>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="gap-1"
                            >
                              {!isMobile && <span>Sau</span>}
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      
                      {isMobile && (
                        <p className="text-center text-sm text-muted-foreground mt-2">
                          Vuốt sang trái/phải để chuyển trang
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Selected Items with Drag & Drop */}
            <Card ref={selectedItemsRef} className="p-6 scroll-mt-4">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Hạng mục đã chọn
              </h2>
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có hạng mục nào được chọn</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleCategoryDragEnd}
                >
                  <SortableContext
                    items={sortedCategories.map(cat => `category-${cat}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-6">
                      {sortedCategories.map((category) => (
                        <SortableCategory
                          key={category}
                          category={category}
                          categoryItems={groupedItems[category]}
                          quantityDisplays={quantityDisplays}
                          updateQuantity={updateQuantity}
                          removeItem={removeItem}
                          formatCurrency={formatCurrency}
                          onItemsReorder={(newItems) => handleItemsReorder(category, newItems)}
                          updateItemDimensions={updateItemDimensions}
                          updateItemVariants={updateItemVariants}
                          updateItemPrice={updateItemPrice}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-16">
              <h2 className="text-xl font-bold text-foreground mb-4">Tổng kết</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính:</span>
                  <span className="font-semibold">{formatCurrency(getSubtotal())}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="discount" className="text-muted-foreground whitespace-nowrap">Chiết khấu (%):</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    className="w-24 text-right"
                  />
                </div>
                {discount && (
                  <div className="flex justify-between text-destructive">
                    <span>Giảm giá:</span>
                    <span>-{formatCurrency((getSubtotal() * parseFloat(discount)) / 100)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="vat" className="text-muted-foreground whitespace-nowrap">VAT (%):</Label>
                  <Input
                    id="vat"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                    placeholder="0"
                    className="w-24 text-right"
                  />
                </div>
                {vat && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thuế VAT:</span>
                    <span>+{formatCurrency(((getSubtotal() - (discount ? (getSubtotal() * parseFloat(discount)) / 100 : 0)) * parseFloat(vat)) / 100)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Tổng cộng:</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full mt-6" size="lg" disabled={submitting}>
                {submitting ? "Đang xử lý..." : (isEditMode ? "Cập nhật Báo giá" : "Tạo Báo giá")}
              </Button>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuote;
