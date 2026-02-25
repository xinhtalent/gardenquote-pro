import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

export const ItemImportExport = ({ onImportComplete }: { onImportComplete: () => void }) => {
  
  const handleExport = async () => {
    try {
      const { data: items, error } = await supabase
        .from('items')
        .select('name, category, unit, price, sku')
        .order('category', { ascending: true });

      if (error) throw error;

      const exportData = items?.map(item => ({
        'Tên hạng mục': item.name,
        'Danh mục': item.category,
        'Đơn vị': item.unit,
        'Giá': item.price,
        'SKU': item.sku
      })) || [];

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Hạng mục');
      
      const fileName = `hang-muc-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success("Xuất file thành công!");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Lỗi khi xuất file");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let addedCount = 0;
      let updatedCount = 0;
      const newCategories = new Set<string>();
      const newUnits = new Set<string>();

      for (const row of jsonData as any[]) {
        const name = row['Tên hạng mục']?.toString().trim();
        const category = row['Danh mục']?.toString().trim();
        const unit = row['Đơn vị']?.toString().trim();
        const price = parseFloat(row['Giá']?.toString().replace(/[^0-9.-]+/g, '') || '0');
        const sku = row['SKU']?.toString().trim();

        if (!name || !category || !unit) continue;

        // Collect new categories and units
        if (category) newCategories.add(category);
        if (unit) newUnits.add(unit);

        // Check if item exists by SKU
        let existingItem = null;
        if (sku) {
          const { data } = await supabase
            .from('items')
            .select('id')
            .eq('sku', sku)
            .maybeSingle();
          existingItem = data;
        }

        if (existingItem) {
          // Update existing item
          const { error } = await supabase
            .from('items')
            .update({
              name,
              category,
              unit,
              price,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingItem.id);

          if (!error) updatedCount++;
        } else {
          // Insert new item (SKU will be auto-generated if not provided)
          const itemData: any = {
            name,
            category,
            unit,
            price,
            user_id: user.id
          };
          
          if (sku) {
            itemData.sku = sku;
          }

          const { error } = await supabase
            .from('items')
            .insert(itemData);

          if (!error) addedCount++;
        }
      }

      // Add new categories
      for (const categoryName of newCategories) {
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('name', categoryName)
          .maybeSingle();

        if (!existingCategory) {
          await supabase
            .from('categories')
            .insert({ name: categoryName });
        }
      }

      // Add new units
      for (const unitName of newUnits) {
        const { data: existingUnit } = await supabase
          .from('units')
          .select('id')
          .eq('name', unitName)
          .maybeSingle();

        if (!existingUnit) {
          await supabase
            .from('units')
            .insert({ name: unitName });
        }
      }

      toast.success(`Nhập thành công! Thêm mới: ${addedCount}, Cập nhật: ${updatedCount}`);
      onImportComplete();
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      toast.error("Lỗi khi nhập file");
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        className="gap-2"
        onClick={handleExport}
      >
        <Download className="w-4 h-4" />
        Xuất Excel
      </Button>
      
      <Button 
        variant="outline" 
        className="gap-2 relative overflow-hidden"
      >
        <Upload className="w-4 h-4" />
        Nhập Excel
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleImport}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </Button>
    </div>
  );
};
