import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search, Phone, MapPin, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { toast } from "sonner";

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ phone: string; name: string } | null>(null);

  const handleEdit = (phone: string, name: string) => {
    toast.info("Chức năng sửa khách hàng đang được phát triển");
    console.log("Edit customer:", phone);
  };

  const handleDeleteClick = (phone: string, name: string) => {
    setSelectedCustomer({ phone, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedCustomer) {
      toast.success(`Đã xóa khách hàng ${selectedCustomer.name}`);
      console.log("Delete customer:", selectedCustomer.phone);
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
    }
  };

  // Mock data - trích xuất từ báo giá
  const allCustomers = [
    {
      phone: "0912345678",
      name: "Nguyễn Văn A",
      address: "123 Đường ABC, Quận 1, TP.HCM",
      quoteCount: 3,
    },
    {
      phone: "0987654321",
      name: "Trần Thị B",
      address: "456 Đường XYZ, Quận 2, TP.HCM",
      quoteCount: 1,
    },
    {
      phone: "0901234567",
      name: "Lê Văn C",
      address: "789 Đường DEF, Quận 3, TP.HCM",
      quoteCount: 2,
    },
  ];

  const filteredCustomers = allCustomers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.address.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Danh sách Khách hàng
            </h1>
            <p className="text-muted-foreground">
              Quản lý thông tin khách hàng từ báo giá
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên, số điện thoại hoặc địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>

        {/* Customers List */}
        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Không tìm thấy khách hàng phù hợp" : "Chưa có khách hàng nào"}
              </p>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer.phone} className="p-4 md:p-6 hover:shadow-medium transition-all duration-300 border-2 border-transparent hover:border-primary">
                <div className="flex items-start gap-4">
                  <Link 
                    to={`/customer/${customer.phone}`}
                    className="flex items-start gap-4 flex-1 min-w-0"
                  >
                    <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                      <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-1 min-w-0">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-lg text-foreground mb-2">
                          {customer.name}
                        </h3>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{customer.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{customer.address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent whitespace-nowrap">
                          {customer.quoteCount} báo giá
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
                      <DropdownMenuItem onClick={() => handleEdit(customer.phone, customer.name)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(customer.phone, customer.name)}
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
        itemName={selectedCustomer?.name || ""}
      />
    </div>
  );
};

export default Customers;
