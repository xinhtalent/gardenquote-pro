import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface QuoteItem {
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  discount: number;
}

export default function CreateProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Step A: Customer
  const [phone, setPhone] = useState("");
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  
  // Step B: Quote & Project
  const [projectTitle, setProjectTitle] = useState("");
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    { description: "", qty: 1, unit: "bộ", unit_price: 0, discount: 0 }
  ]);
  const [loading, setLoading] = useState(false);

  // Auto-generate project title
  useEffect(() => {
    if (customerName) {
      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
      setProjectTitle(`Thi công – ${customerName} – ${dateStr}`);
    }
  }, [customerName]);

  // Search customer by phone with debounce
  useEffect(() => {
    if (phone.length < 3) {
      setExistingCustomer(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingCustomer(true);
      try {
        const normalizedPhone = phone.replace(/[^0-9]/g, '');
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .ilike("phone", `%${normalizedPhone}%`)
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        
        if (data) {
          setExistingCustomer(data);
          setCustomerName(data.name);
          setCustomerAddress(data.address || "");
        } else {
          setExistingCustomer(null);
        }
      } catch (error: any) {
        console.error("Error searching customer:", error);
      } finally {
        setSearchingCustomer(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [phone]);

  const addQuoteItem = () => {
    setQuoteItems([
      ...quoteItems,
      { description: "", qty: 1, unit: "bộ", unit_price: 0, discount: 0 }
    ]);
  };

  const removeQuoteItem = (index: number) => {
    if (quoteItems.length > 1) {
      setQuoteItems(quoteItems.filter((_, i) => i !== index));
    }
  };

  const updateQuoteItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...quoteItems];
    updated[index] = { ...updated[index], [field]: value };
    setQuoteItems(updated);
  };

  const calculateTotals = () => {
    const subtotal = quoteItems.reduce((sum, item) => {
      return sum + (item.qty * item.unit_price);
    }, 0);
    
    const discountTotal = quoteItems.reduce((sum, item) => {
      return sum + (item.discount || 0);
    }, 0);
    
    const grandTotal = subtotal - discountTotal;
    
    return { subtotal, discountTotal, grandTotal };
  };

  const handleSubmit = async () => {
    // Validation
    if (!phone || !customerName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin khách hàng",
        variant: "destructive",
      });
      return;
    }

    if (!projectTitle.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên dự án",
        variant: "destructive",
      });
      return;
    }

    if (quoteItems.some(item => !item.description.trim())) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mô tả cho tất cả các mục báo giá",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let customerId = existingCustomer?.id;

      // Create new customer if not exists
      if (!customerId) {
        const normalizedPhone = phone.replace(/[^0-9]/g, '');
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert([{
            name: customerName,
            phone: normalizedPhone,
            address: customerAddress,
            user_id: user?.id,
          }] as any)
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Create project
      const projectResult = await supabase
        .from("projects" as any)
        .insert([{
          customer_id: customerId,
          name: projectTitle,
          user_id: user?.id,
        }] as any)
        .select()
        .single();

      if (projectResult.error) throw projectResult.error;
      const project = projectResult.data as any;

      // Create quote
      const { subtotal, discountTotal, grandTotal } = calculateTotals();
      const { error: quoteError } = await supabase
        .from("quotes")
        .insert({
          project_id: project.id,
          items: quoteItems as any,
          subtotal,
          discount_total: discountTotal,
          grand_total: grandTotal,
          deposit_required: grandTotal * 0.3,
        } as any);

      if (quoteError) throw quoteError;

      toast({ title: "Tạo dự án thành công!" });
      navigate(`/dashboard`);
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo dự án",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, discountTotal, grandTotal } = calculateTotals();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Tạo Dự Án Mới</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        {/* Step A: Customer */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                A
              </span>
              Thông tin khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại *</Label>
              <div className="relative">
                <Input
                  id="phone"
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                />
                {searchingCustomer && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
                )}
              </div>
              {existingCustomer && (
                <p className="text-sm text-success">
                  ✓ Tìm thấy khách hàng: {existingCustomer.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Họ và tên *</Label>
              <Input
                id="customerName"
                placeholder="Nguyễn Văn A"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={!!existingCustomer}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">Địa chỉ</Label>
              <Input
                id="customerAddress"
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                disabled={!!existingCustomer}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step B: Quote & Project */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground text-sm font-bold">
                B
              </span>
              Báo giá & Dự án
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectTitle">Tên dự án *</Label>
              <Input
                id="projectTitle"
                placeholder="Thi công ban công..."
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Mục báo giá</h3>
                <Button size="sm" variant="outline" onClick={addQuoteItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm mục
                </Button>
              </div>

              {quoteItems.map((item, index) => (
                <Card key={index} className="p-4 space-y-3 border-dashed">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Mục {index + 1}
                    </span>
                    {quoteItems.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeQuoteItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Mô tả sản phẩm/dịch vụ"
                    value={item.description}
                    onChange={(e) => updateQuoteItem(index, "description", e.target.value)}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Số lượng</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateQuoteItem(index, "qty", parseFloat(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Đơn vị</Label>
                      <Input
                        placeholder="bộ, m²..."
                        value={item.unit}
                        onChange={(e) => updateQuoteItem(index, "unit", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Đơn giá (VNĐ)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateQuoteItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Chiết khấu (VNĐ)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.discount}
                        onChange={(e) => updateQuoteItem(index, "discount", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="text-right text-sm font-medium">
                    Thành tiền: {(item.qty * item.unit_price - (item.discount || 0)).toLocaleString('vi-VN')} VNĐ
                  </div>
                </Card>
              ))}
            </div>

            <Separator />

            <div className="space-y-2 bg-muted p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Tạm tính:</span>
                <span className="font-medium">{subtotal.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between text-sm text-destructive">
                <span>Chiết khấu:</span>
                <span className="font-medium">-{discountTotal.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-primary">{grandTotal.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Cọc yêu cầu (30%):</span>
                <span>{(grandTotal * 0.3).toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-lg" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-5 h-5 animate-spin" />}
              Lưu & Tạo dự án
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
