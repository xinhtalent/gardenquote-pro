import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, TestTube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/aiPrompts';

interface AISettings {
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  apiKey: string;
  apiEndpoint?: string;
  model: string;
  systemPrompt: string;
}

export default function AIQuoteSettings() {
  const [settings, setSettings] = useState<AISettings>({
    provider: 'openai',
    apiKey: '',
    apiEndpoint: '',
    model: 'gpt-4o-mini',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: "Không có quyền truy cập",
        description: "Chỉ admin mới có thể cấu hình AI",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }
    if (isAdmin) {
      loadSettings();
    }
  }, [isAdmin, roleLoading, navigate]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('ai_quote_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          provider: data.provider as AISettings['provider'],
          apiKey: data.api_key || '',
          apiEndpoint: data.api_endpoint || '',
          model: data.model,
          systemPrompt: data.system_prompt,
        });
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    if (!settings.apiKey.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập API Key",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('ai_quote_settings')
        .upsert({
          user_id: user.id,
          provider: settings.provider,
          api_key: settings.apiKey,
          api_endpoint: settings.apiEndpoint || null,
          model: settings.model,
          system_prompt: settings.systemPrompt,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Đã lưu",
        description: "Cài đặt API đã được lưu thành công",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu cài đặt",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!settings.apiKey.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập API Key trước khi test",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      // Kiểm tra session trước khi gọi edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Phiên đăng nhập hết hạn",
          description: "Vui lòng đăng nhập lại để test API",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-quick-quote', {
        body: { 
          message: "Test: 2 chậu thường 50x30x40cm giá 150k",
          testMode: true,
          settings: {
            provider: settings.provider,
            api_key: settings.apiKey,
            api_endpoint: settings.apiEndpoint,
            model: settings.model,
            system_prompt: settings.systemPrompt
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Test thành công",
        description: "API đang hoạt động bình thường",
      });
    } catch (error: any) {
      console.error('Error testing API:', error);
      toast({
        title: "Test thất bại",
        description: error.message || "Không thể kết nối với API",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getModelOptions = () => {
    switch (settings.provider) {
      case 'openai':
        return [
          { value: 'gpt-4o', label: 'GPT-4o (Vision, Recommended)' },
          { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Vision, Fast)' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Vision)' },
        ];
      case 'anthropic':
        return [
          { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Vision)' },
          { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Vision)' },
        ];
      case 'google':
        return [
          { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommended - Free tier)' },
          { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Powerful)' },
          { value: 'gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
        ];
      default:
        return [{ value: 'custom', label: 'Custom Model' }];
    }
  };

  if (roleLoading) {
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
    <div className="container mx-auto p-4 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/ai-quick-quote')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Cài đặt AI Báo Giá</h1>
        <p className="text-muted-foreground mt-1">
          Cấu hình API và system prompt cho tính năng AI
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Cấu hình API</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider">Nhà cung cấp API</Label>
              <Select
                value={settings.provider}
                onValueChange={(value) => setSettings({ ...settings, provider: value as AISettings['provider'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="google">Google (Gemini)</SelectItem>
                  <SelectItem value="custom">Custom Endpoint</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.provider === 'custom' ? (
              <div>
                <Label htmlFor="customModel">Model Name</Label>
                <Input
                  id="customModel"
                  placeholder="google/gemini-2.0-flash-exp:free"
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nhập tên model chính xác theo tài liệu của provider
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="model">Model</Label>
                <Select
                  value={settings.model}
                  onValueChange={(value) => setSettings({ ...settings, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getModelOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                API key của bạn sẽ được mã hóa và lưu trữ an toàn
              </p>
            </div>

            {settings.provider === 'custom' && (
              <>
                <div>
                  <Label htmlFor="endpoint">API Endpoint</Label>
                  <Input
                    id="endpoint"
                    placeholder="https://openrouter.ai/api/v1/chat/completions"
                    value={settings.apiEndpoint}
                    onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Đối với OpenRouter, sử dụng endpoint trên
                  </p>
                </div>

                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold mb-2 text-sm">
                    💡 Hướng dẫn sử dụng OpenRouter
                  </h3>
                  <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                    <li>API Endpoint: <code className="bg-background px-1 py-0.5 rounded">https://openrouter.ai/api/v1/chat/completions</code></li>
                    <li>API Key: Lấy tại <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">openrouter.ai/keys</a></li>
                    <li>Model: Xem danh sách tại <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">openrouter.ai/models</a></li>
                    <li>Ví dụ model miễn phí: <code className="bg-background px-1 py-0.5 rounded">google/gemini-2.0-flash-exp:free</code></li>
                  </ul>
                </Card>
              </>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">System Prompt</h2>
          <div>
            <Label htmlFor="systemPrompt">
              Prompt hướng dẫn AI (tùy chỉnh cách AI phân tích)
            </Label>
            <Textarea
              id="systemPrompt"
              value={settings.systemPrompt}
              onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
              rows={20}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setSettings({ ...settings, systemPrompt: DEFAULT_SYSTEM_PROMPT })}
            >
              Khôi phục mặc định
            </Button>
          </div>
        </Card>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting}
          >
            {isTesting ? (
              <>Đang test...</>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Test kết nối
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>Đang lưu...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu cài đặt
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
