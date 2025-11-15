'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Sparkles } from 'lucide-react';
import { CopingStrategyCategory } from '@/lib/types';
import { defaultCopingStrategies } from '@/lib/data/copingStrategies';

/**
 * Provider Strategies Library Page
 *
 * Displays all available coping strategies organized by category.
 * Providers can browse strategies to understand what's available for their patients.
 */
// Type for strategies with IDs (for display purposes)
interface StrategyWithId {
  id: string;
  title: string;
  description: string;
  category: CopingStrategyCategory;
}

export default function ProviderStrategiesPage() {
  const [filteredStrategies, setFilteredStrategies] = React.useState<StrategyWithId[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Convert default strategies to include IDs for rendering
  const strategies: StrategyWithId[] = React.useMemo(
    () =>
      defaultCopingStrategies.map((strategy, index) => ({
        id: `strategy-${index}`,
        ...strategy,
      })),
    []
  );

  // Initialize filtered strategies
  React.useEffect(() => {
    setFilteredStrategies(strategies);
  }, [strategies]);

  // Filter strategies based on search and category
  // Filter strategies based on search and category
  React.useEffect(() => {
    let filtered = strategies;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (strategy) =>
          strategy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          strategy.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((strategy) => strategy.category === selectedCategory);
    }

    setFilteredStrategies(filtered);
  }, [searchTerm, selectedCategory, strategies]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-catamount-green dark:text-[#7FD4B8]">
          Coping Strategies Library
        </h1>
        <p className="mt-2 text-lg text-vermont-slate dark:text-[#A8D5FF]">
          Browse evidence-based strategies available for your patients
        </p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search strategies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            {Object.entries(CopingStrategyCategory).map(([key, value]) => (
              <option key={value} value={value}>
                {key}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Strategies Grid */}
      {filteredStrategies.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStrategies.map((strategy) => (
            <Card key={strategy.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">{strategy.title}</CardTitle>
                <CardDescription className="text-xs">{strategy.category}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground">{strategy.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No strategies found matching your search.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            About This Library
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            These evidence-based coping strategies are available for your patients to use in their
            well-being action plans.
          </p>
          <p className="text-xs text-muted-foreground">
            Strategies are organized by category and can be customized for each patient&apos;s
            needs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
