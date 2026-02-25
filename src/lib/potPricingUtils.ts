/**
 * Pot Pricing Calculation Utilities
 * Based on customizable pot pricing formula system
 */

export type PotType = 
  | 'regular'       // Chậu thường
  | 'curved'        // Chậu cong
  | 'landscape'     // Tiểu cảnh
  | 'fence'         // Hàng rào
  | 'baki'          // Baki
  | 'fiberglass'    // Sợi thủy tinh
  | 'aquarium';     // Bể cá

export const POT_TYPE_LABELS: Record<PotType, string> = {
  regular: 'Chậu thường',
  curved: 'Chậu cong',
  landscape: 'Tiểu cảnh',
  fence: 'Hàng rào',
  baki: 'Baki',
  fiberglass: 'Sợi thủy tinh',
  aquarium: 'Bể cá',
};

export interface PotPricingSettings {
  // Material pricing by thickness (VNĐ per m²)
  price_08cm: number;
  price_10cm: number;
  price_12cm: number;
  price_15cm: number;
  price_17cm: number;
  
  // Multipliers
  multiplier_regular_low: number;    // <150k
  multiplier_regular_mid: number;    // 150k-<300k
  multiplier_regular_high: number;   // ≥300k
  multiplier_curved: number;
  multiplier_landscape: number;
  multiplier_fence: number;
  multiplier_baki: number;
  multiplier_fiberglass: number;     // Special: price per 10,000 m²
  multiplier_aquarium: number;
  
  // Thresholds
  threshold_low: number;
  threshold_high: number;
  
  // Other settings
  min_charge: number;
  rounding_mode: '1000' | '5000' | '10000';
}

export const DEFAULT_POT_PRICING_SETTINGS: PotPricingSettings = {
  price_08cm: 205290,
  price_10cm: 242620,
  price_12cm: 283670,
  price_15cm: 354590,
  price_17cm: 410580,
  
  multiplier_regular_low: 2.4,
  multiplier_regular_mid: 2.2,
  multiplier_regular_high: 2.0,
  multiplier_curved: 3.0,
  multiplier_landscape: 3.0,
  multiplier_fence: 2.6,
  multiplier_baki: 3.0,
  multiplier_fiberglass: 1250000,
  multiplier_aquarium: 3.5,
  
  threshold_low: 150000,
  threshold_high: 300000,
  
  min_charge: 0,
  rounding_mode: '1000',
};

/**
 * Get material price per m² based on thickness in mm
 */
export function getMaterialPriceByThickness(
  thicknessMm: number,
  settings: PotPricingSettings
): number {
  const thicknessCm = thicknessMm / 10;
  
  // Find closest thickness
  if (thicknessCm <= 0.8) return settings.price_08cm;
  if (thicknessCm <= 1.0) return settings.price_10cm;
  if (thicknessCm <= 1.2) return settings.price_12cm;
  if (thicknessCm <= 1.5) return settings.price_15cm;
  return settings.price_17cm;
}

/**
 * Calculate surface area M (in cm²)
 * Formula: M = (D×R) + 2×(D×C) + 2×(R×C) + 4×(D + R)
 * All dimensions in cm, result in cm²
 */
export function calculateSurfaceArea(
  lengthCm: number,
  widthCm: number,
  heightCm: number
): number {
  const D = lengthCm;
  const R = widthCm;
  const C = heightCm;
  
  const M = (D * R) + 2 * (D * C) + 2 * (R * C) + 4 * (D + R);
  return M;
}

/**
 * Calculate material cost
 * Material Cost = (Surface Area in cm² / 10,000) × Material Price per m²
 */
export function calculateMaterialCost(
  surfaceAreaCm2: number,
  materialPricePerM2: number
): number {
  return (surfaceAreaCm2 / 10000) * materialPricePerM2;
}

/**
 * Get multiplier for pot type based on material cost
 */
