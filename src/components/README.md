# Component Library

This directory contains the reusable UI component library for the Well-Being Action Plan application.

## Structure

```
components/
├── ui/                    # Core shadcn/ui components
│   ├── button.tsx        # Button component
│   ├── card.tsx          # Card component
│   ├── input.tsx         # Input component
│   ├── badge.tsx         # Badge component
│   ├── dialog.tsx        # Dialog/modal component
│   ├── separator.tsx     # Separator/divider component
│   └── index.ts          # UI components barrel export
├── zone-card.tsx         # Custom ZoneCard for displaying emotional zones
├── coping-strategy-card.tsx  # Custom card for coping strategies
├── index.ts              # Main components barrel export
└── README.md             # This file
```

## Usage

### Importing Components

```tsx
// Import from main barrel export
import { ZoneCard, CopingStrategyCard, Button, Card } from '@/components';

// Or import from specific locations
import { ZoneCard } from '@/components/zone-card';
import { Button } from '@/components/ui/button';
```

### Quick Examples

**ZoneCard:**
```tsx
import { ZoneCard } from '@/components';
import { ZoneType } from '@/lib/types/zone';

<ZoneCard
  zone={ZoneType.Green}
  triggerCount={2}
  strategyCount={8}
  onClick={() => console.log('Zone clicked')}
/>
```

**CopingStrategyCard:**
```tsx
import { CopingStrategyCard } from '@/components';

<CopingStrategyCard
  strategy={strategyData}
  onFavoriteClick={(id) => toggleFavorite(id)}
  onClick={() => viewStrategy(strategyData.id)}
/>
```

**Button:**
```tsx
import { Button } from '@/components';

<Button variant="primary" size="lg">
  Click Me
</Button>
```

## Documentation

For complete documentation, examples, and design system guidelines, see:
- [Component Documentation](../../docs/COMPONENTS.md)
- [Demo Page](/components-demo) - Live interactive component showcase

## Design Principles

1. **Mobile-First**: All components are responsive and optimized for mobile devices
2. **Accessible**: Built with accessibility in mind using semantic HTML and ARIA attributes
3. **Type-Safe**: Full TypeScript support with comprehensive prop types
4. **Themeable**: Support for light/dark mode and customizable via Tailwind CSS
5. **Composable**: Components can be easily combined and extended

## Adding New Components

When adding new components to this library:

1. Create the component file in the appropriate directory
2. Add TypeScript types and JSDoc comments
3. Export from `index.ts`
4. Update documentation in `docs/COMPONENTS.md`
5. Add usage examples
6. Test in both light and dark modes
7. Verify accessibility

## Development

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# View components in demo
pnpm dev
# Navigate to /components-demo
```
