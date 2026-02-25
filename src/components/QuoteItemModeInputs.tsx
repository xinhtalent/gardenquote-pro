import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateArea, parseLengthToCm, parseThicknessToMm, cmToMeters } from "@/lib/dimensionUtils";
import { useState, useEffect, useRef } from "react";
import { calculatePotUnitPrice, DEFAULT_POT_PRICING_SETTINGS, type PotType } from "@/lib/potPricingUtils";
import { supabase } from "@/integrations/supabase/client";

interface QuoteItemModeInputsProps {
  mode: 'standard' | 'auto_quantity' | 'customizable';
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  dimensions?: {
    dimension_1: number | null;
    dimension_2: number | null;
  };
  onDimensionsChange?: (dim1: number | null, dim2: number | null) => void;
  variants?: {
    length: number | null;
    width: number | null;
    height: number | null;
    thickness: number | null;
    color: string | null;
    layers: number | null;
  };
  onVariantsChange?: (variants: any) => void;
  potType?: PotType | null;
  onUnitPriceChange?: (price: number) => void;
}

export function QuoteItemModeInputs({
  mode,
  quantity,
  onQuantityChange,
  dimensions,
  onDimensionsChange,
  variants,
  onVariantsChange,
  potType,
  onUnitPriceChange,
}: QuoteItemModeInputsProps) {
  const [dim1Input, setDim1Input] = useState<string>('');
  const [dim2Input, setDim2Input] = useState<string>('');
  const [quantityLocked, setQuantityLocked] = useState(false);
  const [quantityText, setQuantityText] = useState<string>('');

  const [lengthInput, setLengthInput] = useState<string>('');
  const [widthInput, setWidthInput] = useState<string>('');
  const [heightInput, setHeightInput] = useState<string>('');
  const [thicknessInput, setThicknessInput] = useState<string>('');
  const [colorInput, setColorInput] = useState<string>('');
  const [layersInput, setLayersInput] = useState<string>('');
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [priceBreakdown, setPriceBreakdown] = useState<string>('');
  const [availableThicknesses] = useState<{value: string, label: string}[]>([
    { value: '8', label: '0.8 cm (8 mm)' },
    { value: '10', label: '1.0 cm (10 mm)' },
    { value: '12', label: '1.2 cm (12 mm)' },
    { value: '15', label: '1.5 cm (15 mm)' },
    { value: '17', label: '1.7 cm (17 mm)' },
  ]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializedDimsRef = useRef(false);
  const initializedVariantsRef = useRef(false);

  // Initialize inputs from props (only on mount or when props actually change)
  useEffect(() => {
    if (initializedDimsRef.current) return;
    if (dimensions) {
      if (dimensions.dimension_1 !== null) {
        setDim1Input(String(Math.round(dimensions.dimension_1 * 100 * 100) / 100)); // meters -> cm
      }
      if (dimensions.dimension_2 !== null) {
        setDim2Input(String(Math.round(dimensions.dimension_2 * 100 * 100) / 100)); // meters -> cm
      }
    }
    initializedDimsRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions]);

  // Initialize variant inputs when variants prop is available
  useEffect(() => {
    if (initializedVariantsRef.current || !variants) return;
    if (variants.length !== null) setLengthInput(String(variants.length));
    if (variants.width !== null) setWidthInput(String(variants.width));
    if (variants.height !== null) setHeightInput(String(variants.height));
    if (variants.thickness !== null) setThicknessInput(String(variants.thickness));
    if (variants.color) setColorInput(variants.color);
    if (variants.layers !== null) setLayersInput(String(variants.layers));
    initializedVariantsRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants]);

  // Sync quantity text while editable
  useEffect(() => {
    if (!quantityLocked) {
      setQuantityText(String(quantity));
    }
  }, [quantity, quantityLocked]);

  // Handle auto_quantity mode: only compute on blur; keep inputs in cm
  useEffect(() => {
    if (mode !== 'auto_quantity' || !onDimensionsChange) return;

    // Update stored dimensions in meters but do not compute quantity here
    const dim1Cm = parseLengthToCm(dim1Input);
    const dim2Cm = parseLengthToCm(dim2Input);
    const dim1 = dim1Cm !== null ? cmToMeters(dim1Cm) : null;
    const dim2 = dim2Cm !== null ? cmToMeters(dim2Cm) : null;
    onDimensionsChange(dim1, dim2);

    // Ensure quantity remains editable if any dimension is missing/invalid
    if (!(dim1 !== null && dim2 !== null && dim1 > 0 && dim2 > 0)) {
      setQuantityLocked(false);
    }
  }, [dim1Input, dim2Input, mode, onDimensionsChange]);

  // Save variants immediately (no debounce for data saving)
  useEffect(() => {
    if (mode !== 'customizable' || !onVariantsChange) return;

    const length = parseLengthToCm(lengthInput);
    const width = parseLengthToCm(widthInput);
    const height = parseLengthToCm(heightInput);
    const thickness = parseThicknessToMm(thicknessInput);
    const layers = layersInput ? parseInt(layersInput) : 1;
    
    // Save variants immediately - no debounce for data
    onVariantsChange({
      length,
      width,
      height,
      thickness,
      color: colorInput.trim() || null,
      layers,
    });
  }, [lengthInput, widthInput, heightInput, thicknessInput, colorInput, layersInput, mode, onVariantsChange]);

  // Calculate price with debounce (for performance)
  useEffect(() => {
    if (mode !== 'customizable') return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const length = parseLengthToCm(lengthInput);
      const width = parseLengthToCm(widthInput);
      const height = parseLengthToCm(heightInput);
      const thickness = parseThicknessToMm(thicknessInput);
      const layers = layersInput ? parseInt(layersInput) : 1;

      // Calculate pot price if all dimensions are available
      if (potType && length && width && height && thickness && length > 0 && width > 0 && height > 0 && thickness > 0) {
        try {
          // Fetch pricing settings
          const { data: settings } = await supabase
            .from('pot_pricing_settings')
            .select('*')
            .limit(1)
            .single();

          const pricingSettings = settings ? {
            ...settings,
            rounding_mode: settings.rounding_mode as '1000' | '5000' | '10000'
          } : DEFAULT_POT_PRICING_SETTINGS;
          
          const result = calculatePotUnitPrice(
            potType,
            length,
            width,
            height,
            thickness,
            pricingSettings,
            layers
          );

          setCalculatedPrice(result.unitPrice);
          setPriceBreakdown(result.breakdown);
          
          if (onUnitPriceChange) {
            onUnitPriceChange(result.unitPrice);
          }
        } catch (error) {
          console.error('Error calculating pot price:', error);
        }
      } else {
        setCalculatedPrice(null);
        setPriceBreakdown('');
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [lengthInput, widthInput, heightInput, thicknessInput, colorInput, layersInput, mode, potType, onUnitPriceChange]);

  const calculatePriceWithValues = async (
    lengthVal: string,
    widthVal: string,
    heightVal: string,
    thicknessVal: string,
    layersVal: string
  ) => {
    if (mode !== 'customizable') return;
    
    const length = parseLengthToCm(lengthVal);
    const width = parseLengthToCm(widthVal);
    const height = parseLengthToCm(heightVal);
    const thickness = parseThicknessToMm(thicknessVal);
    const layers = layersVal ? parseInt(layersVal) : 1;

    // Calculate pot price immediately
    if (potType && length && width && height && thickness && length > 0 && width > 0 && height > 0 && thickness > 0) {
      try {
        const { data: settings } = await supabase
          .from('pot_pricing_settings')
          .select('*')
          .limit(1)
          .single();

        const pricingSettings = settings ? {
          ...settings,
          rounding_mode: settings.rounding_mode as '1000' | '5000' | '10000'
        } : DEFAULT_POT_PRICING_SETTINGS;
        
        const result = calculatePotUnitPrice(
          potType,
          length,
          width,
          height,
          thickness,
          pricingSettings,
          layers
        );

        setCalculatedPrice(result.unitPrice);
        setPriceBreakdown(result.breakdown);
        
        if (onUnitPriceChange) {
          onUnitPriceChange(result.unitPrice);
        }
      } catch (error) {
        console.error('Error calculating pot price:', error);
      }
    }
  };

  const handleVariantBlur = async () => {
    if (mode !== 'customizable') return;
    // Cancel pending debounce to calculate price immediately on blur
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    await calculatePriceWithValues(lengthInput, widthInput, heightInput, thicknessInput, layersInput);
  };

  const handleDimBlur = () => {
    if (mode !== 'auto_quantity') return;
    // Cancel pending debounce to compute immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const dim1Cm = parseLengthToCm(dim1Input);
    const dim2Cm = parseLengthToCm(dim2Input);
    const dim1 = dim1Cm !== null ? cmToMeters(dim1Cm) : null;
    const dim2 = dim2Cm !== null ? cmToMeters(dim2Cm) : null;

    if (dim1 !== null && dim2 !== null && dim1 > 0 && dim2 > 0) {
      const area = calculateArea(dim1, dim2);
      if (area !== null) {
        onQuantityChange(area);
        setQuantityLocked(true);
      }
    } else {
      setQuantityLocked(false);
    }
  };

  if (mode === 'auto_quantity') {
    return (
      <div className="space-y-3 mt-3 p-3 border border-border rounded-lg bg-secondary/20">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Kích thước 1 (cm)</Label>
            <Input
              type="text"
              value={dim1Input}
              onChange={(e) => {
                setDim1Input(e.target.value);
                setQuantityLocked(false);
              }}
              onBlur={handleDimBlur}
              placeholder="VD: 250 (cm)"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Kích thước 2 (cm)</Label>
            <Input
              type="text"
              value={dim2Input}
              onChange={(e) => {
                setDim2Input(e.target.value);
                setQuantityLocked(false);
              }}
              onBlur={handleDimBlur}
              placeholder="VD: 150 (cm)"
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Số lượng (m²) {quantityLocked && '(Tự động tính)'}</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={quantityLocked ? quantity.toFixed(2) : quantityText}
            onChange={(e) => {
              if (!quantityLocked) {
                setQuantityText(e.target.value);
              }
            }}
            onBlur={(e) => {
              if (!quantityLocked) {
                const raw = e.target.value.replace(',', '.');
                const val = parseFloat(raw);
                if (!isNaN(val)) {
                  onQuantityChange(val);
                  setQuantityText(String(val));
                } else {
                  onQuantityChange(0);
                  setQuantityText('');
                }
              }
            }}
            readOnly={quantityLocked}
            className={`mt-1 ${quantityLocked ? 'bg-muted cursor-not-allowed' : ''}`}
          />
          {quantityLocked && (
            <p className="text-xs text-muted-foreground mt-1">
              Xóa kích thước để nhập số lượng thủ công
            </p>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'customizable') {
    return (
      <div className="space-y-3 mt-3 p-3 border border-border rounded-lg bg-secondary/20">
        <p className="text-xs font-semibold text-muted-foreground">Thông số biến thể (tùy chọn)</p>
        
        {/* Quantity field */}
        <div>
          <Label className="text-xs">Số lượng</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={quantityText}
            onChange={(e) => {
              setQuantityText(e.target.value);
            }}
            onBlur={(e) => {
              const raw = e.target.value.replace(',', '.');
              const val = parseFloat(raw);
              if (!isNaN(val)) {
                onQuantityChange(val);
                setQuantityText(String(val));
              } else {
                onQuantityChange(1);
                setQuantityText('1');
              }
            }}
            placeholder="VD: 1"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Dài (cm) *</Label>
            <Input
              type="text"
              value={lengthInput}
              onChange={(e) => setLengthInput(e.target.value)}
              onBlur={handleVariantBlur}
              placeholder="VD: 250"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Rộng (cm) *</Label>
            <Input
              type="text"
              value={widthInput}
              onChange={(e) => setWidthInput(e.target.value)}
              onBlur={handleVariantBlur}
              placeholder="VD: 150"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Cao (cm) *</Label>
            <Input
              type="text"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              onBlur={handleVariantBlur}
              placeholder="VD: 80"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Độ dày (mm) *</Label>
            <Select value={thicknessInput} onValueChange={(value) => {
              setThicknessInput(value);
              
              // Save variants immediately with the new thickness value
              const length = parseLengthToCm(lengthInput);
              const width = parseLengthToCm(widthInput);
              const height = parseLengthToCm(heightInput);
              const thickness = parseThicknessToMm(value); // Use new value directly
              const layers = layersInput ? parseInt(layersInput) : 1;
              
              if (onVariantsChange) {
                onVariantsChange({
                  length,
                  width,
                  height,
                  thickness,
                  color: colorInput.trim() || null,
                  layers,
                });
              }
              
              // Calculate price immediately with the new value
              calculatePriceWithValues(lengthInput, widthInput, heightInput, value, layersInput);
            }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Chọn độ dày" />
              </SelectTrigger>
              <SelectContent>
                {availableThicknesses.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {potType === 'baki' && (
          <div>
            <Label className="text-xs">Số tầng</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={layersInput}
              onChange={(e) => setLayersInput(e.target.value)}
              onBlur={handleVariantBlur}
              placeholder="VD: 3"
              className="mt-1"
            />
          </div>
        )}

        <div>
          <Label className="text-xs">Màu sắc</Label>
          <Input
            type="text"
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            onBlur={handleVariantBlur}
            placeholder="VD: Trắng, Xanh lá..."
            className="mt-1"
          />
        </div>

        {calculatedPrice !== null && (
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">Đơn giá tự động:</span>
              <span className="text-sm font-bold text-primary">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculatedPrice)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{priceBreakdown}</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
