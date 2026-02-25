import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search, Phone, MapPin, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
import { CustomerDialog } from "@/components/CustomerDialog";
import { AssignAgentDialog } from "@/components/AssignAgentDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { useCustomers, useUpdateCustomer, useDeleteCustomer, CustomerWithStats } from "@/hooks/useCustomers";
import { UserCheck } from "lucide-react";

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [assigningCustomer, setAssigningCustomer] = useState<{ id: string; name: string; agentId: string } | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithStats | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Use React Query hooks with automatic caching and real-time updates
  const { data: customersData, isLoading: loading } = useCustomers(isAdmin);
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  // Transform customers data for display
  const customers = useMemo(() => {
    if (!customersData) return [];
    return customersData;
  }, [customersData]);

  const handleEdit = (customer: CustomerWithStats) => {
    setEditingCustomer(customer);
    setEditDialogOpen(true);
  };

  const handleSaveCustomer = async (customerData: any) => {
    if (editingCustomer?.id) {
      updateCustomer.mutate(
        {
          customerId: editingCustomer.id,
          updates: {
            name: customerData.name,
            phone: customerData.phone,
            address: customerData.address,
          },
          isAdmin
        },
        {
          onSuccess: () => {
            setEditDialogOpen(false);
            setEditingCustomer(undefined);
          }
        }
      );
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setSelectedCustomer({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleAssignClick = (customer: CustomerWithStats) => {
    setAssigningCustomer({ 
      id: customer.id, 
      name: customer.name,
      agentId: customer.user_id 
    });
    setAssignDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedCustomer) {
      deleteCustomer.mutate(selectedCustomer.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedCustomer(null);
        }
      });
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      (customer.address && customer.address.toLowerCase().includes(query))
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

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
          {loading ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Đang tải...</p>
            </Card>
          ) : filteredCustomers.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Không tìm thấy khách hàng phù hợp" : "Chưa có khách hàng nào"}
              </p>
            </Card>
          ) : (
            paginatedCustomers.map((customer) => (
              <Card key={customer.id} className="p-4 md:p-6 hover:shadow-medium transition-all duration-300 border-2 border-transparent hover:border-primary">
                <div className="flex items-start gap-4">
                  <Link 
                    to={`/customer/${customer.id}`}
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
                          {customer.address && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              <span className="line-clamp-1">{customer.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                       <div className="flex flex-col gap-2">
                         <span className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent whitespace-nowrap">
                           {customer.quoteCount} báo giá
                         </span>
                          {isAdmin && customer.agent_name && (
                            <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              {customer.agent_name}
                            </span>
                          )}
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
                       {isAdmin && (
                         <DropdownMenuItem onClick={() => handleAssignClick(customer)}>
                           <UserCheck className="w-4 h-4 mr-2" />
                           Chỉ định cộng tác viên
                         </DropdownMenuItem>
                       )}
                       <DropdownMenuItem onClick={() => handleEdit(customer)}>
                         <Pencil className="w-4 h-4 mr-2" />
                         Sửa
                       </DropdownMenuItem>
                       <DropdownMenuItem 
                         onClick={() => handleDeleteClick(customer.id, customer.name)}
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
        {!loading && filteredCustomers.length > 0 && totalPages > 1 && (
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
        itemName={selectedCustomer?.name || ""}
      />

      <CustomerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
      />

      {assigningCustomer && (
        <AssignAgentDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          customerId={assigningCustomer.id}
          customerName={assigningCustomer.name}
          currentAgentId={assigningCustomer.agentId}
          onAssigned={() => {}}
        />
      )}
    </div>
  );
};

export default Customers;
