import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumberWithThousands(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('vi-VN');
}

export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/,/g, '').replace(/\./g, '');
  return parseFloat(cleaned) || 0;
}
