import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reassignToUserId: string) => void;
  userName: string;
  userId: string;
  currentUserId: string;
}

interface UserStats {
  customerCount: number;
  quoteCount: number;
}

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
}

type UserRole = 'admin' | 'agent';

export function DeleteUserDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
  userId,
  currentUserId,
}: DeleteUserDialogProps) {
  const [reassignToUserId, setReassignToUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<UserStats>({ customerCount: 0, quoteCount: 0 });
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('agent');

  useEffect(() => {
    if (open) {
      fetchUserStats();
      setReassignToUserId("");
    }
  }, [open, userId]);

  useEffect(() => {
    if (open && userRole) {
      fetchAdmins();
    }
  }, [open, userId, userRole]);

  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const [customersResult, quotesResult, roleResult] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("quotes").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("user_roles").select("role").eq("user_id", userId).single(),
      ]);

      setStats({
        customerCount: customersResult.count || 0,
        quoteCount: quotesResult.count || 0,
      });

      setUserRole(roleResult.data?.role || 'agent');
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles && adminRoles.length > 0) {
        const adminIds = adminRoles.map((r) => r.user_id);
        
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", adminIds)
          .neq("id", userId);

        if (profiles) {
          setAdmins(profiles);
        }
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const handleConfirm = () => {
    if (hasData && !reassignToUserId) {
      return;
    }
    onConfirm(reassignToUserId);
  };

  const hasData = stats.customerCount > 0 || stats.quoteCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              Bạn có chắc chắn muốn xóa người dùng <strong>{userName}</strong>? Hành động này không thể hoàn tác.
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {hasData && (
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="font-medium">Dữ liệu hiện tại:</div>
                    <div className="text-sm">
                      • Khách hàng: <strong>{stats.customerCount}</strong>
                    </div>
                    <div className="text-sm">
                      • Báo giá: <strong>{stats.quoteCount}</strong>
                    </div>
                  </div>
                )}

                {hasData && admins.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="reassign-to">
                      {userRole === 'admin' 
                        ? 'Chọn admin để chuyển giao dữ liệu' 
                        : 'Chọn admin nhận chuyển giao'
                      } <span className="text-destructive">*</span>
                    </Label>
                    <Select value={reassignToUserId} onValueChange={setReassignToUserId}>
                      <SelectTrigger id="reassign-to">
                        <SelectValue placeholder="Chọn admin" />
                      </SelectTrigger>
                      <SelectContent>
                        {admins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.full_name} ({admin.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {hasData && admins.length === 0 && (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
                    {userRole === 'admin' 
                      ? 'Không thể xóa! Đây là admin duy nhất hoặc không có admin khác để chuyển giao dữ liệu.'
                      : 'Không thể xóa! Không có admin nào để chuyển giao dữ liệu.'
                    }
                  </div>
                )}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || (hasData && (!reassignToUserId || admins.length === 0))}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Xóa và chuyển giao
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
