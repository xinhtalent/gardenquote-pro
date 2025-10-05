import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

interface Item {
  id: number;
  name: string;
  unit: string;
  price: number;
  image: string;
  category: string;
}

const ItemLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - sẽ thay bằng dữ liệu thực từ database
  const items: Item[] = [
    {
      id: 1,
      name: "Cây xanh trang trí",
      unit: "cây",
      price: 500000,
      image: "/placeholder.svg",
      category: "Cây cảnh"
    },
    {
      id: 2,
      name: "Gạch lát sân",
      unit: "m²",
      price: 350000,
      image: "/placeholder.svg",
      category: "Vật liệu"
    },
    {
      id: 3,
      name: "Chậu composite",
      unit: "chậu",
      price: 800000,
      image: "/placeholder.svg",
      category: "Phụ kiện"
    },
    {
      id: 4,
      name: "Đất trồng dinh dưỡng",
      unit: "bao",
      price: 150000,
      image: "/placeholder.svg",
      category: "Vật liệu"
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Thư viện Hạng mục
          </h1>
          <p className="text-muted-foreground">
            Quản lý các hạng mục sản phẩm và dịch vụ
          </p>
        </div>

        {/* Search and Add */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Tìm kiếm hạng mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="gap-2">
            <Plus className="w-5 h-5" />
            Thêm hạng mục mới
          </Button>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-medium transition-all duration-300">
              <div className="aspect-square bg-secondary relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8">
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
                  <span className="font-bold text-primary">
                    {formatCurrency(item.price)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ItemLibrary;
