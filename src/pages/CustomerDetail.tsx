import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Phone, MapPin, FileText, User, Pencil, Trash2 } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";

const CustomerDetail = () => {
  const { phone } = useParams();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleEdit = () => {
    toast.info("Chức năng sửa khách hàng đang được phát triển");
  };

  const handleDeleteConfirm = () => {
    toast.success(`Đã xóa khách hàng ${customer.name}`);
    setDeleteDialogOpen(false);
    navigate("/customers");
  };

  // Mock data - sẽ thay bằng dữ liệu thực từ database
  const customer = {
    phone: phone,
    name: "Nguyễn Văn A",
    address: "123 Đường ABC, Quận 1, TP.HCM",
  };

  const customerQuotes = [
    {
      id: 1,
      quoteCode: "XINH-011025-15",
      date: "2025-10-01",
      total: 25000000,
      status: "pending"
    },
    {
      id: 4,
      quoteCode: "XINH-071025-28",
      date: "2025-10-07",
      total: 18000000,
      status: "confirmed"
    },
    {
      id: 7,
      quoteCode: "XINH-091025-91",
      date: "2025-10-09",
      total: 32000000,
      status: "pending"
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigate("/customers")}
                  className="shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                  Chi tiết Khách hàng
                </h1>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={handleEdit}>
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Sửa</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 text-destructive hover:text-destructive" 
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Xóa</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Customer Info Card */}
          <Card className="p-6 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-4 bg-primary/10 rounded-xl shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {customer.name}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-[120px]">
                      <Phone className="w-4 h-4" />
                      <span>Số điện thoại:</span>
                    </div>
                    <span className="font-semibold">{customer.phone}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground min-w-[120px]">
                      <MapPin className="w-4 h-4" />
                      <span>Địa chỉ:</span>
                    </div>
                    <span className="font-semibold">{customer.address}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>Tổng số báo giá: <strong className="text-foreground">{customerQuotes.length}</strong></span>
              </div>
            </div>
          </Card>

          {/* Quotes List */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Danh sách Báo giá
            </h3>
            <div className="space-y-4">
              {customerQuotes.map((quote) => (
                <Link 
                  key={quote.id} 
                  to={`/quote/${quote.id}`}
                  className="block"
                >
                  <Card className="p-4 md:p-6 hover:shadow-medium transition-all duration-300 border-2 border-transparent hover:border-primary">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                          <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                              {quote.quoteCode}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(quote.date).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                        <p className="font-bold text-lg md:text-xl text-primary">
                          {formatCurrency(quote.total)}
                        </p>
                        <span className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                          quote.status === 'confirmed' 
                            ? 'bg-primary/20 text-primary' 
                            : 'bg-accent/20 text-accent'
                        }`}>
                          {quote.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={customer.name}
      />
    </div>
  );
};

export default CustomerDetail;
