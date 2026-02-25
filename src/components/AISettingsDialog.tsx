import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/aiPrompts';

interface AISettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AISettingsDialog = ({ open, onOpenChange }: AISettingsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("google");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-1.5-flash");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('ai_quote_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const loadedProvider = (data as any).provider;
        const loadedEndpoint = (data as any).api_endpoint || "";
        const uiProvider = loadedProvider === 'custom' && loadedEndpoint.includes('openrouter.ai') ? 'openrouter' : loadedProvider;
        setProvider(uiProvider);
        setApiKey((data as any).api_key);
        setModel((data as any).model);
        setApiEndpoint(loadedEndpoint);
        setSystemPrompt((data as any).system_prompt);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleReset = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    toast({
      title: "Đã đặt lại",
      description: "System prompt đã được đặt về mặc định",
    });
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập API key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const providerForDB = provider === 'openrouter' ? 'custom' : provider;
      const { error } = await (supabase as any)
        .from('ai_quote_settings')
        .upsert({
          user_id: user.id,
          provider: providerForDB,
          api_key: apiKey,
          model,
          api_endpoint: apiEndpoint || null,
          system_prompt: systemPrompt,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Đã lưu cấu hình AI",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu cấu hình",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cấu hình AI</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
                <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                <SelectItem value="custom">Custom Endpoint</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                provider === 'google' ? 'AIza...' : 
                provider === 'openrouter' ? 'sk-or-...' :
                provider === 'anthropic' ? 'sk-ant-...' :
                'sk-...'
              }
            />
            <p className="text-xs text-muted-foreground">
              {provider === 'google' && (
                <>Lấy API key tại: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></>
              )}
              {provider === 'openai' && (
                <>Lấy API key tại: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></>
              )}
              {provider === 'openrouter' && (
                <>Lấy API key tại: <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">OpenRouter</a></>
              )}
              {provider === 'anthropic' && (
                <>Lấy API key tại: <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a></>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            {provider === 'google' ? (
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Free tier)</SelectItem>
                  <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Mạnh)</SelectItem>
                  <SelectItem value="gemini-2.0-flash-001">Gemini 2.0 Flash</SelectItem>
                </SelectContent>
              </Select>
            ) : provider === 'anthropic' ? (
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-sonnet-4-5">Claude Sonnet 4.5 (Mạnh nhất)</SelectItem>
                  <SelectItem value="claude-opus-4-1-20250805">Claude Opus 4.1 (Thông minh)</SelectItem>
                  <SelectItem value="claude-3-5-haiku-20241022">Claude Haiku (Nhanh)</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={
                  provider === 'openai' ? 'gpt-4o-mini' :
                  provider === 'openrouter' ? 'google/gemini-2.0-flash-exp:free' :
                  'model-name'
                }
              />
            )}
            {provider === 'openrouter' && (
              <p className="text-xs text-muted-foreground">
                Xem danh sách model tại: <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="underline">OpenRouter Models</a>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>API Endpoint (tùy chọn)</Label>
            <Input
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder={
                provider === 'google' ? 'Để trống để dùng mặc định' :
                provider === 'openrouter' ? 'https://openrouter.ai/api/v1/chat/completions' :
                provider === 'anthropic' ? 'https://api.anthropic.com/v1/messages' :
                'https://api.openai.com/v1/chat/completions'
              }
            />
            <p className="text-xs text-muted-foreground">
              {provider === 'google' && 'Chỉ cần điền nếu bạn muốn dùng endpoint tùy chỉnh (không cần thêm tên model vào URL)'}
              {provider === 'openrouter' && 'Mặc định: https://openrouter.ai/api/v1/chat/completions'}
              {provider === 'anthropic' && 'Mặc định: https://api.anthropic.com/v1/messages'}
              {provider === 'openai' && 'Chỉ cần điền nếu bạn muốn dùng endpoint tùy chỉnh'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>System Prompt</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Đặt lại mặc định
              </Button>
            </div>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={15}
              className="font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AISettingsDialog;
