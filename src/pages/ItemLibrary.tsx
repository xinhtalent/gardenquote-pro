import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Package, LayoutGrid, LayoutList, Settings } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { ItemDialog } from "@/components/ItemDialog";
import { LibrarySettingsDialog } from "@/components/LibrarySettingsDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { ItemImportExport } from "@/components/ItemImportExport";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useItems, useCategories, useUnits, useLibrarySettings, useDeleteItem, useCreateItem, useUpdateItem, Item, itemKeys } from "@/hooks/useItems";
import { useUserRole } from "@/hooks/useUserRole";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ItemLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Item | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const itemsPerPage = 12;
  const { scrollRef, isDragging } = useDragScroll();
  
  const queryClient = useQueryClient();

  // Use React Query hooks for automatic caching
  const { data: itemsData, isLoading: itemsLoading } = useItems();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { data: unitsData } = useUnits();
  const { data: librarySettingsData } = useLibrarySettings();
  const deleteItem = useDeleteItem();
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  const loading = itemsLoading || categoriesLoading;
  const items = itemsData || [];
  const units = unitsData || [];
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Get current user ID for permission checks
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);
  const libraryTitle = librarySettingsData?.library_title || "Thư viện Hạng mục";
  const libraryDescription = librarySettingsData?.library_description || "Quản lý các hạng mục sản phẩm và dịch vụ";
  
  // Add "all" to categories
  const categories = useMemo(() => {
    if (!categoriesData) return ["all"];
    return ["all", ...categoriesData];
  }, [categoriesData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  // Pagination
  const { totalPages, paginatedItems } = useMemo(() => {
    const total = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredItems.slice(startIndex, endIndex);
    return { totalPages: total, paginatedItems: paginated };
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset to page 1 when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

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

  const handleAddItem = () => {
    setEditingItem(undefined);
    setDialogOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDeleteClick = (item: Item) => {
    // Permission check before opening delete dialog
    if (!roleLoading && !isAdmin && item.user_id && item.user_id !== currentUserId) {
      console.log('[ItemLibrary] Delete permission denied:', {
        isAdmin,
        itemUserId: item.user_id,
        currentUserId,
        itemName: item.name
      });
      toast.error('Bạn không có quyền xóa hạng mục này. Chỉ admin hoặc người tạo mới có thể xóa.');
      return;
    }
    
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleSaveItem = async (item: Item) => {
    if (editingItem) {
      // Update existing item
      updateItem.mutate(
        {
          itemId: editingItem.id,
          updates: {
            name: item.name,
            unit: item.unit,
            price: item.price,
            image: item.image,
            category: item.category,
            mode: item.mode || 'standard',
            pot_type: item.pot_type || null
          }
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingItem(undefined);
          }
        }
      );
    } else {
      // Create new item
      createItem.mutate(
        {
          name: item.name,
          unit: item.unit,
          price: item.price,
          image: item.image,
          category: item.category,
          mode: item.mode || 'standard',
          pot_type: item.pot_type || null
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingItem(undefined);
          }
        }
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      deleteItem.mutate(deletingItem.id, {
        onSuccess: () => {
          // Component-level success handler
          setDeleteDialogOpen(false);
          setDeletingItem(undefined);
        },
        onError: (error: any) => {
          // Component-level error handler for better debugging
          console.error('[ItemLibrary] Delete failed:', error);
          setDeleteDialogOpen(false);
          setDeletingItem(undefined);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {libraryTitle}
          </h1>
          <p className="text-muted-foreground">
            {libraryDescription}
          </p>
        </div>

        {/* Search and Add */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Tìm kiếm hạng mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="h-8 w-8"
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            <ItemImportExport onImportComplete={async () => {
              // Invalidate items query to refetch after import
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                queryClient.invalidateQueries({ queryKey: itemKeys.all(user.id) });
              }
            }} />
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSettingsDialogOpen(true)}
              title="Quản lý thư viện"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button className="gap-2" onClick={handleAddItem}>
              <Plus className="w-5 h-5" />
              Thêm hạng mục mới
            </Button>
          </div>
        </div>

        {/* Category Tabs - Pinterest Style */}
        <div className="mb-8">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <div 
              ref={scrollRef}
              className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <TabsList className="inline-flex w-auto h-auto p-1 gap-2">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="whitespace-nowrap pointer-events-auto"
                    onClick={(e) => {
                      if (isDragging) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    {category === "all" ? "Tất cả" : category}
                    {category !== "all" && (
                      <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                        {items.filter(item => item.category === category).length}
                      </span>
                    )}
                    {category === "all" && (
                      <span className="ml-2 text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </div>

        {/* Items Grid */}
        {loading ? (
          <Card className="p-12 text-center col-span-full">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground text-lg">Đang tải...</p>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="p-12 text-center col-span-full">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {searchTerm ? "Không tìm thấy hạng mục phù hợp" : "Chưa có hạng mục nào"}
            </p>
          </Card>
        ) : (
          <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-medium transition-all duration-300">
                <div className="aspect-square bg-secondary relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    width={512}
                    height={512}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => handleEditItem(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => handleDeleteClick(item)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Đơn vị: {item.unit}
                    </span>
                    {item.mode === 'customizable' ? (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                        Tính theo công thức
                      </span>
                    ) : (
                      <span className="font-bold text-primary">
                        {formatCurrency(item.price)}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-medium transition-all duration-300">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {item.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1 truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Đơn vị: {item.unit}
                        </span>
                        {item.mode === 'customizable' ? (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            Tính theo công thức
                          </span>
                        ) : (
                          <span className="font-bold text-primary">
                            {formatCurrency(item.price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
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
          </>
        )}

        <ItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={editingItem}
          onSave={handleSaveItem}
          categories={categories}
          units={units}
        />

        <LibrarySettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          onUpdate={() => {
            fetchCategories();
            fetchUnits();
          }}
        />

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          itemName={deletingItem?.name || ""}
        />
      </div>
    </div>
  );
};

export default ItemLibrary;
