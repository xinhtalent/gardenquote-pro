import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { toast } from "sonner";
import { Loader2, TreePine, Fingerprint } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [biometricLoading, setBiometricLoading] = useState(false);
  
  // Global settings
  const [appName, setAppName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Biometric auth
  const { 
    isBiometricAvailable, 
    hasBiometricSetup,
    lastLoginEmail,
    lastLoginName,
    setupBiometric, 
    loginWithBiometric,
    removeBiometric,
  } = useBiometricAuth();


  useEffect(() => {
    const init = async () => {
      // Fetch global settings first
      await fetchGlobalSettings();
      
      // Then check auth
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
      setCheckingAuth(false);
    };

    init();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchGlobalSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('app_name, company_name, company_logo_url')
        .maybeSingle();

      if (error) {
        console.error('Error fetching global settings:', error);
        return;
      }

      if (data) {
        if (data.app_name) setAppName(data.app_name);
        if (data.company_name) setCompanyName(data.company_name);
        if (data.company_logo_url) setLogoUrl(data.company_logo_url);
      }
    } catch (error) {
      console.error('Error in fetchGlobalSettings:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;
      
      // Get user profile for display name
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      const displayName = profile?.full_name || loginEmail.split('@')[0];
      
      toast.success("Đăng nhập thành công!");

      // Prompt to setup biometric if available and not already setup
      if (isBiometricAvailable && !hasBiometricSetup) {
        setTimeout(() => {
          const shouldSetup = window.confirm(
            "Bạn có muốn kích hoạt đăng nhập bằng vân tay/Face ID cho lần sau không?"
          );
          if (shouldSetup) {
            setupBiometric(loginEmail, displayName);
          }
        }, 1000);
      }
    } catch (error: any) {
      toast.error(error.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      const success = await loginWithBiometric();
      if (success) {
        navigate("/");
      }
    } finally {
      setBiometricLoading(false);
    }
  };


  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary-light/10 to-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary-light/10 to-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            {logoUrl ? (
              <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center border-2 border-primary/20">
                <img src={logoUrl} alt={companyName || "Logo"} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <TreePine className="w-10 h-10 text-primary" />
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {companyName || "Hệ thống báo giá"}
          </h1>
          <p className="text-muted-foreground">
            {appName || "Quản lý báo giá"}
          </p>
          {hasBiometricSetup && lastLoginName && (
           <div className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-2">
              <p>
               Xin chào, <span className="font-medium text-foreground">{lastLoginName}</span>
             </p>
             <button
               type="button"
               onClick={() => removeBiometric()}
               className="text-xs underline text-destructive hover:opacity-80"
            >
               Xóa đăng nhập sinh trắc học
              </button>
            </div>

          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="email@example.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="login-password">Mật khẩu</Label>
              <Link 
                to="/forgot-password" 
                className="text-xs text-primary hover:underline"
                tabIndex={-1}
              >
                Quên mật khẩu?
              </Link>
            </div>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>

          {/* Biometric Login Button */}
          {hasBiometricSetup && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Hoặc
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBiometricLogin}
                disabled={biometricLoading || loading}
              >
                {biometricLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Đăng nhập bằng sinh trắc học
                  </>
                )}
              </Button>
            </>
          )}
        </form>
      </Card>
    </div>
  );
};

export default Auth;
