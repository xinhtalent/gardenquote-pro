import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Search, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";

const Quotes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<{ id: number; name: string } | null>(null);

  const handleEdit = (quoteId: number, quoteName: string) => {
    toast.info("Chức năng sửa báo giá đang được phát triển");
    console.log("Edit quote:", quoteId);
  };

  const handleDeleteClick = (quoteId: number, quoteName: string) => {
    setSelectedQuote({ id: quoteId, name: quoteName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedQuote) {
      toast.success(`Đã xóa báo giá ${selectedQuote.name}`);
      console.log("Delete quote:", selectedQuote.id);
      setDeleteDialogOpen(false);
      setSelectedQuote(null);
    }
  };

  // Mock data - sẽ thay bằng dữ liệu thực từ database
  const allQuotes = [
    {
      id: 1,
      quoteCode: "XINH-011025-15",
      customerName: "Nguyễn Văn A",
      customerPhone: "0912345678",
      date: "2025-10-01",
      total: 25000000,
      status: "pending"
    },
    {
      id: 2,
      quoteCode: "XINH-031025-42",
      customerName: "Trần Thị B",
      customerPhone: "0987654321",
      date: "2025-10-03",
      total: 45000000,
      status: "confirmed"
    },
    {
      id: 3,
      quoteCode: "XINH-051025-73",
      customerName: "Lê Văn C",
      customerPhone: "0901234567",
      date: "2025-10-05",
      total: 35000000,
      status: "pending"
    },
  ];

  const filteredQuotes = allQuotes.filter((quote) => {
    const query = searchQuery.toLowerCase();
    return (
      quote.customerName.toLowerCase().includes(query) ||
      quote.customerPhone.includes(query) ||
      quote.quoteCode.toLowerCase().includes(query)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header with Create Button */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Danh sách Báo giá
              </h1>
              <p className="text-muted-foreground">
                Quản lý và theo dõi tất cả báo giá
              </p>
            </div>
            <Link to="/create-quote">
              <Button size="lg" className="w-full sm:w-auto shadow-medium hover:shadow-large transition-all">
                <Plus className="w-5 h-5 mr-2" />
                Tạo báo giá mới
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên khách hàng, số điện thoại hoặc mã báo giá..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Quotes List */}
        <div className="space-y-4">
          {filteredQuotes.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Không tìm thấy báo giá phù hợp" : "Chưa có báo giá nào"}
              </p>
            </Card>
          ) : (
            filteredQuotes.map((quote) => (
              <Card key={quote.id} className="p-4 md:p-6 hover:shadow-medium transition-all duration-300 border-2 border-transparent hover:border-primary">
                <div className="flex items-start gap-4">
                  <Link 
                    to={`/quote/${quote.id}`}
                    className="flex items-start gap-4 flex-1 min-w-0"
                  >
                    <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                      <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-1 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-foreground">
                            {quote.customerName}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                            {quote.quoteCode}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {quote.customerPhone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(quote.date).toLocaleDateString('vi-VN')}
                        </p>
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
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(quote.id, quote.quoteCode)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(quote.id, quote.quoteCode)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={selectedQuote?.name || ""}
      />
    </div>
  );
};

export default Quotes;
