import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Agent {
  id: string;
  full_name: string;
  email: string;
}

interface AssignAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  currentAgentId: string;
  onAssigned: () => void;
}

export function AssignAgentDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  currentAgentId,
  onAssigned,
}: AssignAgentDialogProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState(currentAgentId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAgents();
      setSelectedAgentId(currentAgentId);
    }
  }, [open, currentAgentId]);

  const fetchAgents = async () => {
    try {
      // Fetch all users with their roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const agentIds = userRoles.map(ur => ur.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, email')
        .in('id', agentIds);

      if (profilesError) throw profilesError;
      
      const agentsData: Agent[] = profiles.map(profile => {
        return {
          id: profile.id,
          full_name: profile.full_name || 'Chưa đặt tên',
          email: profile.email || '',
        };
      });

      setAgents(agentsData);
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      toast.error("Không thể tải danh sách cộng tác viên");
    }
  };

  const handleAssign = async () => {
    if (!selectedAgentId) {
      toast.error("Vui lòng chọn cộng tác viên");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ user_id: selectedAgentId })
        .eq('id', customerId);

      if (error) throw error;

      toast.success("Đã chỉ định khách hàng cho cộng tác viên");
      onAssigned();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning customer:', error);
      toast.error("Không thể chỉ định khách hàng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉ định cộng tác viên</DialogTitle>
          <DialogDescription>
            Chọn cộng tác viên phụ trách khách hàng "{customerName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Cộng tác viên phụ trách</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn cộng tác viên" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.full_name} ({agent.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
