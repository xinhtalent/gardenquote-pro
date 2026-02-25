import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Edit2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { DeleteUserDialog } from "@/components/DeleteUserDialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  discount_percent: number;
}

const Users = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    role: "agent" as "agent" | "admin",
  });
  const [editDiscountDialog, setEditDiscountDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Bạn không có quyền truy cập trang này");
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    fetchUsers();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

      if (profileError) throw profileError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      const usersData = profiles.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        
        return {
          id: profile.id,
          email: profile.email || '',
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          role: userRole?.role || 'agent',
          discount_percent: profile.discount_percent || 0,
        };
      });

      // Sắp xếp: Cộng tác viên (agent) trước, Quản trị viên (admin) sau
      // Trong mỗi nhóm, sắp xếp theo tên (full_name)
      const sortedUsers = usersData.sort((a, b) => {
        // Admin luôn xếp sau
        if (a.role !== b.role) {
          return a.role === 'admin' ? 1 : -1;
        }
        // Trong cùng role, sắp xếp theo tên
        return a.full_name.localeCompare(b.full_name);
      });

      setUsers(sortedUsers);
    } catch (error: any) {
      toast.error("Không thể tải danh sách người dùng");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (reassignToUserId: string) => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { 
          userId: userToDelete.id,
          reassignToUserId: reassignToUserId || undefined,
        }
      });

      if (error) throw error;

      toast.success("Đã xóa người dùng và chuyển giao dữ liệu thành công");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa người dùng");
      console.error(error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name || !newUser.phone) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(newUser.phone)) {
      toast.error("Số điện thoại không hợp lệ (phải có 10 chữ số, bắt đầu bằng 0)");
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase.functions.invoke('create-user', {
        body: newUser
      });

      if (error) throw error;

      toast.success("Đã tạo người dùng thành công");
      setCreateDialogOpen(false);
      setNewUser({ email: "", password: "", full_name: "", phone: "", role: "agent" });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo người dùng");
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleEditDiscount = (user: User) => {
    setEditingUser(user);
    setDiscountPercent(user.discount_percent);
    setEditDiscountDialog(true);
  };

  const handleSaveDiscount = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ discount_percent: discountPercent })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success("Đã cập nhật tỷ lệ chiết khấu");
      setEditDiscountDialog(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật chiết khấu");
      console.error(error);
    }
  };


  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
          <p className="text-muted-foreground">Xem và quản lý tài khoản người dùng</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">
                  {user.full_name || user.email}
                  {user.id === currentUserId && <span className="text-muted-foreground"> (Me)</span>}
                </h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-sm text-muted-foreground">{user.phone}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {user.role === 'admin' ? 'Quản trị viên' : 'Cộng tác viên'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Chiết khấu: {user.discount_percent}%
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditDiscount(user)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Chiết khấu
                </Button>
                {user.id !== currentUserId && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleDeleteClick(user)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        userName={userToDelete?.full_name || userToDelete?.email || ""}
        userId={userToDelete?.id || ""}
        currentUserId={currentUserId}
      />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm người dùng mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản người dùng mới cho hệ thống
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Họ và tên</Label>
              <Input
                id="full_name"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="0901234567"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="role">Vai trò</Label>
              <Select value={newUser.role} onValueChange={(value: "agent" | "admin") => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Cộng tác viên</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creating}>
              Hủy
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo người dùng"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDiscountDialog} onOpenChange={setEditDiscountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cài đặt chiết khấu</DialogTitle>
            <DialogDescription>
              Tỷ lệ chiết khấu của {editingUser?.full_name} (dùng để tính lợi nhuận)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="discountPercent">Tỷ lệ chiết khấu (%)</Label>
              <Input
                id="discountPercent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Tỷ lệ chiết khấu sẽ được sử dụng để tính lợi nhuận trong báo cáo
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDiscountDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveDiscount}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
