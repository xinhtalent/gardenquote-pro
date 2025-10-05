import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Printer, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - sẽ thay bằng dữ liệu thực từ database
  const quote = {
    id: id,
    customerName: "Nguyễn Văn A",
    customerPhone: "0901234567",
    customerAddress: "123 Đường ABC, Quận 1, TP.HCM",
    createdBy: "Nguyễn Thị B",
    creatorPhone: "0912345678",
    date: "2025-10-05",
    items: [
      { 
        id: 1, 
        name: "Cây xanh trang trí", 
        unit: "cây", 
        quantity: 10, 
        price: 500000,
        image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=200&h=200&fit=crop"
      },
      { 
        id: 2, 
        name: "Gạch lát sân", 
        unit: "m²", 
        quantity: 50, 
        price: 350000,
        image: "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=200&h=200&fit=crop"
      },
      { 
        id: 3, 
        name: "Chậu composite", 
        unit: "chậu", 
        quantity: 5, 
        price: 800000,
        image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=200&h=200&fit=crop"
      },
    ],
  };

  const total = quote.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const bankInfo = {
    bankName: "Vietcombank",
    accountNumber: "1234567890",
    accountName: "CONG TY SAN VUON ABC",
    amount: Math.floor(total * 0.3), // 30% deposit
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Generate VietQR URL
  const generateVietQR = () => {
    const qrData = `${bankInfo.accountNumber}|${bankInfo.bankName}|${bankInfo.amount}|Dat coc ${quote.customerName}`;
    return `https://img.vietqr.io/image/${bankInfo.bankName}-${bankInfo.accountNumber}-compact2.png?amount=${bankInfo.amount}&addInfo=Dat%20coc%20${encodeURIComponent(quote.customerName)}`;
  };

  const handleDownloadPDF = () => {
    // Sẽ implement PDF generation
    alert("Tính năng xuất PDF đang được phát triển");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                Báo giá #{id}
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-muted-foreground">
                Ngày tạo: {new Date(quote.date).toLocaleDateString('vi-VN')}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 sm:flex-none gap-2">
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">In</span>
                </Button>
                <Button className="flex-1 sm:flex-none gap-2" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Tải PDF</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Quote Content */}
          <Card className="p-8 mb-6">
            {/* Company Header */}
            <div className="mb-8 pb-6 border-b border-border">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-bold text-primary">ABC</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-1">
                      CÔNG TY SÂN VƯỜN ABC
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Thiết kế & Thi công Ban công - Sân vườn
                    </p>
                  </div>
                </div>
                <div className="flex flex-col justify-center text-sm">
                  <p className="text-muted-foreground">
                    <strong>Hotline:</strong> 0901234567
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Email:</strong> contact@sanvuon.com
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Địa chỉ:</strong> 123 Đường ABC, TP.HCM
                  </p>
                </div>
              </div>
            </div>

            {/* Customer & Creator Info */}
            <div className="mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-1 h-5 bg-primary rounded"></span>
                    Thông tin Khách hàng
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tên khách hàng:</span>
                      <p className="font-semibold">{quote.customerName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Số điện thoại:</span>
                      <p className="font-semibold">{quote.customerPhone}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Địa chỉ:</span>
                      <p className="font-semibold">{quote.customerAddress}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-1 h-5 bg-accent rounded"></span>
                    Thông tin Báo giá
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Mã báo giá:</span>
                      <p className="font-semibold text-primary">#{id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Người tạo:</span>
                      <p className="font-semibold">{quote.createdBy}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Số điện thoại:</span>
                      <p className="font-semibold">{quote.creatorPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Chi tiết Báo giá
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">STT</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Hình ảnh</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Hạng mục</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Đơn vị</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Số lượng</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Đơn giá</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, index) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3">
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-center">{item.unit}</td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(item.quantity * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-secondary/50">
                    <tr className="border-t-2 border-primary">
                      <td colSpan={6} className="px-4 py-3 text-right font-bold text-lg">
                        Tổng cộng:
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-xl text-primary">
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payment Info with QR */}
            <div className="grid md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Thông tin Thanh toán
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngân hàng:</span>
                    <span className="font-semibold">{bankInfo.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tài khoản:</span>
                    <span className="font-semibold">{bankInfo.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chủ tài khoản:</span>
                    <span className="font-semibold">{bankInfo.accountName}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-muted-foreground">Tiền đặt cọc (30%):</span>
                    <span className="font-bold text-accent">
                      {formatCurrency(bankInfo.amount)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Quét mã QR để đặt cọc
                </h3>
                <div className="inline-block p-4 bg-white rounded-lg shadow-medium">
                  <img
                    src={generateVietQR()}
                    alt="VietQR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Quét mã để chuyển khoản nhanh
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Lưu ý:</strong> Báo giá có hiệu lực trong 30 ngày. 
                Vui lòng đặt cọc 30% để xác nhận đơn hàng. 
                Sau khi nhận được tiền cọc, chúng tôi sẽ liên hệ lại để xác nhận và triển khai thi công.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetail;
