import * as React from 'react';
import { ZoneType } from '@/lib/types/zone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CircleCheck, AlertCircle, AlertTriangle } from 'lucide-react';

interface ZoneCardProps extends React.HTMLAttributes<React.ElementRef<'div'>> {
  /**
   * The zone type to display (green, yellow, or red)
   */
  zone: ZoneType;
  /**
   * Optional title override. If not provided, uses default zone names
   */
  title?: string;
  /**
   * Description text for the zone
   */
  description?: string;
  /**
   * Number of triggers associated with this zone
   */
  triggerCount?: number;
  /**
   * Number of coping strategies associated with this zone
   */
  strategyCount?: number;
  /**
   * Whether to show the card in compact mode
   */
  compact?: boolean;
  /**
   * Click handler for when the card is clicked
   */
  onClick?: () => void;
}

const zoneConfig = {
  [ZoneType.Green]: {
    name: 'Green Zone',
    description: 'Feeling good - stable emotional state',
    icon: CircleCheck,
    colors: {
      border: 'border-green-500',
      bg: 'bg-green-50 dark:bg-green-950',
      text: 'text-green-700 dark:text-green-300',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      iconColor: 'text-green-600 dark:text-green-400',
    },
  },
  [ZoneType.Yellow]: {
    name: 'Yellow Zone',
    description: 'Warning signs - elevated stress or concern',
    icon: AlertTriangle,
    colors: {
      border: 'border-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      text: 'text-yellow-700 dark:text-yellow-300',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  },
  [ZoneType.Red]: {
    name: 'Red Zone',
    description: 'Crisis state - immediate support needed',
    icon: AlertCircle,
    colors: {
      border: 'border-red-500',
      bg: 'bg-red-50 dark:bg-red-950',
      text: 'text-red-700 dark:text-red-300',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  },
};

const ZoneCard = React.forwardRef<React.ElementRef<'div'>, ZoneCardProps>(
  (
    {
      zone,
      title,
      description,
      triggerCount,
      strategyCount,
      compact = false,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const config = zoneConfig[zone];
    const Icon = config.icon;

    return (
      <Card
        ref={ref}
        className={cn(
          'transition-all duration-200',
          config.colors.border,
          config.colors.bg,
          onClick && 'cursor-pointer hover:shadow-md',
          className
        )}
        onClick={onClick}
        {...props}
      >
        <CardHeader className={compact ? 'pb-3' : undefined}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Icon className={cn('h-5 w-5', config.colors.iconColor)} />
              <CardTitle className={cn('text-lg', config.colors.text)}>
                {title || config.name}
              </CardTitle>
            </div>
            <Badge className={config.colors.badge} variant="outline">
              {zone.toUpperCase()}
            </Badge>
          </div>
          {!compact && (
            <CardDescription className={config.colors.text}>
              {description || config.description}
            </CardDescription>
          )}
        </CardHeader>
        {(triggerCount !== undefined || strategyCount !== undefined) && (
          <CardContent className={compact ? 'pt-0 pb-3' : 'pt-0'}>
            <div className="flex gap-4 text-sm">
              {triggerCount !== undefined && (
                <div className={cn('flex flex-col', config.colors.text)}>
                  <span className="font-semibold">{triggerCount}</span>
                  <span className="text-xs opacity-80">
                    {triggerCount === 1 ? 'Trigger' : 'Triggers'}
                  </span>
                </div>
              )}
              {strategyCount !== undefined && (
                <div className={cn('flex flex-col', config.colors.text)}>
                  <span className="font-semibold">{strategyCount}</span>
                  <span className="text-xs opacity-80">
                    {strategyCount === 1 ? 'Strategy' : 'Strategies'}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  }
);

ZoneCard.displayName = 'ZoneCard';

export { ZoneCard, type ZoneCardProps };
