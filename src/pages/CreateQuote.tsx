import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Plus, Trash2, FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface QuoteItem {
  id: number;
  itemId: number;
  name: string;
  unit: string;
  quantity: number;
  price: number;
}

const CreateQuote = () => {
  const navigate = useNavigate();
  
  // Generate quote ID: XINH-DDMMYYXXX
  const generateQuoteId = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const sequence = String(Date.now()).slice(-3); // Use last 3 digits of timestamp as sequence
    return `XINH-${day}${month}${year}${sequence}`;
  };
  
  const [quoteId] = useState(generateQuoteId());
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [creatorPhone, setCreatorPhone] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [quantityDisplays, setQuantityDisplays] = useState<{[key: number]: string}>({});

  // Mock available items
  const availableItems = [
    { id: 1, name: "Cây xanh trang trí", unit: "cây", price: 500000 },
    { id: 2, name: "Gạch lát sân", unit: "m²", price: 350000 },
    { id: 3, name: "Chậu composite", unit: "chậu", price: 800000 },
    { id: 4, name: "Đất trồng dinh dưỡng", unit: "bao", price: 150000 },
  ];

  const addItem = (itemId: number) => {
    const item = availableItems.find(i => i.id === itemId);
    if (item) {
      setItems([...items, {
        id: Date.now(),
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        quantity: 1,
        price: item.price
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
    if (!customerName || items.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin khách hàng và thêm ít nhất một hạng mục");
      return;
    }
    toast.success("Báo giá đã được tạo thành công!");
    navigate("/");
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
                      <Label htmlFor="customerPhone">Số điện thoại</Label>
                      <Input
                        id="customerPhone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="0901234567"
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
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Chọn Hạng mục
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableItems.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant="outline"
                    className="justify-start gap-2 h-auto py-3"
                    onClick={() => addItem(item.id)}
                  >
                    <Plus className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(item.price)}/{item.unit}
                      </div>
                    </div>
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
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
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
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between items-center">
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
