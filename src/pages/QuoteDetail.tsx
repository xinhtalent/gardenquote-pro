import { useState, useEffect } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Printer, ArrowLeft, Pencil, Trash2, FileText } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDimension, formatThickness } from "@/lib/dimensionUtils";
import { formatNumber } from "@/lib/utils";

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<any>(null);
  const [quoteItems, setQuoteItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading) {
      fetchQuoteData();
    }
  }, [id, isAdmin, roleLoading]);

  const fetchQuoteData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;

      // Build query - Admin sees all quotes, agents see only their own
      let quoteQuery = supabase
        .from('quotes')
        .select(`
          *,
          customers (
            name,
            phone,
            address
          )
        `)
        .eq('id', id);

      // If not admin, filter by user_id
      if (!isAdmin) {
        quoteQuery = quoteQuery.eq('user_id', user.id);
      }

      const { data: quoteData, error: quoteError } = await quoteQuery.maybeSingle();

      if (quoteError) throw quoteError;
      setQuote(quoteData);

      // Fetch quote items with item details, ordered by category_order then item_order
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select(`
          *,
          items (
            name,
            unit,
            category,
            image_url,
            pot_type
          )
        `)
        .eq('quote_id', id)
        .order('category_order', { ascending: true, nullsFirst: false })
        .order('item_order', { ascending: true, nullsFirst: false });

      if (itemsError) throw itemsError;
      setQuoteItems(itemsData || []);

      // Fetch global settings for company info
      const { data: globalData } = await supabase
        .from('global_settings')
        .select('*')
        .maybeSingle();

      setGlobalSettings(globalData);

      // Fetch settings - use quote owner's settings for display
      const quoteOwnerId = quoteData?.user_id || user.id;
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', quoteOwnerId)
        .maybeSingle();

      setSettings(settingsData);
    } catch (error: any) {
      toast.error("Không thể tải thông tin báo giá");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/create-quote?edit=${id}`);
  };

  const handleDeleteConfirm = async () => {
    try {
      // Admin can delete any quote, no user_id filter needed (RLS handles it)
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(`Đã xóa báo giá #${id}`);
      navigate("/quotes");
    } catch (error: any) {
      toast.error("Không thể xóa báo giá");
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background flex items-center justify-center">
        <FileText className="w-12 h-12 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Không tìm thấy báo giá</p>
        </Card>
      </div>
    );
  }

  const subtotal = quoteItems.reduce((sum, item) => sum + Number(item.total_price), 0);
  
  // Read from new columns, fallback to parse from notes for old quotes
  let discount = quote.discount_percent ? Number(quote.discount_percent) : 0;
  let vat = quote.vat_percent ? Number(quote.vat_percent) : 0;

  // If both are null, try parsing from notes (backward compatibility)
  if (!discount && !vat && quote.notes) {
    const discountMatch = quote.notes.match(/Chiết khấu:\s*(\d+(?:\.\d+)?)/);
    const vatMatch = quote.notes.match(/VAT:\s*(\d+(?:\.\d+)?)/);
    if (discountMatch) discount = parseFloat(discountMatch[1]);
    if (vatMatch) vat = parseFloat(vatMatch[1]);
  }

  const discountAmount = discount ? (subtotal * discount) / 100 : 0;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = vat ? (afterDiscount * vat) / 100 : 0;
  const total = afterDiscount + vatAmount;

  // Use payment snapshot from quote first, fallback to settings for old quotes
  const bankInfo = {
    bankName: quote?.payment_bank_name || settings?.vietqr_bank_id || "MB",
    accountNumber: quote?.payment_account_number || settings?.vietqr_account_number || settings?.bank_account_number || "1234567890",
    accountName: quote?.payment_account_name || settings?.vietqr_account_name || settings?.bank_account_name || "CONG TY SAN VUON ABC",
    amount: Math.floor(total * 0.3),
  };

  const generateVietQR = () => {
    // Nội dung CK: [Mã BG]_dat_coc (VD: XINH-010625-01_dat_coc)
    const transferContent = `${quote.quote_code}_dat_coc`;
    return `https://img.vietqr.io/image/${bankInfo.bankName}-${bankInfo.accountNumber}-compact2.jpg?amount=${bankInfo.amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header - Hidden when printing */}
          <div className="mb-6 md:mb-8 print-hide">
            <div className="flex items-center gap-3 mb-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate('/quotes')}
                className="shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                Báo giá {quote.quote_code}
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-muted-foreground">
                Ngày tạo báo giá: {quote.date.split('-').reverse().join('/')}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" className="gap-2" onClick={handleEdit}>
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Sửa</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={() => navigate(`/create-quote?duplicate=${id}`)}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Tạo bản sao</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 text-destructive hover:text-destructive" 
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Xóa</span>
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">In/Tải PDF</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Quote Content */}
          <Card className="p-8 mb-6 print-content">
            {/* Company Header */}
            <div className="mb-8 pb-6 border-b border-border print-company-header print-no-break">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  {globalSettings?.company_logo_url ? (
                    <img
                      src={globalSettings.company_logo_url}
                      alt="Company Logo"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover flex-shrink-0 print-company-logo"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 print-company-logo">
                      <span className="text-3xl font-bold text-primary">
                        {globalSettings?.company_name?.substring(0, 2).toUpperCase() || "CX"}
                      </span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-primary mb-1">
                      {globalSettings?.company_name || "CÔNG TY CỦA BẠN"}
                    </h2>
                    {globalSettings?.company_tagline && (
                      <p className="text-sm text-muted-foreground">
                        {globalSettings.company_tagline}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col justify-center text-sm space-y-1">
                  {globalSettings?.company_contact && (
                    <p className="text-muted-foreground">
                      <strong>Hotline:</strong> {globalSettings.company_contact}
                    </p>
                  )}
                  {globalSettings?.company_email && (
                    <p className="text-muted-foreground">
                      <strong>Email:</strong> {globalSettings.company_email}
                    </p>
                  )}
                  {globalSettings?.company_website && (
                    <p className="text-muted-foreground">
                      <strong>Website:</strong> {globalSettings.company_website}
                    </p>
                  )}
                  {globalSettings?.company_tax_code && (
                    <p className="text-muted-foreground">
                      <strong>Mã số thuế:</strong> {globalSettings.company_tax_code}
                    </p>
                  )}
                  {globalSettings?.company_address && (
                    <p className="text-muted-foreground">
                      <strong>Địa chỉ:</strong> {globalSettings.company_address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Customer & Quote Info */}
            <div className="mb-6 print-customer-info print-no-break">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-1 h-5 bg-primary rounded print-color-bar-1"></span>
                    Thông tin Khách hàng
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tên khách hàng:</span>
                      <p className="font-semibold">{quote.customers?.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Số điện thoại:</span>
                      <p className="font-semibold">{quote.customers?.phone}</p>
                    </div>
                    {quote.customers?.address && (
                      <div>
                        <span className="text-muted-foreground">Địa chỉ:</span>
                        <p className="font-semibold">{quote.customers.address}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-1 h-5 bg-accent rounded print-color-bar-2"></span>
                    Thông tin Báo giá
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Mã báo giá:</span>
                      <p className="font-semibold text-primary">{quote.quote_code}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Người tạo:</span>
                      <p className="font-semibold">
                        {settings?.creator_name || "Chuyên viên tư vấn"}
                        {settings?.creator_position && (
                          <span className="text-muted-foreground font-normal"> - {settings.creator_position}</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Số điện thoại:</span>
                      <p className="font-semibold">{settings?.creator_phone || "0901234567"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3 print-table-title">
                Chi tiết Báo giá
              </h3>
              {/* Mobile: horizontal scroll wrapper */}
              <div className="border border-border rounded-lg overflow-x-auto print-table-wrapper">
                <table className="w-full min-w-[800px] print-table">
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
                    {/* Group items by category - already sorted by category_order from query */}
                      {(() => {
    // 1) Group items maintaining the order from database
    const grouped: Array<{category: string; items: any[]}> = [];
    const categoryMap = new Map<string, any[]>();
    
    quoteItems.forEach(item => {
      const category = item.items?.category || "Chưa phân loại";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
        grouped.push({ category, items: categoryMap.get(category)! });
      }
      categoryMap.get(category)!.push(item);
    });

    // 2) Biến đếm toàn cục cho STT
    let rowIndex = 0;

    // 3) Render - grouped already maintains category order
    return grouped.map(({category, items}, categoryIndex) => (
      <React.Fragment key={`category-${categoryIndex}`}>
        {/* Hàng tiêu đề danh mục */}
        <tr className="bg-primary/10 category-row">
          <td colSpan={7} className="px-4 py-2 font-semibold text-primary">
            {category}
          </td>
        </tr>

        {/* Các dòng hạng mục */}
        {items.map((item: any) => {
          rowIndex += 1;
          
          // Check if item has dimensions or variants
          const hasDimensions = item.dimension_1 && item.dimension_2;
          const hasVariants = item.variant_length || item.variant_width || item.variant_height || item.variant_thickness || item.variant_color;
          
          return (
            <React.Fragment key={item.id}>
              <tr className="border-t border-border">
                <td className="px-4 py-3">{rowIndex}</td>
                <td className="px-4 py-3">
                  <img
                    src={item.items?.image_url || "/placeholder.svg"}
                    alt={item.items?.name || ""}
                    loading="lazy"
                    decoding="async"
                    width={64}
                    height={64}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{item.items?.name}</div>
                  {hasDimensions && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Kích thước: {formatDimension(item.dimension_1, false)} × {formatDimension(item.dimension_2)} 
                    </div>
                  )}
                  {hasVariants && (
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="font-semibold">Thông số:</span>
                      {item.variant_length && <> Dài: {formatNumber(Number(item.variant_length))} cm</>}
                      {item.variant_width && <>, Rộng: {formatNumber(Number(item.variant_width))} cm</>}
                      {item.variant_height && <>, Cao: {formatNumber(Number(item.variant_height))} cm</>}
                      {item.variant_thickness && <>, Dày: {formatNumber(Number(item.variant_thickness))} mm</>}
                      {item.items?.pot_type === 'baki' && item.variant_layers && <>, Số tầng: {item.variant_layers}</>}
                      {item.variant_color && <>, Màu: {item.variant_color}</>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-center">{item.items?.unit}</td>
                <td className="px-4 py-3 text-center">{formatNumber(Number(item.quantity))}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(Number(item.unit_price))}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatCurrency(Number(item.total_price))}
                </td>
              </tr>
            </React.Fragment>
          );
        })}
      </React.Fragment>
    ));
  })()}
                  </tbody>
                  <tfoot className="bg-secondary/50">
                    <tr className="border-t border-border">
                      <td colSpan={6} className="px-4 py-3 text-right font-semibold">
                        Tạm tính:
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(subtotal)}
                      </td>
                    </tr>
                    
                    {discount > 0 && (
                      <tr className="border-t border-border">
                        <td colSpan={6} className="px-4 py-3 text-right text-muted-foreground">
                          Chiết khấu ({discount}%):
                        </td>
                        <td className="px-4 py-3 text-right text-destructive">
                          -{formatCurrency(discountAmount)}
                        </td>
                      </tr>
                    )}
                    
                    {vat > 0 && (
                      <tr className="border-t border-border">
                        <td colSpan={6} className="px-4 py-3 text-right text-muted-foreground">
                          VAT ({vat}%):
                        </td>
                        <td className="px-4 py-3 text-right text-green-600">
                          +{formatCurrency(vatAmount)}
                        </td>
                      </tr>
                    )}
                    
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

            {/* Payment Info + Notes Wrapper - Keep together when printing */}
            <div className="print-payment-notes-wrapper mt-8">
              {/* Payment Info with QR */}
              <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-border print-payment-section print-no-break">
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
                      width={192}
                      height={192}
                      className="w-48 h-48 mx-auto print-qr-code"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Quét mã để chuyển khoản nhanh
                  </p>
                </div>
              </div>

              {/* Notes */}
              {globalSettings?.quote_notes && (
                <div className="mt-6 p-4 bg-secondary/50 rounded-lg print-notes print-no-break">
                  <p className="text-sm text-muted-foreground">
                    <strong>Lưu ý:</strong> {globalSettings.quote_notes}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={`Báo giá ${quote.quote_code}`}
      />
    </div>
  );
};

export default QuoteDetail;
