/**
 * Zone Utilities
 *
 * Centralized utilities for zone-related operations, styling, and logic.
 * Eliminates duplication of zone colors, labels, and behaviors across components.
 */

import { ZoneType } from '@/lib/types';

/**
 * Zone color configurations for different contexts
 */
export const ZONE_COLORS = {
  [ZoneType.Green]: {
    background: 'bg-[#154734]/10 dark:bg-[#154734]/30',
    backgroundSolid: 'bg-[#154734]',
    text: 'text-green-zone dark:text-[#7FD4B8]',
    textContrast: 'text-white',
    border: 'border-[#154734] dark:border-[#7FD4B8]',
    hover: 'hover:bg-[#154734]/20 dark:hover:bg-[#154734]/40',
    ring: 'ring-[#154734]/30 dark:ring-[#7FD4B8]/30',
    hex: '#154734',
    hexLight: '#7FD4B8',
  },
  [ZoneType.Yellow]: {
    background: 'bg-[#FFD100]/10 dark:bg-[#FFD100]/30',
    backgroundSolid: 'bg-[#FFD100]',
    text: 'text-yellow-zone dark:text-yellow-400',
    textContrast: 'text-black',
    border: 'border-[#FFD100] dark:border-yellow-400',
    hover: 'hover:bg-[#FFD100]/20 dark:hover:bg-[#FFD100]/40',
    ring: 'ring-[#FFD100]/30 dark:ring-yellow-400/30',
    hex: '#FFD100',
    hexLight: '#FFE66D',
  },
  [ZoneType.Red]: {
    background: 'bg-[#DC582A]/10 dark:bg-[#DC582A]/30',
    backgroundSolid: 'bg-[#DC582A]',
    text: 'text-red-zone dark:text-red-400',
    textContrast: 'text-white',
    border: 'border-[#DC582A] dark:border-red-400',
    hover: 'hover:bg-[#DC582A]/20 dark:hover:bg-[#DC582A]/40',
    ring: 'ring-[#DC582A]/30 dark:ring-red-400/30',
    hex: '#DC582A',
    hexLight: '#FF6B35',
  },
} as const;

/**
 * Zone labels and descriptions
 */
export const ZONE_INFO = {
  [ZoneType.Green]: {
    label: 'Green Zone',
    shortLabel: 'Green',
    description: 'Feeling calm and in control',
    emoji: '😊',
    checkInPrompt: "Great to hear you're feeling good! Let's capture this moment.",
    strategyPrompt: 'What helps you stay in the green zone?',
  },
  [ZoneType.Yellow]: {
    label: 'Yellow Zone',
    shortLabel: 'Yellow',
    description: 'Starting to feel stressed or anxious',
    emoji: '😟',
    checkInPrompt: "Let's identify what's happening and how to help.",
    strategyPrompt: 'What helps you calm down when stressed?',
  },
  [ZoneType.Red]: {
    label: 'Red Zone',
    shortLabel: 'Red',
    description: 'Feeling overwhelmed or in crisis',
    emoji: '😰',
    checkInPrompt: "You're not alone. Let's get you support.",
    strategyPrompt: 'What helps in moments of crisis?',
  },
} as const;

/**
 * Get zone-specific color classes
 */
export function getZoneColors(
  zone: ZoneType,
  variant: 'background' | 'text' | 'border' | 'solid' = 'background'
): string {
  const colors = ZONE_COLORS[zone];

  switch (variant) {
    case 'background':
      return colors.background;
    case 'text':
      return colors.text;
    case 'border':
      return colors.border;
    case 'solid':
      return colors.backgroundSolid;
    default:
      return colors.background;
  }
}

/**
 * Get complete zone styling for cards/containers
 */
export function getZoneCardStyles(zone: ZoneType, interactive = false): string {
  const colors = ZONE_COLORS[zone];
  const baseStyles = `${colors.background} ${colors.text} ${colors.border} border`;

  if (interactive) {
    return `${baseStyles} ${colors.hover} transition-colors cursor-pointer`;
  }

  return baseStyles;
}

/**
 * Get zone button styles
 */
