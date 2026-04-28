import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  condition: 'Baru' | 'Bekas';
  category: string;
  description: string;
  minus: string;
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  sellerAvatar: string;
  status: 'active' | 'sold';
  createdAt: string;
}

export interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
  senderName?: string;
}

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
