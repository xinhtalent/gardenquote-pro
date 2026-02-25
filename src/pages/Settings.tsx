import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Upload, Building2, CreditCard, Save, Loader2, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useGlobalSettings, usePersonalSettings, useUpdateGlobalSettings, useUpdatePersonalSettings } from "@/hooks/useSettings";

const Settings = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  
  // ✅ Use React Query hooks for realtime settings
  const { data: globalSettings, isLoading: globalLoading } = useGlobalSettings();
  const { data: personalSettings, isLoading: personalLoading } = usePersonalSettings();
  const updateGlobalSettings = useUpdateGlobalSettings();
  const updatePersonalSettings = useUpdatePersonalSettings();
  
  const [saving, setSaving] = useState(false);
  const loading = globalLoading || personalLoading || roleLoading;
  
  // Global settings (Admin only)
  const [appName, setAppName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyTagline, setCompanyTagline] = useState("");
  const [companyContact, setCompanyContact] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyTaxCode, setCompanyTaxCode] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [quotePrefix, setQuotePrefix] = useState("XINH");
  const [quoteNotes, setQuoteNotes] = useState("Báo giá có hiệu lực trong 30 ngày. Vui lòng đặt cọc 30% để xác nhận đơn hàng. Sau khi nhận được tiền cọc, chúng tôi sẽ liên hệ lại để xác nhận và triển khai thi công.");
  const [paymentEmojis, setPaymentEmojis] = useState<string[]>(["❤️","🩷","🧡","💛","🍷","🥂","🍾"]);
  
  // Personal settings (Agent)
  const [creatorName, setCreatorName] = useState("");
  const [creatorPhone, setCreatorPhone] = useState("");
  const [creatorPosition, setCreatorPosition] = useState("");
  
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  
  const [vietQRBankId, setVietQRBankId] = useState("");
  const [vietQRAccountNumber, setVietQRAccountNumber] = useState("");
  const [vietQRAccountName, setVietQRAccountName] = useState("");
  
  // Bank list from VietQR API
  const [banks, setBanks] = useState<Array<{ id: number; name: string; code: string; bin: string; shortName: string }>>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // ✅ Populate state from global settings (when data loads)
  useEffect(() => {
    if (globalSettings) {
      setAppName(globalSettings.app_name || "Hệ thống báo giá");
      setCompanyName(globalSettings.company_name || "");
      setCompanyTagline(globalSettings.company_tagline || "");
      setCompanyContact(globalSettings.company_contact || "");
      setCompanyAddress(globalSettings.company_address || "");
      setCompanyTaxCode(globalSettings.company_tax_code || "");
      setCompanyEmail(globalSettings.company_email || "");
      setCompanyWebsite(globalSettings.company_website || "");
      setLogoPreview(globalSettings.company_logo_url || "");
      // Extract prefix from format (e.g., "XINH-DDMMYY-X##" -> "XINH")
      const fullFormat = globalSettings.quote_code_format || "XINH-DDMMYY-X##";
      const prefix = fullFormat.split('-')[0] || "XINH";
      setQuotePrefix(prefix);
      setQuoteNotes(globalSettings.quote_notes || "Báo giá có hiệu lực trong 30 ngày. Vui lòng đặt cọc 30% để xác nhận đơn hàng. Sau khi nhận được tiền cọc, chúng tôi sẽ liên hệ lại để xác nhận và triển khai thi công.");
      setPaymentEmojis(globalSettings.payment_emojis || ["❤️","🩷","🧡","💛","🍷","🥂","🍾"]);
    }
  }, [globalSettings]);

  // ✅ Populate state from personal settings (when data loads)
  useEffect(() => {
    if (personalSettings) {
      setCreatorName(personalSettings.creator_name || "");
      setCreatorPosition(personalSettings.creator_position || "");
      setCreatorPhone(personalSettings.creator_phone || "");
      setBankName(personalSettings.bank_name || "");
      setBankAccountNumber(personalSettings.bank_account_number || "");
      setBankAccountName(personalSettings.bank_account_name || "");
      setVietQRBankId(personalSettings.vietqr_bank_id || "");
      setVietQRAccountNumber(personalSettings.vietqr_account_number || "");
      setVietQRAccountName(personalSettings.vietqr_account_name || "");
    }
  }, [personalSettings]);

  // Fetch bank list from VietQR API
  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true);
      try {
        const response = await fetch('https://api.vietqr.io/v2/banks');
        const result = await response.json();
        if (result.code === "00" && result.data) {
          setBanks(result.data);
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
        toast.error("Không thể tải danh sách ngân hàng");
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBanks();
  }, []);


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

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Bạn cần đăng nhập để lưu cài đặt");
        setSaving(false);
        return;
      }

      // Validate phone number format if provided
      if (creatorPhone && creatorPhone.trim() !== "") {
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(creatorPhone.trim())) {
          toast.error("Số điện thoại người tạo không hợp lệ (phải có 10-11 chữ số)");
          setSaving(false);
          return;
        }
      }

      // ✅ Save global settings (admin only) using mutation
      if (isAdmin) {
        await updateGlobalSettings.mutateAsync({
          id: globalSettings?.id,
          app_name: appName,
          company_name: companyName,
          company_tagline: companyTagline,
          company_contact: companyContact,
          company_address: companyAddress,
          company_tax_code: companyTaxCode,
          company_email: companyEmail,
          company_website: companyWebsite,
          company_logo_url: logoPreview,
          quote_code_format: `${quotePrefix}-DDMMYY-X##`,
          quote_notes: quoteNotes,
          payment_emojis: paymentEmojis,
        });
      }

      // ✅ Save personal settings using mutation
      await updatePersonalSettings.mutateAsync({
        id: personalSettings?.id,
        user_id: user.id,
        creator_name: creatorName,
        creator_position: creatorPosition,
        creator_phone: creatorPhone,
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_account_name: bankAccountName,
        // Auto-sync: VietQR uses the same info as payment info
        vietqr_bank_id: bankName,
        vietqr_account_number: bankAccountNumber,
        vietqr_account_name: bankAccountName,
      });

      // ✅ Show single success toast after all saves complete
      toast.success(isAdmin ? "Đã lưu tất cả cài đặt thành công!" : "Đã lưu cài đặt thành công!");
    } catch (error) {
      console.error('Error saving settings:', error);
      // Error toast is handled by mutation hooks
    } finally {
      setSaving(false);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải cài đặt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/10 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Cài đặt
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Quản lý cài đặt toàn hệ thống và thông tin cá nhân" : "Quản lý thông tin cá nhân và thanh toán"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Global Settings - Admin Only */}
          {isAdmin && (
            <>
              <div className="flex items-center gap-2 text-primary font-semibold">
                <SettingsIcon className="w-5 h-5" />
                <h2 className="text-xl">CÀI ĐẶT TOÀN HỆ THỐNG</h2>
              </div>

              <Card className="p-6">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-primary" />
                  Thông tin công ty
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="appName">Tên ứng dụng *</Label>
                    <Input
                      id="appName"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="Hệ thống báo giá"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Tên này sẽ hiển thị trên header và màn hình đăng nhập
                    </p>
                  </div>
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
                    <Label htmlFor="companyTagline">Slogan công ty</Label>
                    <Input
                      id="companyTagline"
                      value={companyTagline}
                      onChange={(e) => setCompanyTagline(e.target.value)}
                      placeholder="Chất lượng - Uy tín - Chuyên nghiệp"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyContact">Liên hệ</Label>
                    <Input
                      id="companyContact"
                      value={companyContact}
                      onChange={(e) => setCompanyContact(e.target.value)}
                      placeholder="0912345678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyAddress">Địa chỉ</Label>
                    <Textarea
                      id="companyAddress"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      rows={2}
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
                  <div>
                    <Label htmlFor="companyEmail">Email công ty</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="contact@company.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyWebsite">Website</Label>
                    <Input
                      id="companyWebsite"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://company.com"
                    />
                  </div>
                </div>
              </Card>

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
                      Logo sẽ hiển thị trên header, đăng nhập và báo giá
                    </p>
                  </div>
                  {logoPreview && (
                    <div className="w-32 h-32 border-2 border-border rounded-full overflow-hidden bg-background flex items-center justify-center">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">Cài đặt báo giá</h2>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/pot-pricing-settings')}
                    className="flex items-center gap-2"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Cài đặt giá chậu
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quotePrefix">Tiền tố mã báo giá</Label>
                    <Input
                      id="quotePrefix"
                      value={quotePrefix}
                      onChange={(e) => setQuotePrefix(e.target.value.toUpperCase())}
                      placeholder="XINH"
                      maxLength={10}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Mã báo giá sẽ có dạng: {quotePrefix}-DDMMYY-X## (X là số thứ tự cộng tác viên, ## là số báo giá trong ngày). VD: {quotePrefix}-{new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '')}-101
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="quoteNotes">Lưu ý trong báo giá</Label>
                    <Textarea
                      id="quoteNotes"
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      placeholder="Nhập các lưu ý hiển thị trong chi tiết báo giá"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>Emoji xác nhận thanh toán</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Các emoji này sẽ hiển thị khi xác nhận thanh toán
                    </p>
                    <div className="grid grid-cols-7 gap-2">
                      {paymentEmojis.map((emoji, index) => (
                        <div key={index}>
                          <Input
                            value={emoji}
                            onChange={(e) => {
                              const newEmojis = [...paymentEmojis];
                              newEmojis[index] = e.target.value;
                              setPaymentEmojis(newEmojis);
                            }}
                            placeholder={`#${index + 1}`}
                            maxLength={2}
                            className="text-center text-2xl h-14"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Separator className="my-8" />

              <div className="flex items-center gap-2 text-primary font-semibold">
                <SettingsIcon className="w-5 h-5" />
                <h2 className="text-xl">CÀI ĐẶT CÁ NHÂN</h2>
              </div>
            </>
          )}

          {/* Personal Settings */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Thông tin người tạo báo giá
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Thông tin mặc định lấy từ tài khoản, bạn có thể tùy chỉnh cho phù hợp với công việc
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
                <Label htmlFor="creatorPosition">Chức vụ</Label>
                <Input
                  id="creatorPosition"
                  value={creatorPosition}
                  onChange={(e) => setCreatorPosition(e.target.value)}
                  placeholder="Chuyên viên tư vấn"
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

          <Card className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" />
              Thông tin thanh toán
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Thông tin này sẽ được sử dụng để tạo mã QR thanh toán tự động trên báo giá
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="bankName">Ngân hàng *</Label>
                <Select value={bankName} onValueChange={setBankName} disabled={loadingBanks}>
                  <SelectTrigger id="bankName">
                    <SelectValue placeholder={loadingBanks ? "Đang tải danh sách ngân hàng..." : "Chọn ngân hàng"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.code}>
                        {bank.code} - {bank.shortName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {/* Save button */}
          <div className="flex justify-end">
            <Button 
              size="lg" 
              onClick={handleSave} 
              disabled={saving}
              className="min-w-[200px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Lưu cài đặt
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
