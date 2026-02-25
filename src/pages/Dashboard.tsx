import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, DollarSign, UserPlus, TrendingUp, TrendingDown, Users, MoreVertical, Pencil, CheckCircle, RotateCcw, Trash2, Phone, Calendar, Receipt, UserCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useCelebrationFirework } from "@/components/CelebrationFirework";
import { useDashboardStats, useRecentQuotes, usePaymentEmojis } from "@/hooks/useDashboard";
import { useUpdateQuoteStatus, useDeleteQuote } from "@/hooks/useQuotes";

const Dashboard = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<{ id: string; code: string } | null>(null);
  
  // Use React Query hooks for automatic caching and real-time updates
  const { data: stats, isLoading: statsLoading } = useDashboardStats(isAdmin);
  const { data: recentQuotesData, isLoading: quotesLoading } = useRecentQuotes(isAdmin);
  const { data: paymentEmojis } = usePaymentEmojis();
  const updateQuoteStatus = useUpdateQuoteStatus();
  const deleteQuote = useDeleteQuote();
  
  const loading = statsLoading || quotesLoading || roleLoading;
  const recentQuotes = recentQuotesData || [];
  const { trigger: triggerCelebration, FireworkContainer } = useCelebrationFirework(paymentEmojis || ["❤️","🩷","🧡","💛","🍷","🥂","🍾"]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatCurrencyShort = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleEdit = (quoteId: string) => {
    navigate(`/create-quote?edit=${quoteId}`);
  };

  const handleConfirmPayment = async (quoteId: string) => {
    updateQuoteStatus.mutate(
      { quoteId, status: 'confirmed' },
      {
        onSuccess: () => {
          triggerCelebration();
        }
      }
    );
  };

  const handleRollbackPayment = async (quoteId: string) => {
    updateQuoteStatus.mutate(
      { quoteId, status: 'pending', confirmedAt: null }
    );
  };

  const handleDeleteClick = (quoteId: string, quoteCode: string) => {
    setQuoteToDelete({ id: quoteId, code: quoteCode });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quoteToDelete) return;

    deleteQuote.mutate(quoteToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setQuoteToDelete(null);
      }
    });
  };

  return (
    <>
      {FireworkContainer}
      <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background pb-20">
        <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="p-5 hover:shadow-lg transition-all duration-300 animate-fade-in overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-2">Doanh thu (30 ngày)</p>
                <p className="text-2xl md:text-3xl font-bold text-primary truncate">
                  {formatCurrencyShort(stats?.totalRevenue || 0)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {(stats?.totalRevenueChange || 0) >= 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-500">+{stats?.totalRevenueChange || 0}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-500">{stats?.totalRevenueChange || 0}%</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">vs tháng trước</span>
                </div>
              </div>
              <div className="flex-shrink-0 p-3 bg-emerald-500/10 rounded-xl">
                <DollarSign className="w-7 h-7 text-emerald-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5 hover:shadow-lg transition-all duration-300 animate-fade-in overflow-hidden" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-2">Tổng báo giá (30 ngày)</p>
                <p className="text-2xl md:text-3xl font-bold text-accent truncate">
                  {formatCurrencyShort(stats?.newCustomers || 0)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {(stats?.newCustomersChange || 0) >= 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-500">+{stats?.newCustomersChange || 0}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-500">{stats?.newCustomersChange || 0}%</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">vs tháng trước</span>
                </div>
              </div>
              <div className="flex-shrink-0 p-3 bg-blue-500/10 rounded-xl">
                <Receipt className="w-7 h-7 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5 hover:shadow-lg transition-all duration-300 animate-fade-in overflow-hidden" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-2">Tỷ lệ chuyển đổi</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {stats?.conversionRate || 0}%
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {(stats?.conversionRateChange || 0) >= 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-500">+{stats?.conversionRateChange || 0}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-500">{stats?.conversionRateChange || 0}%</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">vs tháng trước</span>
                </div>
              </div>
              <div className="flex-shrink-0 p-3 bg-amber-500/10 rounded-xl">
                <TrendingUp className="w-7 h-7 text-amber-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5 hover:shadow-lg transition-all duration-300 animate-fade-in overflow-hidden" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-2">Tổng khách hàng</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {stats?.totalCustomers || 0}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {(stats?.totalCustomersChange || 0) >= 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-500">+{stats?.totalCustomersChange || 0}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-500">{stats?.totalCustomersChange || 0}%</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">vs tháng trước</span>
                </div>
              </div>
              <div className="flex-shrink-0 p-3 bg-purple-500/10 rounded-xl">
                <Users className="w-7 h-7 text-purple-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Quotes */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Báo giá gần đây</h2>
            <Link to="/quotes">
              <Button variant="outline" size="sm">
                Xem tất cả
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            ) : recentQuotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Chưa có báo giá nào</p>
              </div>
            ) : (
              recentQuotes.map((quote) => (
                <Card key={quote.id} className="p-4 hover:shadow-medium transition-all duration-300 border-2 border-transparent hover:border-primary">
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
                            <p>{new Date(quote.createdAt).toLocaleDateString('vi-VN')}</p>
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
                              {quote.status === 'confirmed' 
                                ? 'Đã thanh toán'
                                : quote.status === 'cancelled' 
                                ? 'Đã hủy' 
                                : 'Chờ thanh toán'}
                            </span>
                            {quote.status === 'confirmed' && quote.confirmedAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(quote.confirmedAt).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                            {quote.status === 'pending' && (
                              <span className="text-xs text-muted-foreground">
                                Còn {Math.max(0, 30 - Math.floor((Date.now() - new Date(quote.createdAt).getTime()) / (1000 * 60 * 60 * 24)))} ngày
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
                          <DropdownMenuItem onClick={() => handleConfirmPayment(quote.id)}>
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
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={quoteToDelete?.code || ''}
      />
      </div>
    </>
  );
};

export default Dashboard;
