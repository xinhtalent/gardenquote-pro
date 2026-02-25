import { Shield, Leaf, Palette, Zap } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Bền bỉ vượt thời gian",
    description: "Chất liệu composite cao cấp chống chịu mọi điều kiện thời tiết, không nứt, không phai màu theo thời gian.",
  },
  {
    icon: Leaf,
    title: "Thân thiện môi trường",
    description: "100% có thể tái chế, không độc hại, an toàn cho cây trồng và môi trường sống của bạn.",
  },
  {
    icon: Palette,
    title: "Thiết kế đa dạng",
    description: "Hàng trăm mẫu mã từ cổ điển đến hiện đại, phù hợp với mọi phong cách thiết kế nội thất.",
  },
  {
    icon: Zap,
    title: "Nhẹ & dễ di chuyển",
    description: "Trọng lượng nhẹ hơn 50% so với chậu đất nung, dễ dàng bố trí và thay đổi không gian.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold font-playfair">
            Vì sao chọn
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Chậu Composite?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Kết hợp hoàn hảo giữa thẩm mỹ và công năng, mang đến giải pháp tối ưu cho không gian xanh của bạn
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 bg-card rounded-2xl border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-[var(--shadow-card)] hover:-translate-y-2 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-playfair">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
