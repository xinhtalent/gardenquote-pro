import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Plus, Trash2, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuoteItem {
  id: number;
  itemId: number;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  category?: string;
}

const CreateQuote = () => {
  const navigate = useNavigate();
  
  // Generate quote ID: XINH-ddmmyy-xx
  const generateQuoteId = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const randomNum = String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
    return `XINH-${day}${month}${year}-${randomNum}`;
  };
  
  const [quoteId] = useState(generateQuoteId());
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  
  // Load thông tin người tạo từ Settings (mock - sẽ load từ database)
  const [creatorName, setCreatorName] = useState("Nguyễn Thị B");
  const [creatorPhone, setCreatorPhone] = useState("0912345678");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [quantityDisplays, setQuantityDisplays] = useState<{[key: number]: string}>({});
  const [discount, setDiscount] = useState("");
  const [vat, setVat] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Mock available items
  const availableItems = [
    { id: 1, name: "Cây xanh trang trí", unit: "cây", price: 500000, category: "Cây & vật tư phụ", imageUrl: "https://images.unsplash.com/photo-1463320898484-cdee8141c787?w=100&h=100&fit=crop" },
    { id: 2, name: "Gạch lát sân", unit: "m²", price: 350000, category: "Xây/lát/ốp trát", imageUrl: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=100&h=100&fit=crop" },
    { id: 3, name: "Chậu composite", unit: "chậu", price: 800000, category: "Chậu", imageUrl: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=100&h=100&fit=crop" },
    { id: 4, name: "Đất trồng dinh dưỡng", unit: "bao", price: 150000, category: "Cây & vật tư phụ", imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=100&h=100&fit=crop" },
  ];

  // Get unique categories
  const categories = Array.from(new Set(availableItems.map(item => item.category)));

  // Filter items by selected category
  const filteredAvailableItems = selectedCategory === "all" 
    ? availableItems 
    : availableItems.filter(item => item.category === selectedCategory);

  const addItem = (itemId: number) => {
    const item = availableItems.find(i => i.id === itemId);
    if (item) {
      setItems([...items, {
        id: Date.now(),
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        quantity: 1,
        price: item.price,
        category: item.category
      }]);
    }
  };

  const updateQuantity = (id: number, value: string) => {
    // Update display value immediately to keep decimal point
    setQuantityDisplays(prev => ({
      ...prev,
      [id]: value
    }));

    setItems(items.map(item => {
      if (item.id === id) {
        // Allow empty string
        if (value === "") {
          return { ...item, quantity: 0 };
        }
        // Remove leading zeros but keep decimal numbers
        const cleanValue = value.replace(/^0+(?=\d)/, '');
        const numValue = parseFloat(cleanValue);
        // Only update if it's a valid number
        if (!isNaN(numValue) && numValue >= 0) {
          return { ...item, quantity: numValue };
        }
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
    // Clean up display value when removing item
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone || items.length === 0) {
      toast.error("Vui lòng điền số điện thoại khách hàng và thêm ít nhất một hạng mục");
      return;
    }
    toast.success("Báo giá đã được tạo thành công!");
    navigate("/quotes");
  };

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
            Tạo Báo giá Mới
          </h1>
          <p className="text-muted-foreground">
            Điền thông tin khách hàng và chọn hạng mục
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Quote ID & Info */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="text-sm text-muted-foreground">Mã báo giá</h3>
                  <p className="text-2xl font-bold text-primary">{quoteId}</p>
                </div>
              </div>
            </Card>

            {/* Customer & Creator Info */}
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary rounded"></span>
                    Thông tin Khách hàng
                  </h2>
                  <div className="space-y-3">
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
                    <div>
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

                <div>
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-accent rounded"></span>
                    Người tạo báo giá
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="creatorName">Tên chuyên viên *</Label>
                      <Input
                        id="creatorName"
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        placeholder="Nguyễn Thị B"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="creatorPhone">Số điện thoại *</Label>
                      <Input
                        id="creatorPhone"
                        value={creatorPhone}
                        onChange={(e) => setCreatorPhone(e.target.value)}
                        placeholder="0912345678"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Available Items */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">
                  Chọn Hạng mục
                </h2>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredAvailableItems.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant="outline"
                    className="justify-start gap-3 h-auto py-2 px-3"
                    onClick={() => addItem(item.id)}
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded border border-border"
                    />
                    <div className="flex-1 text-left">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(item.price)}/{item.unit}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-primary" />
                  </Button>
                ))}
              </div>
            </Card>

            {/* Selected Items */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Hạng mục đã chọn
              </h2>
              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có hạng mục nào được chọn</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group items by category */}
                  {Object.entries(
                    items.reduce((acc, item) => {
                      const category = item.category || "Chưa phân loại";
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(item);
                      return acc;
                    }, {} as Record<string, QuoteItem[]>)
                  ).map(([category, categoryItems]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-primary mb-3 pb-2 border-b border-primary/20">
                        {category}
                      </h3>
                      <div className="space-y-3">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 border border-border rounded-lg"
                          >
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(item.price)}/{item.unit}
                              </p>
                            </div>
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
                              <span className="text-sm text-muted-foreground min-w-[40px]">
                                {item.unit}
                              </span>
                            </div>
                            <div className="font-bold text-primary min-w-[120px] text-right">
                              {formatCurrency(item.quantity * item.price)}
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Tổng quan
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Số hạng mục:</span>
                  <span className="font-semibold">{items.length}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tổng số lượng:</span>
                  <span className="font-semibold">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="border-t border-border pt-3 mt-3 space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tạm tính:</span>
                    <span className="font-semibold">
                      {formatCurrency(getSubtotal())}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="text-sm">Chiết khấu (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      className="h-9"
                    />
                  </div>

                  {discount && parseFloat(discount) > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Giảm giá ({discount}%):</span>
                      <span>-{formatCurrency((getSubtotal() * parseFloat(discount)) / 100)}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="vat" className="text-sm">VAT (%)</Label>
                    <Input
                      id="vat"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={vat}
                      onChange={(e) => setVat(e.target.value)}
                      placeholder="0"
                      className="h-9"
                    />
                  </div>

                  {vat && parseFloat(vat) > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>VAT ({vat}%):</span>
                      <span>
                        +{formatCurrency(((getSubtotal() - (discount ? (getSubtotal() * parseFloat(discount)) / 100 : 0)) * parseFloat(vat)) / 100)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-lg font-semibold text-foreground">
                      Tổng cộng:
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full mt-6" size="lg">
                Tạo báo giá
              </Button>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuote;
