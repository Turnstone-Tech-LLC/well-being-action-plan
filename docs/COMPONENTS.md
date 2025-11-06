# Component Library Documentation

This document describes the reusable UI component library built for the Well-Being Action Plan application.

## Overview

The component library is built on top of [shadcn/ui](https://ui.shadcn.com/), leveraging Tailwind CSS for styling and Radix UI for accessible component primitives. All components follow a mobile-first responsive design approach.

## Table of Contents

- [Design System](#design-system)
- [Core Components](#core-components)
- [Custom Components](#custom-components)
- [Usage Examples](#usage-examples)

## Design System

### Color System

The application uses a semantic color system defined in CSS variables:

- **Primary**: Main brand color used for primary actions
- **Secondary**: Supporting color for secondary elements
- **Destructive**: Used for error states and destructive actions
- **Muted**: Subtle backgrounds and borders
- **Accent**: Highlights and hover states

### Zone-Specific Colors

Each emotional regulation zone has its own color scheme:

- **Green Zone**: `green-*` colors - positive, stable state
- **Yellow Zone**: `yellow-*` colors - warning, caution state
- **Red Zone**: `red-*` colors - crisis, alert state

### Category Colors

Coping strategy categories use distinct colors:

- **Physical**: Blue (`blue-*`)
- **Social**: Purple (`purple-*`)
- **Emotional**: Pink (`pink-*`)
- **Cognitive**: Indigo (`indigo-*`)
- **Sensory**: Amber (`amber-*`)
- **Creative**: Teal (`teal-*`)
- **Spiritual**: Violet (`violet-*`)
- **Other**: Gray (`gray-*`)

### Typography

- **Base size**: 16px (1rem)
- **Scale**: Uses Tailwind's default type scale
- **Headings**: Font weight 600-700
- **Body**: Font weight 400
- **Line height**: 1.5 for body text, tighter for headings

### Spacing

Uses Tailwind's default spacing scale (0.25rem increments):

- **Component padding**: `p-6` (1.5rem)
- **Component gap**: `gap-2` to `gap-4` (0.5rem - 1rem)
- **Section spacing**: `space-y-4` to `space-y-6`

### Border Radius

- **Large**: `rounded-lg` - for cards and major containers
- **Medium**: `rounded-md` - for buttons and inputs
- **Small**: `rounded-sm` - for badges and small elements

## Core Components

### Button

A versatile button component with multiple variants and sizes.

**Variants:**
- `default` - Primary button style
- `secondary` - Secondary button style
- `outline` - Outlined button
- `ghost` - Minimal, transparent button
- `destructive` - For delete/remove actions
- `link` - Text-only link style

**Sizes:**
- `sm` - Small button
- `default` - Standard button
- `lg` - Large button
- `icon` - Square button for icons

**Example:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg">
  Click me
</Button>
```

### Card

A flexible card container with header, content, and footer sections.

**Sub-components:**
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Description text
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Example:**
```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

### Input

A styled text input component.

**Example:**
```tsx
import { Input } from '@/components/ui/input';

<Input type="text" placeholder="Enter text..." />
```

### Badge

A small badge for labels and tags.

**Variants:**
- `default` - Primary badge
- `secondary` - Secondary badge
- `outline` - Outlined badge
- `destructive` - Error/warning badge

**Example:**
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="outline">Label</Badge>
```

### Dialog

A modal dialog component built on Radix UI Dialog.

**Sub-components:**
- `Dialog` - Root component
- `DialogTrigger` - Trigger button
- `DialogContent` - Content container
- `DialogHeader` - Header section
- `DialogTitle` - Title text
- `DialogDescription` - Description text
- `DialogFooter` - Footer section

**Example:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    <p>Dialog content</p>
  </DialogContent>
</Dialog>
```

### Separator

A horizontal or vertical separator line.

**Example:**
```tsx
import { Separator } from '@/components/ui/separator';

<Separator />
<Separator orientation="vertical" />
```

## Custom Components

### ZoneCard

A specialized card component for displaying emotional regulation zones (Green, Yellow, Red).

**Props:**
- `zone: ZoneType` - The zone to display (required)
- `title?: string` - Custom title (defaults to zone name)
- `description?: string` - Custom description (defaults to zone description)
- `triggerCount?: number` - Number of triggers to display
- `strategyCount?: number` - Number of strategies to display
- `compact?: boolean` - Compact mode
- `onClick?: () => void` - Click handler

**Features:**
- Automatic color theming based on zone type
- Zone-specific icons (CircleCheck, AlertTriangle, AlertCircle)
- Displays trigger and strategy counts
- Dark mode support
- Hover effects when clickable

**Example:**
```tsx
import { ZoneCard } from '@/components/zone-card';
import { ZoneType } from '@/lib/types/zone';

<ZoneCard
  zone={ZoneType.Green}
  triggerCount={3}
  strategyCount={5}
  onClick={() => console.log('Card clicked')}
/>
```

### CopingStrategyCard

A specialized card component for displaying coping strategies.

**Props:**
- `strategy: CopingStrategy` - The strategy to display (required)
- `compact?: boolean` - Compact mode (hides description)
- `onClick?: () => void` - Click handler for the card
- `onFavoriteClick?: (id: string) => void` - Handler for favorite button
- `onMenuClick?: (id: string) => void` - Handler for menu button
- `showActions?: boolean` - Whether to show action buttons (default: true)

**Features:**
- Category-specific icons and colors
- Favorite toggle with star icon
- Optional menu button for additional actions
- Compact mode for list views
- Dark mode support
- Hover effects with scale animation

**Example:**
```tsx
import { CopingStrategyCard } from '@/components/coping-strategy-card';
import { CopingStrategyCategory } from '@/lib/types/coping-strategy';

const strategy = {
  id: '1',
  title: 'Deep Breathing',
  description: 'Take slow, deep breaths to calm your nervous system',
  category: CopingStrategyCategory.Physical,
  isFavorite: false,
};

<CopingStrategyCard
  strategy={strategy}
  onFavoriteClick={(id) => console.log('Favorited:', id)}
  onMenuClick={(id) => console.log('Menu clicked:', id)}
/>
```

## Usage Examples

### Importing Components

```tsx
// Import individual components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

// Import all from index
import { Button, Card, ZoneCard } from '@/components';
```

### Zone Overview Page

```tsx
import { ZoneCard } from '@/components/zone-card';
import { ZoneType } from '@/lib/types/zone';

function ZoneOverview({ zones }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {zones.map((zone) => (
        <ZoneCard
          key={zone.zone}
          zone={zone.zone}
          triggerCount={zone.triggers.length}
          strategyCount={zone.copingStrategyIds.length}
          onClick={() => navigateToZone(zone.zone)}
        />
      ))}
    </div>
  );
}
```

### Strategy List

```tsx
import { CopingStrategyCard } from '@/components/coping-strategy-card';

function StrategyList({ strategies, onToggleFavorite }) {
  return (
    <div className="space-y-3">
      {strategies.map((strategy) => (
        <CopingStrategyCard
          key={strategy.id}
          strategy={strategy}
          onFavoriteClick={onToggleFavorite}
        />
      ))}
    </div>
  );
}
```

## Accessibility

All components follow accessibility best practices:

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Focus visible states
- Screen reader friendly
- Color contrast meets WCAG AA standards

## Dark Mode

All components support dark mode through Tailwind's `dark:` variants. The theme can be toggled at the root level by adding/removing the `dark` class on the `html` element.

## Mobile-First Design

All components are built with a mobile-first approach:

- Responsive breakpoints using Tailwind's `sm:`, `md:`, `lg:` prefixes
- Touch-friendly click targets (minimum 44x44px)
- Optimized spacing for smaller screens
- Stack layouts on mobile, grid layouts on desktop

## Contributing

When adding new components:

1. Use TypeScript for type safety
2. Follow the existing component patterns
3. Use the `cn()` utility for conditional classes
4. Add proper prop documentation with JSDoc
5. Support both light and dark modes
6. Test on mobile and desktop
7. Update this documentation

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Radix UI Documentation](https://www.radix-ui.com/)
