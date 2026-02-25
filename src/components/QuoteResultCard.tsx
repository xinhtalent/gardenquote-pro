import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { POT_TYPE_LABELS, type PotType } from "@/lib/potPricingUtils";

interface QuoteItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  potType?: PotType;
  length?: number;
  width?: number;
  height?: number;
  thickness?: number;
  layers?: number;
  color?: string;
  breakdown?: string;
}

interface QuoteResultCardProps {
  items: QuoteItem[];
  customerInfo?: {
    name?: string | null;
    phone?: string | null;
    address?: string | null;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const QuoteResultCard = ({ items, customerInfo }: QuoteResultCardProps) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Đã copy",
      description: "Nội dung đã được copy vào clipboard",
    });
  };

  const generateSimpleText = (item: QuoteItem) => {
    const colorText = item.color ? `, màu ${item.color}` : '';
    const sizeText = item.length && item.width && item.height ? `${item.length}×${item.width}×${item.height}cm` : '';
    const thicknessText = item.thickness ? ` dày ${item.thickness}mm` : '';
    return `✅ ${item.name} ${sizeText}${thicknessText}${colorText}\n💰 Giá: ${formatCurrency(item.unitPrice)}${item.quantity > 1 ? ` × ${item.quantity} = ${formatCurrency(item.totalPrice)}` : ''}`;
  };

  const generateFullText = () => {
    let text = "";
    
    if (customerInfo && (customerInfo.name || customerInfo.phone || customerInfo.address)) {
      text += "👤 THÔNG TIN KHÁCH HÀNG:\n";
      if (customerInfo.name) text += `Tên: ${customerInfo.name}\n`;
      if (customerInfo.phone) text += `SĐT: ${customerInfo.phone}\n`;
      if (customerInfo.address) text += `Địa chỉ: ${customerInfo.address}\n`;
      text += "\n";
    }
    
    text += "BÁO GIÁ:\n";
    items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name}`;
      if (item.potType) {
        text += ` (${POT_TYPE_LABELS[item.potType]})`;
      }
      text += `\n`;
      
      if (item.length && item.width && item.height) {
        text += `   Kích thước: ${item.length}×${item.width}×${item.height}cm`;
        if (item.thickness) {
          text += `, dày ${item.thickness}mm`;
        }
        text += `\n`;
      }
      
      if (item.layers && item.layers > 1) {
        text += `   Số tầng: ${item.layers}\n`;
      }
      if (item.color) {
        text += `   Màu sắc: ${item.color}\n`;
      }
      text += `   Đơn giá: ${formatCurrency(item.unitPrice)}\n`;
      text += `   Số lượng: ${item.quantity}\n`;
      text += `   Thành tiền: ${formatCurrency(item.totalPrice)}\n\n`;
    });
    
    const grandTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    text += `TỔNG CỘNG: ${formatCurrency(grandTotal)}`;
    
    return text;
  };

  const grandTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="space-y-3">
      {customerInfo && (customerInfo.name || customerInfo.phone || customerInfo.address) && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">👤 KHÁCH HÀNG</p>
              {customerInfo.name && <p className="text-sm font-medium">{customerInfo.name}</p>}
              {customerInfo.phone && <p className="text-sm text-muted-foreground">{customerInfo.phone}</p>}
              {customerInfo.address && <p className="text-sm text-muted-foreground">{customerInfo.address}</p>}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => copyToClipboard(
                `${customerInfo.name || ''}\n${customerInfo.phone || ''}\n${customerInfo.address || ''}`
              )}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {items.map((item, idx) => (
        <Card key={idx} className="overflow-hidden border-l-4 border-l-primary">
          <div className="p-4">
            {/* Compact view - always visible */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-semibold">✅ {item.name}</span>
                </div>
                {item.length && item.width && item.height ? (
                  <p className="text-sm text-muted-foreground mb-1">
                    {item.length}×{item.width}×{item.height}cm
                    {item.thickness && ` dày ${item.thickness}mm`}
                    {item.layers && item.layers > 1 && ` • ${item.layers} tầng`}
                    {item.color && ` • Màu ${item.color}`}
                  </p>
                ) : (
                  item.color && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Màu {item.color}
                    </p>
                  )
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary">
                    💰 {formatCurrency(item.unitPrice)}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-sm text-muted-foreground">
                      × {item.quantity} = {formatCurrency(item.totalPrice)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copyToClipboard(generateSimpleText(item))}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  onClick={() => toggleExpand(idx)}
                >
                  {expandedItems.has(idx) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Detailed view - collapsible */}
            {expandedItems.has(idx) && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {item.potType && (
                    <div>
                      <span className="text-muted-foreground">Loại:</span>
                      <p className="font-medium">{POT_TYPE_LABELS[item.potType]}</p>
                    </div>
                  )}
                  {item.thickness && (
                    <div>
                      <span className="text-muted-foreground">Độ dày:</span>
                      <p className="font-medium">{item.thickness}mm</p>
                    </div>
                  )}
                  {item.length && item.width && item.height && (
                    <div>
                      <span className="text-muted-foreground">Kích thước:</span>
                      <p className="font-medium">{item.length}×{item.width}×{item.height}cm</p>
                    </div>
                  )}
                  {item.layers && item.layers > 1 && (
                    <div>
                      <span className="text-muted-foreground">Số tầng:</span>
                      <p className="font-medium">{item.layers}</p>
                    </div>
                  )}
                  {item.color && (
                    <div>
                      <span className="text-muted-foreground">Màu sắc:</span>
                      <p className="font-medium">{item.color}</p>
                    </div>
                  )}
                </div>
                {item.breakdown && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Chi tiết tính giá:</span>
                    <p className="text-xs mt-1 p-2 bg-muted rounded">{item.breakdown}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      ))}

      {/* Total and copy all button */}
      <Card className="p-4 bg-primary/10 border-primary">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">TỔNG CỘNG</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(grandTotal)}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => copyToClipboard(generateFullText())}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default QuoteResultCard;