export function getZoneButtonStyles(
  zone: ZoneType,
  variant: 'outline' | 'solid' = 'outline'
): string {
  const colors = ZONE_COLORS[zone];

  if (variant === 'solid') {
    return `${colors.backgroundSolid} ${colors.textContrast} ${colors.hover} transition-colors`;
  }

  return `${colors.border} border-2 ${colors.text} ${colors.hover} transition-colors`;
}

/**
 * Get zone label and description
 */
export function getZoneLabel(zone: ZoneType, format: 'full' | 'short' = 'full'): string {
  const info = ZONE_INFO[zone];
  return format === 'full' ? info.label : info.shortLabel;
}

export function getZoneDescription(zone: ZoneType): string {
  return ZONE_INFO[zone].description;
}

export function getZoneEmoji(zone: ZoneType): string {
  return ZONE_INFO[zone].emoji;
}

export function getZonePrompt(zone: ZoneType, type: 'checkIn' | 'strategy' = 'checkIn'): string {
  const info = ZONE_INFO[zone];
  return type === 'checkIn' ? info.checkInPrompt : info.strategyPrompt;
}

/**
 * Determine zone based on score or mood indicators
 */
export function calculateZoneFromMood(moodScore: number): ZoneType {
  if (moodScore >= 7) return ZoneType.Green;
  if (moodScore >= 4) return ZoneType.Yellow;
  return ZoneType.Red;
}

/**
 * Get contrasting text color for zone backgrounds
 */
export function getZoneContrastText(zone: ZoneType, onSolid = false): string {
  if (onSolid) {
    return ZONE_COLORS[zone].textContrast;
  }
  return ZONE_COLORS[zone].text;
}

/**
 * Zone priority for sorting (Red > Yellow > Green)
 */
export const ZONE_PRIORITY: Record<ZoneType, number> = {
  [ZoneType.Red]: 3,
  [ZoneType.Yellow]: 2,
  [ZoneType.Green]: 1,
};

/**
 * Sort items by zone priority
 */
export function sortByZonePriority<T extends { zone: ZoneType }>(items: T[]): T[] {
  return [...items].sort((a, b) => ZONE_PRIORITY[b.zone] - ZONE_PRIORITY[a.zone]);
}

/**
 * Get appropriate icon name for zone
 */
export function getZoneIcon(zone: ZoneType): string {
  switch (zone) {
    case ZoneType.Green:
      return 'check-circle';
    case ZoneType.Yellow:
      return 'alert-triangle';
    case ZoneType.Red:
      return 'alert-circle';
    default:
      return 'help-circle';
  }
}

/**
 * Check if user needs immediate support based on zone
 */
export function needsImmediateSupport(zone: ZoneType): boolean {
  return zone === ZoneType.Red;
}

/**
 * Get crisis resources for zone
 */
export function getCrisisResources(zone: ZoneType) {
  if (zone === ZoneType.Red) {
    return {
      show: true,
      resources: [
        { name: '988 Suicide & Crisis Lifeline', number: '988', action: 'tel:988' },
        { name: 'Crisis Text Line', number: '741741', action: 'sms:741741' },
        { name: 'Emergency Services', number: '911', action: 'tel:911' },
      ],
      message: 'If you need immediate help, please reach out:',
    };
  }

  if (zone === ZoneType.Yellow) {
    return {
      show: true,
      resources: [
        { name: 'Crisis Text Line', number: '741741', action: 'sms:741741' },
        { name: '988 Suicide & Crisis Lifeline', number: '988', action: 'tel:988' },
      ],
      message: 'Remember, support is available if you need it:',
    };
  }

  return {
    show: false,
    resources: [],
    message: '',
  };
}

/**
 * Zone transition helpers
 */
export function canTransitionZone(fromZone: ZoneType, toZone: ZoneType): boolean {
  // Allow any transition for now, but this could enforce rules
  return fromZone !== toZone;
}

export function getZoneTransitionMessage(fromZone: ZoneType, toZone: ZoneType): string {
  const fromPriority = ZONE_PRIORITY[fromZone];
  const toPriority = ZONE_PRIORITY[toZone];

  if (toPriority < fromPriority) {
    // Improving
    return "Great progress! You're moving in the right direction.";
  } else if (toPriority > fromPriority) {
    // Declining
    return "It's okay to have tough moments. Let's work through this together.";
  }

  return 'Thanks for checking in. How can we help?';
}
