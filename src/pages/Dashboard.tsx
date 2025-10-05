import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileText, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  // Mock data - sẽ thay bằng dữ liệu thực từ database
  const quotes = [
    {
      id: 1,
      customerName: "Nguyễn Văn A",
      date: "2025-10-01",
      total: 25000000,
      status: "pending"
    },
    {
      id: 2,
      customerName: "Trần Thị B",
      date: "2025-10-03",
      total: 45000000,
      status: "confirmed"
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Thiết kế & Thi công Ban công - Sân vườn
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(70000000)}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Khách hàng mới</p>
              <p className="text-3xl font-bold text-primary">
                {quotes.length}
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tỷ lệ chuyển đổi</p>
              <p className="text-3xl font-bold text-primary">
                50%
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Tổng khách hàng</p>
              <p className="text-3xl font-bold text-primary">
                2
              </p>
            </div>
          </Card>
        </div>

        {/* Recent Quotes */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Báo giá gần đây</h2>
            <Button variant="outline" size="sm">
              Xem tất cả
            </Button>
          </div>

          <div className="space-y-4">
            {quotes.map((quote) => (
              <Link 
                key={quote.id} 
                to={`/quote/${quote.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {quote.customerName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(quote.date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">
                      {formatCurrency(quote.total)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      quote.status === 'confirmed' 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-accent/20 text-accent'
                    }`}>
                      {quote.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Floating Action Button */}
      <Link to="/create-quote">
        <Button 
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  );
};

export default Dashboard;
