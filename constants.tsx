import React from 'react';
import {
  Wallet,
  TrendingUp,
  Briefcase,
  DollarSign,
  Home,
  Utensils,
  Car,
  HeartPulse,
  Coffee,
  Zap,
  GraduationCap,
  ShoppingBag,
  MoreHorizontal,
  Dog,
  Plane,
  Gamepad2,
  Smartphone,
  Gift
} from 'lucide-react';
import { Category } from './types';

// Icon Mapping
export const ICON_MAP: Record<string, React.ElementType> = {
  Wallet,
  TrendingUp,
  Briefcase,
  DollarSign,
  Home,
  Utensils,
  Car,
  HeartPulse,
  Coffee,
  Zap,
  GraduationCap,
  ShoppingBag,
  MoreHorizontal,
  Dog,
  Plane,
  Gamepad2,
  Smartphone,
  Gift
};

export const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { id: 'inc-1', name: 'Salário', color: '#10b981', iconKey: 'Wallet', type: 'income', isDefault: true },
  { id: 'inc-2', name: 'Investimentos', color: '#3b82f6', iconKey: 'TrendingUp', type: 'income', isDefault: true },
  { id: 'inc-3', name: 'Freelance', color: '#8b5cf6', iconKey: 'Briefcase', type: 'income', isDefault: true },
  { id: 'inc-4', name: 'Outros', color: '#64748b', iconKey: 'DollarSign', type: 'income', isDefault: true },
  // Expense
  { id: 'exp-1', name: 'Alimentação', color: '#f43f5e', iconKey: 'Utensils', type: 'expense', isDefault: true },
  { id: 'exp-2', name: 'Moradia', color: '#ea580c', iconKey: 'Home', type: 'expense', isDefault: true },
  { id: 'exp-3', name: 'Transporte', color: '#0ea5e9', iconKey: 'Car', type: 'expense', isDefault: true },
  { id: 'exp-4', name: 'Saúde', color: '#ef4444', iconKey: 'HeartPulse', type: 'expense', isDefault: true },
  { id: 'exp-5', name: 'Lazer', color: '#d946ef', iconKey: 'Coffee', type: 'expense', isDefault: true },
  { id: 'exp-6', name: 'Contas', color: '#f59e0b', iconKey: 'Zap', type: 'expense', isDefault: true },
  { id: 'exp-7', name: 'Educação', color: '#6366f1', iconKey: 'GraduationCap', type: 'expense', isDefault: true },
  { id: 'exp-8', name: 'Compras', color: '#ec4899', iconKey: 'ShoppingBag', type: 'expense', isDefault: true },
  { id: 'exp-9', name: 'Outros', color: '#94a3b8', iconKey: 'MoreHorizontal', type: 'expense', isDefault: true },
];

export const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#d946ef', '#f43f5e', '#64748b'
];

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);