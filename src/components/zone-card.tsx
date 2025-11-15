import * as React from 'react';
import { ZoneType } from '@/lib/types/zone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CircleCheck, AlertCircle, AlertTriangle } from 'lucide-react';
import { getZoneLabel, getZoneDescription, ZONE_COLORS } from '@/lib/utils/zoneUtils';

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
    icon: CircleCheck,
  },
  [ZoneType.Yellow]: {
    icon: AlertTriangle,
  },
  [ZoneType.Red]: {
    icon: AlertCircle,
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
    const colors = ZONE_COLORS[zone];

    // Add keyboard handler if onClick is provided
    const handleKeyDown = onClick
      ? (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }
      : undefined;

    return (
      <Card
        ref={ref}
        className={cn(
          'transition-all duration-200',
          colors.border,
          colors.background,
          onClick &&
            'cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          className
        )}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? 'button' : undefined}
        {...props}
      >
        <CardHeader className={compact ? 'pb-3' : undefined}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Icon className={cn('h-5 w-5', colors.text)} />
              <CardTitle className={cn('text-lg', colors.text)}>
                {title || getZoneLabel(zone)}
              </CardTitle>
            </div>
            <Badge className={cn(colors.background, colors.text)} variant="outline">
              {zone.toUpperCase()}
            </Badge>
          </div>
          {!compact && (
            <CardDescription className={colors.text}>
              {description || getZoneDescription(zone)}
            </CardDescription>
          )}
        </CardHeader>
        {(triggerCount !== undefined || strategyCount !== undefined) && (
          <CardContent className={compact ? 'pb-3 pt-0' : 'pt-0'}>
            <div className="flex gap-4 text-sm">
              {triggerCount !== undefined && (
                <div className={cn('flex flex-col', colors.text)}>
                  <span className="font-semibold">{triggerCount}</span>
                  <span className="text-xs opacity-80">
                    {triggerCount === 1 ? 'Trigger' : 'Triggers'}
                  </span>
                </div>
              )}
              {strategyCount !== undefined && (
                <div className={cn('flex flex-col', colors.text)}>
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
