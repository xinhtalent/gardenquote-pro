import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumberWithThousands(value: number | string): string {
  // Remove all non-digit characters except decimal point
  const cleanValue = typeof value === 'string' ? value.replace(/[^\d.]/g, '') : String(value);
  const num = parseFloat(cleanValue);
  if (isNaN(num) || cleanValue === '') return '';
  // Format with thousand separators
  return Math.floor(num).toLocaleString('vi-VN');
}

export function parseFormattedNumber(value: string): number {
  // Remove all non-digit characters except decimal point
  const cleanValue = value.replace(/[^\d.]/g, '');
  return parseFloat(cleanValue) || 0;
}
