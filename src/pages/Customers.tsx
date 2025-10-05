import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Search, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");

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
              <Link 
                key={customer.phone} 
                to={`/customer/${customer.phone}`}
                className="block"
              >
                <Card className="p-4 md:p-6 hover:shadow-medium transition-all duration-300 border-2 border-transparent hover:border-primary">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                        <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      </div>
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
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent whitespace-nowrap">
                        {customer.quoteCount} báo giá
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
  );
};

export default Customers;
