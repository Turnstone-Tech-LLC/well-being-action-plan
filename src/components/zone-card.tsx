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
      border: 'border-green-zone',
      bg: 'bg-[#154734]/5 dark:bg-[#154734]/20',
      text: 'text-green-zone dark:text-[#7FD4B8]',
      badge: 'bg-[#154734]/10 text-green-zone dark:bg-[#154734]/30 dark:text-[#7FD4B8]',
      iconColor: 'text-green-zone dark:text-[#7FD4B8]',
    },
  },
  [ZoneType.Yellow]: {
    name: 'Yellow Zone',
    description: 'Warning signs - elevated stress or concern',
    icon: AlertTriangle,
    colors: {
      border: 'border-yellow-zone',
      bg: 'bg-[#FFD100]/5 dark:bg-[#FFD100]/15',
      text: 'text-[#B39D00] dark:text-[#FFE066]',
      badge: 'bg-[#FFD100]/10 text-[#B39D00] dark:bg-[#FFD100]/20 dark:text-[#FFE066]',
      iconColor: 'text-[#B39D00] dark:text-[#FFE066]',
    },
  },
  [ZoneType.Red]: {
    name: 'Red Zone',
    description: 'Crisis state - immediate support needed',
    icon: AlertCircle,
    colors: {
      border: 'border-red-zone',
      bg: 'bg-[#DC582A]/5 dark:bg-[#DC582A]/20',
      text: 'text-red-zone dark:text-[#FF9B7F]',
      badge: 'bg-[#DC582A]/10 text-red-zone dark:bg-[#DC582A]/30 dark:text-[#FF9B7F]',
      iconColor: 'text-red-zone dark:text-[#FF9B7F]',
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
          <CardContent className={compact ? 'pb-3 pt-0' : 'pt-0'}>
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
