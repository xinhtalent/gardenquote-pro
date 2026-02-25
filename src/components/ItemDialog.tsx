import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { formatNumberWithThousands, parseFormattedNumber } from "@/lib/utils";
import { ImageUploadCrop } from "./ImageUploadCrop";
import { supabase } from "@/integrations/supabase/client";
import { POT_TYPE_LABELS, type PotType } from "@/lib/potPricingUtils";

interface Item {
  id?: string;
  name: string;
  unit: string;
  price: number;
  image: string;
  category: string;
  mode?: 'standard' | 'auto_quantity' | 'customizable';
  pot_type?: PotType | string | null;
}

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item;
  onSave: (item: Item) => void;
  categories?: string[];
  units?: string[];
}

export function ItemDialog({ open, onOpenChange, item, onSave, categories = [], units = [] }: ItemDialogProps) {
  const [formData, setFormData] = useState<Item>({
    name: "",
    unit: "",
    price: 0,
    image: "/placeholder.svg",
    category: "",
    mode: "standard",
    pot_type: null,
  });
  const [priceDisplay, setPriceDisplay] = useState<string>("");
  const [pendingImageBlob, setPendingImageBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        mode: item.mode || "standard",
        pot_type: item.pot_type || null,
      });
      setPriceDisplay(item.price > 0 ? formatNumberWithThousands(item.price) : "");
    } else {
      setFormData({
        name: "",
        unit: "",
        price: 0,
        image: "/placeholder.svg",
        category: "",
        mode: "standard",
        pot_type: null,
      });
      setPriceDisplay("");
    }
  }, [item, open]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setPriceDisplay("");
      setFormData({ ...formData, price: 0 });
      return;
    }
    
    const numericValue = parseFormattedNumber(value);
    if (!isNaN(numericValue)) {
      setPriceDisplay(formatNumberWithThousands(numericValue));
      setFormData({ ...formData, price: numericValue });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalImageUrl = formData.image;
    try {
      if (pendingImageBlob) {
        const fileName = `items/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, pendingImageBlob, {
            contentType: 'image/webp',
            cacheControl: '31536000',
            upsert: false,
          });
        if (uploadError) {
          throw uploadError;
        }

        const { data: pub } = supabase.storage.from('item-images').getPublicUrl(fileName);
        if (!pub?.publicUrl) {
          throw new Error('Không thể lấy URL công khai của ảnh');
        }
        finalImageUrl = pub.publicUrl;
      }
    } catch {
      // If upload fails, keep current image (could be placeholder or previous URL)
    }

    onSave({ ...formData, image: finalImageUrl });
    setPendingImageBlob(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {item ? "Chỉnh sửa hạng mục" : "Thêm hạng mục mới"}
            </DialogTitle>
            <DialogDescription>
              {item
                ? "Cập nhật thông tin hạng mục"
                : "Điền thông tin để thêm hạng mục mới"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tên hạng mục *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="VD: Cây xanh trang trí"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Danh mục</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent side="bottom" position="popper" className="max-h-[400px]">
                  {categories.filter(c => c !== "all").map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mode">Chế độ tính toán (không bắt buộc)</Label>
              <Select
                value={formData.mode || "standard"}
                onValueChange={(value: 'standard' | 'auto_quantity' | 'customizable') =>
                  setFormData({ ...formData, mode: value, pot_type: value === 'customizable' ? 'regular' : null })
                }
              >
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Chọn chế độ" />
                </SelectTrigger>
                <SelectContent side="bottom" position="popper">
                  <SelectItem value="standard">Standard - Nhập số lượng thủ công</SelectItem>
                  <SelectItem value="auto_quantity">Auto Quantity - Tự tính theo kích thước (m²)</SelectItem>
                  <SelectItem value="customizable">Customizable - Tính theo công thức</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.mode === 'customizable' && (
              <div className="grid gap-2 p-3 border border-border rounded-lg bg-secondary/20">
                <Label htmlFor="pot_type">Loại chậu *</Label>
                <Select
                  value={formData.pot_type || 'regular'}
                  onValueChange={(value: PotType) =>
                    setFormData({ ...formData, pot_type: value })
                  }
                  required={formData.mode === 'customizable'}
                >
                  <SelectTrigger id="pot_type">
                    <SelectValue placeholder="Chọn loại chậu" />
                  </SelectTrigger>
                  <SelectContent side="bottom" position="popper">
                    {Object.entries(POT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Đơn giá sẽ tự động tính theo công thức khi thêm vào báo giá.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit">Đơn vị *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unit: value })
                  }
                  required
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent side="bottom" position="popper" className="max-h-[400px]">
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.mode !== 'customizable' && (
                <div className="grid gap-2">
                  <Label htmlFor="price">Đơn giá (VNĐ) *</Label>
                  <Input
                    id="price"
                    type="text"
                    inputMode="decimal"
                    value={priceDisplay}
                    onChange={handlePriceChange}
                    placeholder="0"
                    required
                  />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Hình ảnh</Label>
              <ImageUploadCrop
                currentImage={formData.image}
                uploadMode="deferred"
                onImageBlobReady={(blob) => setPendingImageBlob(blob)}
                onImageChange={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit">
              {item ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
