import { Button } from "./ui/button";
import { ShoppingCart, Heart, Eye } from "lucide-react";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

const products = [
  {
    id: 1,
    name: "Chậu Terracotta Hiện Đại",
    price: "2.500.000",
    image: product1,
    description: "Thiết kế hình chữ nhật với tone màu terracotta ấm áp",
  },
  {
    id: 2,
    name: "Chậu Tròn Đen Sang Trọng",
    price: "3.200.000",
    image: product2,
    description: "Chậu tròn lớn màu đen, hoàn hảo cho cây cảnh cao",
  },
  {
    id: 3,
    name: "Bộ Ba Chậu Tối Giản",
    price: "4.800.000",
    image: product3,
    description: "Set 3 chậu kích thước khác nhau, phong cách tối giản",
  },
];

export function Products() {
  return (
    <section id="products" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold font-playfair">
            Bộ sưu tập
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Nổi bật
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Khám phá những sản phẩm được yêu thích nhất từ bộ sưu tập của chúng tôi
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-[var(--shadow-card)] animate-fade-in-scale"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative overflow-hidden aspect-square">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Hover actions */}
                <div className="absolute inset-0 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="rounded-full transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="rounded-full transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-150"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold font-playfair mb-2">{product.name}</h3>
                  <p className="text-muted-foreground text-sm">{product.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">{product.price} ₫</div>
                  <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg">
            Xem tất cả sản phẩm
          </Button>
        </div>
      </div>
    </section>
  );
}
