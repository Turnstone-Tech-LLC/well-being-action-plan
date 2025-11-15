import * as React from 'react';
import { CopingStrategy } from '@/lib/types/coping-strategy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { categoryConfig } from '@/lib/config/categoryConfig';
import { Star, MoreVertical } from 'lucide-react';

interface CopingStrategyCardProps extends React.HTMLAttributes<React.ElementRef<'div'>> {
  /**
   * The coping strategy to display
   */
  strategy: CopingStrategy;
  /**
   * Whether to show the card in compact mode
   */
  compact?: boolean;
  /**
   * Click handler for the main card
   */
  onClick?: () => void;
  /**
   * Click handler for the favorite button
   */
  onFavoriteClick?: (id: string) => void;
  /**
   * Click handler for the menu button
   */
  onMenuClick?: (id: string) => void;
  /**
   * Whether to show action buttons
   */
  showActions?: boolean;
}

const CopingStrategyCard = React.forwardRef<React.ElementRef<'div'>, CopingStrategyCardProps>(
  (
    {
      strategy,
      compact = false,
      onClick,
      onFavoriteClick,
      onMenuClick,
      showActions = true,
      className,
      ...props
    },
    ref
  ) => {
    const config = categoryConfig[strategy.category as keyof typeof categoryConfig];
    const CategoryIcon = config.icon;

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onFavoriteClick?.(strategy.id);
    };

    const handleMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onMenuClick?.(strategy.id);
    };

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
          onClick &&
            'cursor-pointer hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          className
        )}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? `View coping strategy: ${strategy.title}` : undefined}
        {...props}
      >
        <CardHeader className={compact ? 'pb-2' : undefined}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="mt-0.5">
                <CategoryIcon className={cn('h-5 w-5', config.iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start gap-2">
                  <CardTitle className="flex-1 text-base leading-tight">{strategy.title}</CardTitle>
                </div>
                <Badge className={cn('text-xs', config.color)} variant="outline">
                  {strategy.category}
                </Badge>
              </div>
            </div>
            {showActions && (
              <div className="flex items-center gap-1">
                {onFavoriteClick && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleFavoriteClick}
                    aria-label={strategy.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={cn(
                        'h-4 w-4',
                        strategy.isFavorite && 'fill-yellow-400 text-yellow-400'
                      )}
                    />
                  </Button>
                )}
                {onMenuClick && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleMenuClick}
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        {!compact && strategy.description && (
          <CardContent className="pt-0">
            <CardDescription className="text-sm leading-relaxed">
              {strategy.description}
            </CardDescription>
          </CardContent>
        )}
      </Card>
    );
  }
);

CopingStrategyCard.displayName = 'CopingStrategyCard';

export { CopingStrategyCard, type CopingStrategyCardProps };
