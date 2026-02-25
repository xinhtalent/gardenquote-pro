import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LibrarySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function LibrarySettingsDialog({ open, onOpenChange, onUpdate }: LibrarySettingsDialogProps) {
  const [categories, setCategories] = useState<Array<{ id: string; name: string; display_order: number }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [unitDialog, setUnitDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; display_order: number } | null>(null);
  const [editingUnit, setEditingUnit] = useState<{ id: string; name: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [libraryTitle, setLibraryTitle] = useState("Thư viện Hạng mục");
  const [libraryDescription, setLibraryDescription] = useState("Quản lý các hạng mục sản phẩm và dịch vụ");
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string } | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (open) {
      fetchCategoriesAndUnits();
      fetchLibrarySettings();
    }
  }, [open]);

  const fetchLibrarySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('library_title, library_description')
        .single();

      if (error) throw error;
      
      if (data) {
        setLibraryTitle(data.library_title || "Thư viện Hạng mục");
        setLibraryDescription(data.library_description || "Quản lý các hạng mục sản phẩm và dịch vụ");
      }
    } catch (error) {
      console.error('Error fetching library settings:', error);
    }
  };

  const fetchCategoriesAndUnits = async () => {
    try {
      const [categoriesRes, unitsRes] = await Promise.all([
        supabase.from('categories').select('*').order('display_order', { ascending: true }),
        supabase.from('units').select('*').order('name', { ascending: true })
      ]);

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      if (unitsRes.data) {
        setUnits(unitsRes.data);
      }
    } catch (error) {
      console.error('Error fetching categories and units:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      const maxOrder = Math.max(...categories.map(c => c.display_order), 0);
      const { error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName, display_order: maxOrder + 1 }]);

      if (error) throw error;
      
      toast.success("Đã thêm danh mục");
      setNewCategoryName("");
      setCategoryDialog(false);
      fetchCategoriesAndUnits();
      onUpdate();
    } catch (error: any) {
      console.error('Error adding category:', error);
      if (error.code === '23505') {
        toast.error("Danh mục này đã tồn tại");
      } else {
        toast.error("Không thể thêm danh mục");
      }
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editingCategory.name })
        .eq('id', editingCategory.id);

      if (error) throw error;
      
      toast.success("Đã cập nhật danh mục");
      setEditingCategory(null);
      setCategoryDialog(false);
      fetchCategoriesAndUnits();
      onUpdate();
    } catch (error: any) {
      console.error('Error updating category:', error);
      if (error.code === '23505') {
        toast.error("Danh mục này đã tồn tại");
      } else {
        toast.error("Không thể cập nhật danh mục");
      }
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deletingCategory.id);

      if (error) {
        console.error('Error deleting category:', error);
        toast.error(error.message || "Không thể xóa danh mục. Vui lòng kiểm tra quyền truy cập.");
        return;
      }
      
      toast.success("Đã xóa danh mục");
      setDeletingCategory(null);
      fetchCategoriesAndUnits();
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || "Không thể xóa danh mục");
    }
  };

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) {
      toast.error("Vui lòng nhập tên đơn vị");
      return;
    }

    try {
      const { error } = await supabase
        .from('units')
        .insert([{ name: newUnitName }]);

      if (error) throw error;
      
      toast.success("Đã thêm đơn vị");
      setNewUnitName("");
      setUnitDialog(false);
      fetchCategoriesAndUnits();
      onUpdate();
    } catch (error: any) {
      console.error('Error adding unit:', error);
      if (error.code === '23505') {
        toast.error("Đơn vị này đã tồn tại");
      } else {
        toast.error("Không thể thêm đơn vị");
      }
    }
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit || !editingUnit.name.trim()) {
      toast.error("Vui lòng nhập tên đơn vị");
      return;
    }

    try {
      const { error } = await supabase
        .from('units')
        .update({ name: editingUnit.name })
        .eq('id', editingUnit.id);

      if (error) throw error;
      
      toast.success("Đã cập nhật đơn vị");
      setEditingUnit(null);
      setUnitDialog(false);
      fetchCategoriesAndUnits();
      onUpdate();
    } catch (error: any) {
      console.error('Error updating unit:', error);
      if (error.code === '23505') {
        toast.error("Đơn vị này đã tồn tại");
      } else {
        toast.error("Không thể cập nhật đơn vị");
      }
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;

    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', deletingUnit.id);

      if (error) {
        console.error('Error deleting unit:', error);
        toast.error(error.message || "Không thể xóa đơn vị. Vui lòng kiểm tra quyền truy cập.");
        return;
      }
      
      toast.success("Đã xóa đơn vị");
      setDeletingUnit(null);
      fetchCategoriesAndUnits();
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting unit:', error);
      toast.error(error.message || "Không thể xóa đơn vị");
    }
  };

  const handleSaveLibrarySettings = async () => {
    try {
      const { error } = await supabase
        .from('global_settings')
        .update({
          library_title: libraryTitle,
          library_description: libraryDescription,
        })
        .eq('id', (await supabase.from('global_settings').select('id').single()).data?.id);

      if (error) throw error;
      
      toast.success("Đã cập nhật cài đặt thư viện");
      onUpdate();
    } catch (error) {
      console.error('Error saving library settings:', error);
      toast.error("Không thể lưu cài đặt");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = categories.findIndex((cat) => cat.id === active.id);
    const newIndex = categories.findIndex((cat) => cat.id === over.id);

    const newCategories = arrayMove(categories, oldIndex, newIndex);
    
    // Update display_order for all categories
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      display_order: index
    }));

    setCategories(updatedCategories);

    // Save to database
    try {
      const updates = updatedCategories.map((cat) => 
        supabase
          .from('categories')
          .update({ display_order: cat.display_order })
          .eq('id', cat.id)
      );

      await Promise.all(updates);
      toast.success("Đã cập nhật thứ tự danh mục");
      onUpdate();
    } catch (error) {
      console.error('Error updating category order:', error);
      toast.error("Không thể cập nhật thứ tự");
      fetchCategoriesAndUnits(); // Revert on error
    }
  };

