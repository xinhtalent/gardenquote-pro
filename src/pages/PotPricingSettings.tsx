import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DEFAULT_POT_PRICING_SETTINGS } from "@/lib/potPricingUtils";

export default function PotPricingSettings() {
  const [settings, setSettings] = useState(DEFAULT_POT_PRICING_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('pot_pricing_settings')
      .select('*')
      .limit(1)
      .single();

    if (data) {
      setSettings({
        ...data,
        rounding_mode: data.rounding_mode as '1000' | '5000' | '10000'
      });
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    const { error } = await supabase
      .from('pot_pricing_settings')
      .upsert(settings);

    if (error) {
      toast.error("Lỗi lưu cài đặt");
    } else {
      toast.success("Đã lưu cài đặt");
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_POT_PRICING_SETTINGS);
    toast.success("Đã khôi phục giá trị mặc định");
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Cài đặt giá chậu (Customizable)</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Giá vật tư theo độ dày</CardTitle>
            <CardDescription>Đơn giá vật tư trên mỗi m² (VNĐ/m²).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'price_08cm', label: '0.8 cm' },
              { key: 'price_10cm', label: '1.0 cm' },
              { key: 'price_12cm', label: '1.2 cm' },
              { key: 'price_15cm', label: '1.5 cm' },
              { key: 'price_17cm', label: '1.7 cm' },
            ].map(({ key, label }) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={settings[key as keyof typeof settings]}
                  onChange={(e) => setSettings({ ...settings, [key]: parseFloat(e.target.value) })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hệ số loại chậu</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Chậu thường (&lt;150k)</Label>
              <Input type="number" step="0.1" value={settings.multiplier_regular_low} onChange={(e) => setSettings({ ...settings, multiplier_regular_low: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Chậu thường (150k-&lt;300k)</Label>
              <Input type="number" step="0.1" value={settings.multiplier_regular_mid} onChange={(e) => setSettings({ ...settings, multiplier_regular_mid: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Chậu thường (≥300k)</Label>
              <Input type="number" step="0.1" value={settings.multiplier_regular_high} onChange={(e) => setSettings({ ...settings, multiplier_regular_high: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Chậu cong</Label>
              <Input type="number" step="0.1" value={settings.multiplier_curved} onChange={(e) => setSettings({ ...settings, multiplier_curved: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Tiểu cảnh</Label>
              <Input type="number" step="0.1" value={settings.multiplier_landscape} onChange={(e) => setSettings({ ...settings, multiplier_landscape: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Hàng rào</Label>
              <Input type="number" step="0.1" value={settings.multiplier_fence} onChange={(e) => setSettings({ ...settings, multiplier_fence: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Baki</Label>
              <Input type="number" step="0.1" value={settings.multiplier_baki} onChange={(e) => setSettings({ ...settings, multiplier_baki: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Sợi thủy tinh (VNĐ/m²)</Label>
              <Input type="number" value={settings.multiplier_fiberglass} onChange={(e) => setSettings({ ...settings, multiplier_fiberglass: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Bể cá</Label>
              <Input type="number" step="0.1" value={settings.multiplier_aquarium} onChange={(e) => setSettings({ ...settings, multiplier_aquarium: parseFloat(e.target.value) })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cài đặt khác</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Giá tối thiểu (VNĐ)</Label>
              <Input type="number" value={settings.min_charge} onChange={(e) => setSettings({ ...settings, min_charge: parseFloat(e.target.value) })} />
            </div>
            <div>
              <Label>Làm tròn giá</Label>
              <Select value={settings.rounding_mode} onValueChange={(value: '1000' | '5000' | '10000') => setSettings({ ...settings, rounding_mode: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1.000đ</SelectItem>
                  <SelectItem value="5000">5.000đ</SelectItem>
                  <SelectItem value="10000">10.000đ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={saveSettings}>Lưu cài đặt</Button>
          <Button variant="outline" onClick={resetToDefaults}>Khôi phục mặc định</Button>
        </div>
      </div>
    </div>
  );
}
