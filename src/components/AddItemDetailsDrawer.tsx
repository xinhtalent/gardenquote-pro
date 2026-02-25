import { Button } from "@/components/ui/button";
import { QuoteItemModeInputs } from "@/components/QuoteItemModeInputs";
import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface AddItemDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AvailableItem | null;
  onAdd: (itemData: {
    quantity: number;
    dimensions?: { dim1: number | null; dim2: number | null };
    variants?: any;
    unitPrice?: number;
  }) => void;
}

export function AddItemDetailsDrawer({ open, onOpenChange, item, onAdd }: AddItemDetailsDrawerProps) {
  const isMobile = useIsMobile();
  const [quantity, setQuantity] = useState(1);
  const [dimensions, setDimensions] = useState<{ dimension_1: number | null; dimension_2: number | null }>({ dimension_1: null, dimension_2: null });
  const [variants, setVariants] = useState<any>(null);
  const [unitPrice, setUnitPrice] = useState<number | null>(null);

  useEffect(() => {
    if (item) {
      const mode = item.mode || 'standard';
      setQuantity(mode === 'auto_quantity' ? 0 : 1);
      setDimensions({ dimension_1: null, dimension_2: null });
      setVariants(null);
      setUnitPrice(null);
    }
  }, [item]);

  const handleAdd = () => {
    if (!item) return;
    
    const mode = item.mode || 'standard';
    onAdd({
      quantity,
      dimensions: mode === 'auto_quantity' ? { dim1: dimensions.dimension_1, dim2: dimensions.dimension_2 } : undefined,
      variants: mode === 'customizable' ? variants : undefined,
      unitPrice: mode === 'customizable' && unitPrice ? unitPrice : item.price,
    });
    
    onOpenChange(false);
  };

  if (!item) return null;

  const mode = item.mode || 'standard';
  const showInputs = mode !== 'standard';

  const content = (
    <div className="space-y-4">
      {/* Item Info */}
      <div className="flex gap-3 p-3 border border-border rounded-lg bg-secondary/20">
        <img
          src={item.image_url || "/placeholder.svg"}
          alt={item.name}
          className="w-16 h-16 rounded object-cover"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
          <p className="text-sm text-muted-foreground">{item.category}</p>
          {mode !== 'customizable' && (
            <p className="text-sm font-medium text-primary">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}/{item.unit}
            </p>
          )}
        </div>
      </div>

      {/* Mode-specific inputs */}
      {showInputs && (
        <QuoteItemModeInputs
          mode={mode}
          quantity={quantity}
          onQuantityChange={setQuantity}
          dimensions={mode === 'auto_quantity' ? dimensions : undefined}
          onDimensionsChange={mode === 'auto_quantity' ? (dim1, dim2) => setDimensions({ dimension_1: dim1, dimension_2: dim2 }) : undefined}
          variants={mode === 'customizable' ? variants : undefined}
          onVariantsChange={mode === 'customizable' ? setVariants : undefined}
          potType={mode === 'customizable' ? (item.pot_type as any) : null}
          onUnitPriceChange={mode === 'customizable' ? setUnitPrice : undefined}
        />
      )}

      {/* Quick add note for standard mode */}
      {mode === 'standard' && (
        <p className="text-xs text-muted-foreground">
          Hạng mục sẽ được thêm với số lượng mặc định. Bạn có thể chỉnh sửa sau.
        </p>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Thêm hạng mục</DrawerTitle>
            <DrawerDescription>
              {showInputs ? 'Nhập thông số chi tiết' : 'Xác nhận thêm vào báo giá'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
            {content}
          </div>
          <DrawerFooter>
            <Button onClick={handleAdd} className="w-full">
              Thêm vào báo giá
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Hủy
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Thêm hạng mục</SheetTitle>
          <SheetDescription>
            {showInputs ? 'Nhập thông số chi tiết' : 'Xác nhận thêm vào báo giá'}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {content}
        </div>
        <div className="mt-6 flex gap-2">
          <Button onClick={handleAdd} className="flex-1">
            Thêm vào báo giá
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
