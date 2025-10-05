import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Upload, Building2, CreditCard, QrCode, Save } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  // Mock data - sẽ load từ database sau
  const [companyName, setCompanyName] = useState("Công ty TNHH Cây Xanh Xinh");
  const [tagline, setTagline] = useState("Mang thiên nhiên đến từng không gian");
  const [hotline, setHotline] = useState("0901234567");
  const [companyAddress, setCompanyAddress] = useState("123 Đường ABC, Quận 1, TP.HCM");
  const [website, setWebsite] = useState("www.cayxanhxinh.com");
  const [companyEmail, setCompanyEmail] = useState("contact@cayxanhxinh.com");
  const [companyTaxCode, setCompanyTaxCode] = useState("0123456789");
  
  const [creatorName, setCreatorName] = useState("Nguyễn Thị B");
  const [creatorPhone, setCreatorPhone] = useState("0912345678");
  
  const [bankName, setBankName] = useState("Ngân hàng TMCP Á Châu (ACB)");
  const [bankAccountNumber, setBankAccountNumber] = useState("123456789012");
  const [bankAccountName, setBankAccountName] = useState("CONG TY TNHH CAY XANH XINH");
  
  const [vietQRInfo, setVietQRInfo] = useState("123456789012");
  
  const [logoPreview, setLogoPreview] = useState<string>("");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Sẽ lưu vào database sau
    toast.success("Đã lưu cài đặt thành công!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Cài đặt
          </h1>
          <p className="text-muted-foreground">
            Chỉnh sửa thông tin công ty và cấu hình báo giá
          </p>
        </div>

        <div className="space-y-6">
          {/* Logo công ty */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Upload className="w-6 h-6 text-primary" />
              Logo công ty
            </h2>
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <Label htmlFor="logo">Chọn logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Logo sẽ hiển thị trên báo giá. Khuyến nghị: PNG/JPG, kích thước tối đa 2MB
                </p>
              </div>
              {logoPreview && (
                <div className="w-32 h-32 border-2 border-border rounded-lg overflow-hidden bg-background">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Thông tin công ty */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Thông tin công ty
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Tên công ty *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Công ty TNHH..."
                />
              </div>
              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Slogan công ty của bạn"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hotline">Hotline *</Label>
                  <Input
                    id="hotline"
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    placeholder="0901234567"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="www.company.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="companyAddress">Địa chỉ *</Label>
                <Textarea
                  id="companyAddress"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="companyTaxCode">Mã số thuế</Label>
                  <Input
                    id="companyTaxCode"
                    value={companyTaxCode}
                    onChange={(e) => setCompanyTaxCode(e.target.value)}
                    placeholder="0123456789"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Thông tin người tạo báo giá */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Thông tin người tạo báo giá mặc định
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Thông tin này sẽ được điền sẵn khi tạo báo giá mới (có thể chỉnh sửa)
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="creatorName">Tên chuyên viên *</Label>
                <Input
                  id="creatorName"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <Label htmlFor="creatorPhone">Số điện thoại *</Label>
                <Input
                  id="creatorPhone"
                  value={creatorPhone}
                  onChange={(e) => setCreatorPhone(e.target.value)}
                  placeholder="0912345678"
                />
              </div>
            </div>
          </Card>

          {/* Thông tin thanh toán */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" />
              Thông tin thanh toán
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bankName">Tên ngân hàng *</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Ngân hàng TMCP..."
                />
              </div>
              <div>
                <Label htmlFor="bankAccountNumber">Số tài khoản *</Label>
                <Input
                  id="bankAccountNumber"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="123456789012"
                />
              </div>
              <div>
                <Label htmlFor="bankAccountName">Tên chủ tài khoản *</Label>
                <Input
                  id="bankAccountName"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="NGUYEN VAN A"
                />
              </div>
            </div>
          </Card>

          {/* VietQR */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-primary" />
              Thông tin VietQR
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="vietQRInfo">Thông tin VietQR</Label>
                <Input
                  id="vietQRInfo"
                  value={vietQRInfo}
                  onChange={(e) => setVietQRInfo(e.target.value)}
                  placeholder="Nhập số tài khoản hoặc thông tin VietQR"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Mã QR sẽ tự động hiển thị trên báo giá để khách hàng dễ dàng thanh toán
                </p>
              </div>
            </div>
          </Card>

          {/* Save button */}
          <div className="flex justify-end">
            <Button size="lg" onClick={handleSave} className="min-w-[200px]">
              <Save className="w-5 h-5 mr-2" />
              Lưu cài đặt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
