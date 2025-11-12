/* eslint-disable no-console */
'use client';

import { useState } from 'react';
import { ZoneCard } from '@/components/zone-card';
import { CopingStrategyCard } from '@/components/coping-strategy-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ZoneType } from '@/lib/types/zone';
import { CopingStrategyCategory, CopingStrategy } from '@/lib/types/coping-strategy';

export default function ComponentsDemo() {
  const [favoriteStrategies, setFavoriteStrategies] = useState<Set<string>>(new Set());

  const sampleStrategies: CopingStrategy[] = [
    {
      id: '1',
      title: 'Deep Breathing',
      description:
        'Take slow, deep breaths for 5 minutes. Inhale for 4 counts, hold for 4, exhale for 6.',
      category: CopingStrategyCategory.Physical,
      isFavorite: favoriteStrategies.has('1'),
    },
    {
      id: '2',
      title: 'Call a Friend',
      description: 'Reach out to a trusted friend or family member for support and connection.',
      category: CopingStrategyCategory.Social,
      isFavorite: favoriteStrategies.has('2'),
    },
    {
      id: '3',
      title: 'Journaling',
      description: 'Write down your thoughts and feelings in a journal to process emotions.',
      category: CopingStrategyCategory.Emotional,
      isFavorite: favoriteStrategies.has('3'),
    },
    {
      id: '4',
      title: 'Positive Affirmations',
      description: 'Repeat positive statements to yourself to challenge negative thought patterns.',
      category: CopingStrategyCategory.Cognitive,
      isFavorite: favoriteStrategies.has('4'),
    },
    {
      id: '5',
      title: 'Listen to Music',
      description: 'Put on calming or uplifting music to shift your emotional state.',
      category: CopingStrategyCategory.Sensory,
      isFavorite: favoriteStrategies.has('5'),
    },
    {
      id: '6',
      title: 'Creative Drawing',
      description: 'Express yourself through art, doodling, or coloring to release tension.',
      category: CopingStrategyCategory.Creative,
      isFavorite: favoriteStrategies.has('6'),
    },
  ];

  const handleToggleFavorite = (id: string) => {
    setFavoriteStrategies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-catamount-green dark:text-[#7FD4B8]">
          Component Library Demo
        </h1>
        <p className="text-vermont-slate dark:text-[#A8D5FF]">
          A showcase of reusable components for the Well-Being Action Plan
        </p>
      </div>

      <Separator />

      {/* Zone Cards */}
      <section className="space-y-4">
        <div>
          <h2 className="mb-2 text-2xl font-semibold">Zone Cards</h2>
          <p className="text-sm text-muted-foreground">
            Display emotional regulation zones with visual indicators
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ZoneCard
            zone={ZoneType.Green}
            triggerCount={2}
            strategyCount={8}
            onClick={() => console.log('Green zone clicked')}
          />
          <ZoneCard
            zone={ZoneType.Yellow}
            triggerCount={5}
            strategyCount={6}
            onClick={() => console.log('Yellow zone clicked')}
          />
          <ZoneCard
            zone={ZoneType.Red}
            triggerCount={3}
            strategyCount={4}
            onClick={() => console.log('Red zone clicked')}
          />
        </div>
      </section>

      <Separator />

      {/* Coping Strategy Cards */}
      <section className="space-y-4">
        <div>
          <h2 className="mb-2 text-2xl font-semibold">Coping Strategy Cards</h2>
          <p className="text-sm text-muted-foreground">
            Display coping strategies with category icons and favorite functionality
          </p>
        </div>
        <div className="space-y-3">
          {sampleStrategies.map((strategy) => (
            <CopingStrategyCard
              key={strategy.id}
              strategy={{
                ...strategy,
                isFavorite: favoriteStrategies.has(strategy.id),
              }}
              onFavoriteClick={handleToggleFavorite}
              onMenuClick={(id) => console.log(`Menu clicked for strategy ${id}`)}
              onClick={() => console.log(`Strategy ${strategy.id} clicked`)}
            />
          ))}
        </div>
      </section>

      <Separator />

      {/* Buttons */}
      <section className="space-y-4">
        <div>
          <h2 className="mb-2 text-2xl font-semibold">Buttons</h2>
          <p className="text-sm text-muted-foreground">Various button styles and sizes</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <Separator />

      {/* Badges */}
      <section className="space-y-4">
        <div>
          <h2 className="mb-2 text-2xl font-semibold">Badges</h2>
          <p className="text-sm text-muted-foreground">Labels and tags for categorization</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

      <Separator />

      {/* Input */}
      <section className="space-y-4">
        <div>
          <h2 className="mb-2 text-2xl font-semibold">Input</h2>
          <p className="text-sm text-muted-foreground">Text input fields</p>
        </div>
        <div className="max-w-sm space-y-3">
          <Input type="text" placeholder="Enter text..." />
          <Input type="email" placeholder="Enter email..." />
          <Input type="password" placeholder="Enter password..." />
        </div>
      </section>

      <Separator />

      {/* Dialog */}
      <section className="space-y-4">
        <div>
          <h2 className="mb-2 text-2xl font-semibold">Dialog</h2>
          <p className="text-sm text-muted-foreground">Modal dialogs for interactions</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Example</DialogTitle>
              <DialogDescription>
                This is a modal dialog built with Radix UI. It can contain any content.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Enter something..." />
              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Submit</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
