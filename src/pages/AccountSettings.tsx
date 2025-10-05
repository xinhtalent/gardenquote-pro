import { useState } from "react";
import { Camera, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const AccountSettings = () => {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [name, setName] = useState("Nguyễn Văn A");
  const [email] = useState("nguyenvana@example.com");
  const [avatar, setAvatar] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        toast({
          title: "Avatar đã được tải lên",
          description: "Avatar của bạn đã được cập nhật",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    toast({
      title: "Cập nhật thành công",
      description: "Thông tin cá nhân đã được lưu",
    });
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
      });
      return;
    }
    toast({
      title: "Đổi mật khẩu thành công",
      description: "Mật khẩu của bạn đã được cập nhật",
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleThemeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    document.documentElement.classList.toggle("dark", checked);
    toast({
      title: checked ? "Chế độ tối" : "Chế độ sáng",
      description: `Đã chuyển sang ${checked ? "giao diện tối" : "giao diện sáng"}`,
    });
  };

  const handleLogout = () => {
    toast({
      title: "Đăng xuất thành công",
      description: "Hẹn gặp lại bạn!",
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Cài đặt tài khoản</h1>
        <p className="text-muted-foreground">Quản lý thông tin cá nhân và tùy chọn của bạn</p>
      </div>

      <div className="space-y-6">
        {/* Avatar và Thông tin cơ bản */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>Cập nhật avatar và tên hiển thị của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={email} disabled className="bg-muted" />
                </div>
              </div>
            </div>
            <Button onClick={handleSaveProfile}>Lưu thay đổi</Button>
          </CardContent>
        </Card>

        {/* Đổi mật khẩu */}
        <Card>
          <CardHeader>
            <CardTitle>Đổi mật khẩu</CardTitle>
            <CardDescription>Cập nhật mật khẩu của bạn để bảo mật tài khoản</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Mật khẩu mới</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
            <Button onClick={handleChangePassword}>Đổi mật khẩu</Button>
          </CardContent>
        </Card>

        {/* Giao diện */}
        <Card>
          <CardHeader>
            <CardTitle>Giao diện</CardTitle>
            <CardDescription>Tùy chỉnh giao diện ứng dụng theo sở thích của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-accent" />
                )}
                <div>
                  <p className="font-medium">Chế độ tối</p>
                  <p className="text-sm text-muted-foreground">
                    {isDarkMode ? "Đang sử dụng giao diện tối" : "Đang sử dụng giao diện sáng"}
                  </p>
                </div>
              </div>
              <Switch checked={isDarkMode} onCheckedChange={handleThemeToggle} />
            </div>
          </CardContent>
        </Card>

        {/* Đăng xuất */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Đăng xuất</CardTitle>
            <CardDescription>Thoát khỏi tài khoản của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout} className="w-full md:w-auto">
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountSettings;
