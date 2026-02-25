import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Search, MoreVertical, Pencil, Trash2, CheckCircle, RotateCcw, Phone, Calendar, UserCheck } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { ConfirmPaymentDialog } from "@/components/ConfirmPaymentDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuotes, useUpdateQuoteStatus, useDeleteQuote } from "@/hooks/useQuotes";
import { toast } from "sonner";

const Quotes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmPaymentDialogOpen, setConfirmPaymentDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<{ id: string; name: string } | null>(null);
  const [selectedQuoteForPayment, setSelectedQuoteForPayment] = useState<{ id: string; code: string; date: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Use React Query hook for quotes with automatic caching and real-time updates
  const { data: quotesData, isLoading: loading } = useQuotes(isAdmin);
  const updateQuoteStatus = useUpdateQuoteStatus();
  const deleteQuote = useDeleteQuote();

  // Transform quotes data for display
  const quotes = useMemo(() => {
    if (!quotesData) return [];
    return quotesData.map(quote => ({
      id: quote.id,
      quoteCode: quote.quote_code,
      customerName: quote.customers?.name || '',
      customerPhone: quote.customers?.phone || '',
      date: quote.date,
      total: Number(quote.total_amount),
      status: quote.status,
      confirmedAt: quote.confirmed_at,
      user_id: quote.user_id,
      agent_name: quote.agent_name
    }));
  }, [quotesData]);

  const handleEdit = (quoteId: string) => {
    window.location.href = `/create-quote?edit=${quoteId}`;
  };

  const handleConfirmPaymentClick = (quoteId: string, quoteCode: string, quoteDate: string) => {
    setSelectedQuoteForPayment({ id: quoteId, code: quoteCode, date: quoteDate });
    setConfirmPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async (confirmedDate: Date) => {
    if (!selectedQuoteForPayment) return;

    updateQuoteStatus.mutate(
      { 
        quoteId: selectedQuoteForPayment.id, 
        status: 'confirmed',
        confirmedAt: confirmedDate.toISOString()
      },
      {
        onSuccess: () => {
          toast.success("Đã xác nhận thanh toán");
          setSelectedQuoteForPayment(null);
        }
      }
    );
  };

  const handleRollbackPayment = async (quoteId: string) => {
    updateQuoteStatus.mutate(
      { 
        quoteId, 
        status: 'pending',
        confirmedAt: null
      },
      {
        onSuccess: () => {
          toast.success("Đã hoàn tác trạng thái thanh toán");
        }
      }
    );
  };

  const handleDeleteClick = (quoteId: string, quoteName: string) => {
    setSelectedQuote({ id: quoteId, name: quoteName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedQuote) {
      deleteQuote.mutate(selectedQuote.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedQuote(null);
        }
      });
    }
  };

  const filteredQuotes = quotes.filter((quote) => {
    const query = searchQuery.toLowerCase();
    return (
      quote.customerName.toLowerCase().includes(query) ||
      quote.customerPhone.includes(query) ||
      quote.quoteCode.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuotes = filteredQuotes.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const calculateDaysRemaining = (quoteDate: string) => {
    const createDate = new Date(quoteDate);
    const today = new Date();
    const diffTime = 30 * 24 * 60 * 60 * 1000 - (today.getTime() - createDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
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
          {loading ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Đang tải...</p>
            </Card>
          ) : filteredQuotes.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Không tìm thấy báo giá phù hợp" : "Chưa có báo giá nào"}
              </p>
            </Card>
          ) : (
            paginatedQuotes.map((quote) => (
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
                          {isAdmin && quote.agent_name && (
                            <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              {quote.agent_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                          <Phone className="w-3 h-3" />
                          <p>{quote.customerPhone}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <p>{quote.date.split('-').reverse().join('/')}</p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                        <p className="font-bold text-lg md:text-xl text-primary">
                          {formatCurrency(quote.total)}
                        </p>
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                              quote.status === 'confirmed' 
                                ? 'bg-primary/20 text-primary' 
                                : quote.status === 'cancelled'
                                ? 'bg-destructive/20 text-destructive'
                                : 'bg-accent/20 text-accent'
                            }`}>
                              {quote.status === 'confirmed' ? 'Đã thanh toán' : quote.status === 'cancelled' ? 'Không hoàn tất' : 'Chờ thanh toán'}
                            </span>
                            {quote.status === 'confirmed' && quote.confirmedAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(quote.confirmedAt).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                            {quote.status === 'pending' && (
                              <span className="text-xs text-muted-foreground">
                                Còn {calculateDaysRemaining(quote.date)} ngày
                              </span>
                            )}
                          </div>
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
                      <DropdownMenuItem onClick={() => handleEdit(quote.id)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Sửa
                      </DropdownMenuItem>
                      {quote.status === 'pending' ? (
                        <DropdownMenuItem onClick={() => handleConfirmPaymentClick(quote.id, quote.quoteCode, quote.date)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Xác nhận thanh toán
                        </DropdownMenuItem>
                      ) : quote.status === 'confirmed' ? (
                        <DropdownMenuItem onClick={() => handleRollbackPayment(quote.id)}>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Hoàn tác thanh toán
                        </DropdownMenuItem>
                      ) : null}
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

        {/* Pagination */}
        {!loading && filteredQuotes.length > 0 && totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={selectedQuote?.name || ""}
      />

      <ConfirmPaymentDialog
        open={confirmPaymentDialogOpen}
        onOpenChange={setConfirmPaymentDialogOpen}
        onConfirm={handleConfirmPayment}
        quoteCode={selectedQuoteForPayment?.code || ""}
        quoteCreatedDate={selectedQuoteForPayment?.date || new Date().toISOString()}
      />
    </div>
  );
};

export default Quotes;
