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
import { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { formatNumberWithThousands, parseFormattedNumber } from "@/lib/utils";

interface Item {
  id?: number;
  name: string;
  unit: string;
  price: number;
  image: string;
  category: string;
}

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item;
  onSave: (item: Item) => void;
}

export function ItemDialog({ open, onOpenChange, item, onSave }: ItemDialogProps) {
  const [formData, setFormData] = useState<Item>({
    name: "",
    unit: "",
    price: 0,
    image: "/placeholder.svg",
    category: "",
  });
  const [priceDisplay, setPriceDisplay] = useState("");

  useEffect(() => {
    if (item) {
      setFormData(item);
      setPriceDisplay(formatNumberWithThousands(item.price));
    } else {
      setFormData({
        name: "",
        unit: "",
        price: 0,
        image: "/placeholder.svg",
        category: "",
      });
      setPriceDisplay("");
    }
  }, [item, open]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePriceChange = (value: string) => {
    const formatted = formatNumberWithThousands(value);
    setPriceDisplay(formatted);
    setFormData({ ...formData, price: parseFormattedNumber(value) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
              <Label htmlFor="category">Danh mục *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="VD: Cây cảnh"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit">Đơn vị *</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="VD: cây, m², bao"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Đơn giá (VNĐ) *</Label>
                <Input
                  id="price"
                  type="text"
                  value={priceDisplay}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Hình ảnh</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('image')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Chọn ảnh
                  </Button>
                </div>
                {formData.image && formData.image !== "/placeholder.svg" && (
                  <div className="relative w-20 h-20 border rounded-md overflow-hidden">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: "/placeholder.svg" })}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
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
