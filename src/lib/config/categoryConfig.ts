/**
 * Category configuration for coping strategies
 * Provides consistent visual styling (icons, colors, labels) across the application
 */

import { Activity, Brain, Heart, Palette, Sparkles, Users } from 'lucide-react';
import { CopingStrategyCategory } from '@/lib/types';

export interface CategoryConfig {
  icon: React.ElementType;
  color: string;
  label: string;
  iconColor?: string;
}

/**
 * Visual configuration for each coping strategy category
 * Colors are chosen for accessibility (WCAG 2.1 AA) and UVM branding alignment
 */
export const categoryConfig: Record<CopingStrategyCategory, CategoryConfig> = {
  [CopingStrategyCategory.Breathing]: {
    icon: Activity,
    color: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
    iconColor: 'text-sky-600 dark:text-sky-400',
    label: 'Breathing',
  },
  [CopingStrategyCategory.Physical]: {
    icon: Activity,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'Physical',
  },
  [CopingStrategyCategory.Social]: {
    icon: Users,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    iconColor: 'text-purple-600 dark:text-purple-400',
    label: 'Social',
  },
  [CopingStrategyCategory.Emotional]: {
    icon: Heart,
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    iconColor: 'text-pink-600 dark:text-pink-400',
    label: 'Emotional',
  },
  [CopingStrategyCategory.Cognitive]: {
    icon: Brain,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    label: 'Cognitive',
  },
  [CopingStrategyCategory.Sensory]: {
    icon: Sparkles,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    iconColor: 'text-amber-600 dark:text-amber-400',
    label: 'Sensory',
  },
  [CopingStrategyCategory.Creative]: {
    icon: Palette,
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    iconColor: 'text-teal-600 dark:text-teal-400',
    label: 'Creative',
  },
  [CopingStrategyCategory.Spiritual]: {
    icon: Sparkles,
    color: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    iconColor: 'text-violet-600 dark:text-violet-400',
    label: 'Spiritual',
  },
  [CopingStrategyCategory.Other]: {
    icon: Sparkles,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    iconColor: 'text-gray-600 dark:text-gray-400',
    label: 'Other',
  },
};

/**
 * Get category configuration by category enum value
 */
export function getCategoryConfig(category: CopingStrategyCategory): CategoryConfig {
  return categoryConfig[category];
}
