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

const UNIT_OPTIONS = ["m", "m2", "m3", "set", "chiếc", "bao", "cây", "gói", "năm", "VC", "CT"];

const CATEGORY_OPTIONS = [
  "Chậu",
  "Cây & vật tư phụ",
  "Phụ kiện",
  "Hệ thống điện decor",
  "Xây/lát/ốp trát",
  "Đá cuội decor",
  "Hệ thống nước",
  "Vận chuyển + Công thợ",
  "Bảo hành/bảo dưỡng",
  "Thiết kế"
];

export function ItemDialog({ open, onOpenChange, item, onSave }: ItemDialogProps) {
  const [formData, setFormData] = useState<Item>({
    name: "",
    unit: "",
    price: 0,
    image: "/placeholder.svg",
    category: "",
  });
  const [priceDisplay, setPriceDisplay] = useState<string>("");

  useEffect(() => {
    if (item) {
      setFormData(item);
      setPriceDisplay(item.price > 0 ? formatNumberWithThousands(item.price) : "");
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
                <SelectContent>
                  {CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  <SelectContent>
                    {UNIT_OPTIONS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Hình ảnh</Label>
              <ImageUploadCrop
                currentImage={formData.image}
                onImageChange={(imageDataUrl) =>
                  setFormData({ ...formData, image: imageDataUrl })
                }
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
