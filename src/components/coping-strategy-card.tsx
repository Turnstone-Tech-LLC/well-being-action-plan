import * as React from 'react';
import { CopingStrategy, CopingStrategyCategory } from '@/lib/types/coping-strategy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Heart,
  Users,
  Brain,
  Sparkles,
  Activity,
  Palette,
  Star,
  MoreVertical,
} from 'lucide-react';

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

const categoryConfig = {
  [CopingStrategyCategory.Physical]: {
    icon: Activity,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  [CopingStrategyCategory.Social]: {
    icon: Users,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  [CopingStrategyCategory.Emotional]: {
    icon: Heart,
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  [CopingStrategyCategory.Cognitive]: {
    icon: Brain,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  [CopingStrategyCategory.Sensory]: {
    icon: Sparkles,
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  [CopingStrategyCategory.Creative]: {
    icon: Palette,
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  [CopingStrategyCategory.Spiritual]: {
    icon: Sparkles,
    color: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  [CopingStrategyCategory.Other]: {
    icon: Sparkles,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    iconColor: 'text-gray-600 dark:text-gray-400',
  },
};

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
    const config = categoryConfig[strategy.category];
    const CategoryIcon = config.icon;

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onFavoriteClick?.(strategy.id);
    };

    const handleMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onMenuClick?.(strategy.id);
    };

    return (
      <Card
        ref={ref}
        className={cn(
          'transition-all duration-200',
          onClick && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
          className
        )}
        onClick={onClick}
        {...props}
      >
        <CardHeader className={compact ? 'pb-2' : undefined}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="mt-0.5">
                <CategoryIcon className={cn('h-5 w-5', config.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <CardTitle className="text-base leading-tight flex-1">
                    {strategy.title}
                  </CardTitle>
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