interface SortableCategoryItemProps {
  category: { id: string; name: string; display_order: number };
  onEdit: () => void;
  onDelete: () => void;
}

function SortableCategoryItem({ category, onEdit, onDelete }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="font-medium">{category.name}</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Quản lý thư viện hạng mục</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Library Settings */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Cài đặt hiển thị</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="libraryTitle">Tiêu đề trang</Label>
                  <Input
                    id="libraryTitle"
                    value={libraryTitle}
                    onChange={(e) => setLibraryTitle(e.target.value)}
                    placeholder="Thư viện Hạng mục"
                  />
                </div>
                <div>
                  <Label htmlFor="libraryDescription">Mô tả trang</Label>
                  <Input
                    id="libraryDescription"
                    value={libraryDescription}
                    onChange={(e) => setLibraryDescription(e.target.value)}
                    placeholder="Quản lý các hạng mục sản phẩm và dịch vụ"
                  />
                </div>
                <Button onClick={handleSaveLibrarySettings} className="w-full">
                  Lưu cài đặt
                </Button>
              </div>
            </Card>

            {/* Categories Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Danh mục hạng mục</h3>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategoryName("");
                    setCategoryDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm danh mục
                </Button>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        onEdit={() => {
                          setEditingCategory(category);
                          setCategoryDialog(true);
                        }}
                        onDelete={() => setDeletingCategory({ id: category.id, name: category.name })}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </Card>

            {/* Units Section */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Đơn vị tính</h3>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingUnit(null);
                    setNewUnitName("");
                    setUnitDialog(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm đơn vị
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-2 border rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <span className="font-medium">{unit.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingUnit(unit);
                          setUnitDialog(true);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingUnit({ id: unit.id, name: unit.name })}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Tên danh mục</Label>
              <Input
                id="categoryName"
                value={editingCategory ? editingCategory.name : newCategoryName}
                onChange={(e) => {
                  if (editingCategory) {
                    setEditingCategory({ ...editingCategory, name: e.target.value });
                  } else {
                    setNewCategoryName(e.target.value);
                  }
                }}
                placeholder="Nhập tên danh mục"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCategoryDialog(false);
              setEditingCategory(null);
              setNewCategoryName("");
            }}>
              Hủy
            </Button>
            <Button onClick={editingCategory ? handleUpdateCategory : handleAddCategory}>
              {editingCategory ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unit Dialog */}
      <Dialog open={unitDialog} onOpenChange={setUnitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUnit ? "Sửa đơn vị" : "Thêm đơn vị mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="unitName">Tên đơn vị</Label>
              <Input
                id="unitName"
                value={editingUnit ? editingUnit.name : newUnitName}
                onChange={(e) => {
                  if (editingUnit) {
                    setEditingUnit({ ...editingUnit, name: e.target.value });
                  } else {
                    setNewUnitName(e.target.value);
                  }
                }}
                placeholder="Nhập tên đơn vị (vd: cái, kg, m2)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUnitDialog(false);
              setEditingUnit(null);
              setNewUnitName("");
            }}>
              Hủy
            </Button>
            <Button onClick={editingUnit ? handleUpdateUnit : handleAddUnit}>
              {editingUnit ? "Cập nhật" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        onConfirm={handleDeleteCategory}
        itemName={deletingCategory?.name || ""}
      />

      {/* Delete Unit Confirmation Dialog */}
      <DeleteConfirmDialog
        open={!!deletingUnit}
        onOpenChange={(open) => !open && setDeletingUnit(null)}
        onConfirm={handleDeleteUnit}
        itemName={deletingUnit?.name || ""}
      />
    </>
  );
}
