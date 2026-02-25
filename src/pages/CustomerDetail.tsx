import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Phone, MapPin, FileText, User, Pencil, Trash2 } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { CustomerDialog } from "@/components/CustomerDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

const CustomerDetail = () => {
  const { phone: customerId } = useParams();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [customerQuotes, setCustomerQuotes] = useState<any[]>([]);
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading) {
      fetchCustomerData();
    }
  }, [customerId, isAdmin, roleLoading]);

  const fetchCustomerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !customerId) return;

      // Build query - Admin sees all customers, agents see only their own
      let customerQuery = supabase
        .from('customers')
        .select('*')
        .eq('id', customerId);

      // If not admin, filter by user_id
      if (!isAdmin) {
        customerQuery = customerQuery.eq('user_id', user.id);
      }

      const { data: customerData, error: customerError } = await customerQuery.maybeSingle();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch customer's quotes - Admin sees all, agents see only their own
      let quotesQuery = supabase
        .from('quotes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        quotesQuery = quotesQuery.eq('user_id', user.id);
      }

      const { data: quotesData, error: quotesError } = await quotesQuery;

      if (quotesError) throw quotesError;
      setCustomerQuotes(quotesData);
    } catch (error: any) {
      toast.error("Không thể tải thông tin khách hàng");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleSaveCustomer = async (customerData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !customerId) return;

      // Build update query - Admin can update any customer, agents only their own
      let updateQuery = supabase
        .from('customers')
        .update({
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
        })
        .eq('id', customerId);

      if (!isAdmin) {
        updateQuery = updateQuery.eq('user_id', user.id);
      }

      const { error } = await updateQuery;

      if (error) throw error;

      toast.success("Đã cập nhật thông tin khách hàng");
      await fetchCustomerData();
      setEditDialogOpen(false);
    } catch (error: any) {
      toast.error("Không thể cập nhật thông tin khách hàng");
      console.error(error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customer) return;
    
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id);

      if (error) throw error;

      toast.success(`Đã xóa khách hàng ${customer.name}`);
      navigate("/customers");
    } catch (error: any) {
      toast.error("Không thể xóa khách hàng");
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
        <User className="w-12 h-12 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Không tìm thấy khách hàng</p>
        </Card>
      </div>
    );
  }

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
                  {customer.address && (
                    <div className="flex items-start gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground min-w-[120px]">
                        <MapPin className="w-4 h-4" />
                        <span>Địa chỉ:</span>
                      </div>
                      <span className="font-semibold">{customer.address}</span>
                    </div>
                  )}
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
              {customerQuotes.length === 0 ? (
                <Card className="p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Chưa có báo giá nào</p>
                </Card>
              ) : (
                customerQuotes.map((quote) => (
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
                                {quote.quote_code}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(quote.date).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                          <p className="font-bold text-lg md:text-xl text-primary">
                            {formatCurrency(Number(quote.total_amount))}
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
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={customer?.name || ""}
      />

      <CustomerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        customer={customer ? {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address || "",
        } : undefined}
        onSave={handleSaveCustomer}
      />
    </div>
  );
};

export default CustomerDetail;