export function getMultiplier(
  potType: PotType,
  materialCost: number,
  settings: PotPricingSettings,
  layers: number = 1
): { multiplier: number; note?: string } {
  switch (potType) {
    case 'regular':
      if (materialCost < settings.threshold_low) {
        return { 
          multiplier: settings.multiplier_regular_low,
          note: `×${settings.multiplier_regular_low} (<${formatCurrency(settings.threshold_low)})`
        };
      } else if (materialCost < settings.threshold_high) {
        return { 
          multiplier: settings.multiplier_regular_mid,
          note: `×${settings.multiplier_regular_mid} (${formatCurrency(settings.threshold_low)}–<${formatCurrency(settings.threshold_high)})`
        };
      } else {
        return { 
          multiplier: settings.multiplier_regular_high,
          note: `×${settings.multiplier_regular_high} (≥${formatCurrency(settings.threshold_high)})`
        };
      }
    
    case 'curved':
      return { multiplier: settings.multiplier_curved, note: `×${settings.multiplier_curved}` };
    
    case 'landscape':
      return { multiplier: settings.multiplier_landscape, note: `×${settings.multiplier_landscape}` };
    
    case 'fence':
      return { multiplier: settings.multiplier_fence, note: `×${settings.multiplier_fence}` };
    
    case 'baki':
      const bakiMultiplier = settings.multiplier_baki * layers;
      return { multiplier: bakiMultiplier, note: `×${settings.multiplier_baki} × ${layers} tầng` };
    
    case 'fiberglass':
      // Special formula: not using standard multiplier
      return { multiplier: 0, note: 'Công thức riêng' };
    
    case 'aquarium':
      return { multiplier: settings.multiplier_aquarium, note: `×${settings.multiplier_aquarium}` };
    
    default:
      return { multiplier: 1 };
  }
}

/**
 * Calculate unit price for a pot
 */
export function calculatePotUnitPrice(
  potType: PotType,
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  thicknessMm: number,
  settings: PotPricingSettings,
  layers: number = 1
): { unitPrice: number; breakdown: string } {
  // Calculate surface area in cm²
  const surfaceAreaCm2 = calculateSurfaceArea(lengthCm, widthCm, heightCm);
  const surfaceAreaM2 = surfaceAreaCm2 / 10000;
  
  // Special case for fiberglass
  if (potType === 'fiberglass') {
    const unitPrice = surfaceAreaM2 * settings.multiplier_fiberglass;
    const rounded = roundPrice(Math.max(unitPrice, settings.min_charge), settings.rounding_mode);
    const minChargeNote = unitPrice < settings.min_charge ? ` → áp dụng giá tối thiểu ${formatCurrency(settings.min_charge)}` : '';
    return {
      unitPrice: rounded,
      breakdown: `DT: ${surfaceAreaM2.toFixed(2)} m² × ${formatCurrency(settings.multiplier_fiberglass)}/m² = ${formatCurrency(unitPrice)}${minChargeNote}`
    };
  }
  
  // Get material price per m²
  const materialPrice = getMaterialPriceByThickness(thicknessMm, settings);
  
  // Calculate material cost
  const materialCost = calculateMaterialCost(surfaceAreaCm2, materialPrice);
  
  // Get multiplier
  const { multiplier, note } = getMultiplier(potType, materialCost, settings, layers);
  
  // Calculate unit price
  const unitPrice = materialCost * multiplier;
  const rounded = roundPrice(Math.max(unitPrice, settings.min_charge), settings.rounding_mode);
  
  const minChargeNote = unitPrice < settings.min_charge ? ` → áp dụng giá tối thiểu ${formatCurrency(settings.min_charge)}` : '';
  
  return {
    unitPrice: rounded,
    breakdown: `DT: ${surfaceAreaM2.toFixed(2)} m² × ${formatCurrency(materialPrice)}/m² = ${formatCurrency(materialCost)} ${note ? '→ ' + note : ''} = ${formatCurrency(unitPrice)}${minChargeNote}`
  };
}

/**
 * Round price based on rounding mode
 */
export function roundPrice(price: number, mode: '1000' | '5000' | '10000'): number {
  const roundTo = parseInt(mode);
  return Math.round(price / roundTo) * roundTo;
}

/**
 * Format currency (short version)
 */
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}tr`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
}
