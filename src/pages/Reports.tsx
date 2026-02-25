import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, DollarSign, FileText, Users, HandCoins, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrencyShort } from "@/lib/utils";

interface AgentStats {
  user_id: string;
  user_name: string;
  total_revenue: number;
  total_quotes_amount: number;
  total_quotes_count: number;
  paid_quotes: number;
  total_customers: number;
  closing_rate: number;
}

interface OverallStats {
  totalRevenue: number;
  totalQuotesAmount: number;
  totalQuotesCount: number;
  totalCustomers: number;
  closingRate: number;
}

const Reports = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<AgentStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>("all");

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Bạn không có quyền truy cập trang này");
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin, timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case "7d":
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return sevenDaysAgo.toISOString();
      case "30d":
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return thirtyDaysAgo.toISOString();
      case "90d":
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(now.getDate() - 90);
        return ninetyDaysAgo.toISOString();
      default:
        return null;
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();
      
      // Fetch quotes based on quote date for accurate filtering
      let quotesQuery = supabase
        .from('quotes')
        .select('user_id, total_amount, status, date, created_at, confirmed_at');
      
      if (dateFilter) {
        quotesQuery = quotesQuery.gte('date', dateFilter);
      }

      const { data: quotes, error: quotesError } = await quotesQuery;
      if (quotesError) throw quotesError;

      // Fetch all profiles with discount_percent
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, discount_percent');
      
      if (profilesError) throw profilesError;

      // Fetch customers
      let customersQuery = supabase
        .from('customers')
        .select('user_id, id');
      
      if (dateFilter) {
        customersQuery = customersQuery.gte('created_at', dateFilter);
      }

      const { data: customers, error: customersError } = await customersQuery;
      if (customersError) throw customersError;

      // Create a map for quick profile lookup
      const profileMap = new Map(profiles?.map(p => [p.id, { name: p.full_name, discount: p.discount_percent || 0 }]) || []);

      // Calculate agent stats
      const agentMap = new Map<string, AgentStats>();

      quotes?.forEach((quote: any) => {
        const userId = quote.user_id;
        
        if (!agentMap.has(userId)) {
          const profileInfo = profileMap.get(userId);
          agentMap.set(userId, {
            user_id: userId,
            user_name: profileInfo?.name || 'Unknown',
            total_revenue: 0,
            total_quotes_amount: 0,
            total_quotes_count: 0,
            paid_quotes: 0,
            total_customers: 0,
            closing_rate: 0,
          });
        }

        const agent = agentMap.get(userId)!;
        agent.total_quotes_count += 1;
        agent.total_quotes_amount += Number(quote.total_amount);
        
        // Count confirmed quotes as paid for revenue calculation
        if (quote.status === 'confirmed' || quote.status === 'paid') {
          agent.paid_quotes += 1;
          agent.total_revenue += Number(quote.total_amount);
        }
      });

      // Add customer counts to agents
      customers?.forEach((customer: any) => {
        const userId = customer.user_id;
        if (agentMap.has(userId)) {
          agentMap.get(userId)!.total_customers += 1;
        } else {
          // Create entry for agents with customers but no quotes
          const profileInfo = profileMap.get(userId);
          agentMap.set(userId, {
            user_id: userId,
            user_name: profileInfo?.name || 'Unknown',
            total_revenue: 0,
            total_quotes_amount: 0,
            total_quotes_count: 0,
            paid_quotes: 0,
            total_customers: 1,
            closing_rate: 0,
          });
        }
      });

      const statsArray = Array.from(agentMap.values())
        .map(agent => ({
          ...agent,
          closing_rate: agent.total_quotes_count > 0 
            ? (agent.paid_quotes / agent.total_quotes_count) * 100 
            : 0,
        }))
        .sort((a, b) => {
          // Primary sort: total_revenue descending
          if (b.total_revenue !== a.total_revenue) {
            return b.total_revenue - a.total_revenue;
          }
          // Secondary sort: total_quotes_amount descending
          if (b.total_quotes_amount !== a.total_quotes_amount) {
            return b.total_quotes_amount - a.total_quotes_amount;
          }
          // Tertiary sort: closing_rate descending
          return b.closing_rate - a.closing_rate;
        });

      setStats(statsArray);

      // Calculate overall stats - count confirmed quotes as paid
      const totalRevenue = quotes?.reduce((sum, q: any) => 
        (q.status === 'confirmed' || q.status === 'paid') ? sum + Number(q.total_amount) : sum, 0) || 0;
      const totalQuotesAmount = quotes?.reduce((sum, q: any) => sum + Number(q.total_amount), 0) || 0;
      const totalQuotesCount = quotes?.length || 0;
      const paidQuotes = quotes?.filter((q: any) => q.status === 'confirmed' || q.status === 'paid').length || 0;
      const closingRate = totalQuotesCount > 0 ? (paidQuotes / totalQuotesCount) * 100 : 0;

      const totalCustomers = customers?.length || 0;

      // Calculate total profit based on discount percentages
      const totalProfit = quotes?.reduce((sum, q: any) => {
        if (q.status === 'confirmed' || q.status === 'paid') {
          const profileInfo = profileMap.get(q.user_id);
          const discountPercent = profileInfo?.discount || 0;
          return sum + (Number(q.total_amount) * discountPercent / 100);
        }
        return sum;
      }, 0) || 0;

      setOverallStats({
        totalRevenue,
        totalQuotesAmount,
        totalQuotesCount,
        totalCustomers,
        closingRate,
        totalProfit,
      } as any);

    } catch (error: any) {
      toast.error("Không thể tải báo cáo");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (isMobile) {
      return formatCurrencyShort(amount);
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Báo cáo hiệu suất</h1>
          <p className="text-muted-foreground">Thống kê tổng quan và theo từng cộng tác viên</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn khoảng thời gian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toàn bộ thời gian</SelectItem>
            <SelectItem value="7d">7 ngày qua</SelectItem>
            <SelectItem value="30d">30 ngày qua</SelectItem>
            <SelectItem value="90d">90 ngày qua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall KPIs */}
      {overallStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lợi nhuận</CardTitle>
              <HandCoins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {formatCurrency((overallStats as any).totalProfit || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Dựa trên chiết khấu</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(overallStats.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng báo giá</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {formatCurrency(overallStats.totalQuotesAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {overallStats.totalQuotesCount} báo giá
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng khách hàng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tỉ lệ chuyển đổi</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{overallStats.closingRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Stats */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Hiệu suất từng cộng tác viên</h2>
      </div>
      
      <div className="grid gap-4">
        {stats.map((agent) => (
          <Card key={agent.user_id}>
            <CardHeader>
              <CardTitle>{agent.user_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(agent.total_revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng báo giá</p>
                  <p className="text-xl font-bold text-accent">
                    {formatCurrency(agent.total_quotes_amount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {agent.total_quotes_count} báo giá
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <p className="text-xl font-bold">{agent.total_customers}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tỉ lệ chốt</p>
                  <p className="text-xl font-bold text-blue-600">
                    {agent.closing_rate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reports;
