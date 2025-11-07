import { CopingStrategy, CopingStrategyCategory } from '@/lib/types/coping-strategy';

/**
 * Evidence-based coping strategies for well-being action plans
 * Organized by category: Calming (Emotional/Cognitive/Sensory), Physical, Creative, and Social
 */
export const defaultCopingStrategies: Omit<CopingStrategy, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // CALMING STRATEGIES - Emotional
  {
    title: 'Deep Breathing Exercise',
    description:
      'Practice slow, deep breathing for 5 minutes. Inhale through your nose for 4 counts, hold for 4 counts, and exhale through your mouth for 6 counts.',
    category: CopingStrategyCategory.Emotional,
  },
  {
    title: 'Progressive Muscle Relaxation',
    description:
      'Tense and relax each muscle group in your body, starting from your toes and working up to your head. Hold tension for 5 seconds, then release.',
    category: CopingStrategyCategory.Emotional,
  },
  {
    title: 'Guided Meditation',
    description:
      'Use a meditation app or audio guide to practice mindfulness meditation for 10-15 minutes.',
    category: CopingStrategyCategory.Emotional,
  },
  {
    title: 'Journaling',
    description:
      'Write down your thoughts and feelings in a journal. Try to identify specific emotions and what triggered them.',
    category: CopingStrategyCategory.Emotional,
  },

  // CALMING STRATEGIES - Cognitive
  {
    title: 'Positive Affirmations',
    description:
      'Repeat positive, realistic statements to yourself such as "I can handle this" or "This feeling will pass."',
    category: CopingStrategyCategory.Cognitive,
  },
  {
    title: 'Thought Reframing',
    description:
      'Challenge negative thoughts by identifying evidence for and against them. Look for more balanced perspectives.',
    category: CopingStrategyCategory.Cognitive,
  },
  {
    title: 'Grounding 5-4-3-2-1 Technique',
    description:
      'Name 5 things you see, 4 things you can touch, 3 things you hear, 2 things you smell, and 1 thing you taste.',
    category: CopingStrategyCategory.Cognitive,
  },
  {
    title: 'Gratitude Practice',
    description:
      'List three things you are grateful for today. Focus on specific details and why they matter to you.',
    category: CopingStrategyCategory.Cognitive,
  },

  // CALMING STRATEGIES - Sensory
  {
    title: 'Listen to Calming Music',
    description:
      'Put on relaxing or instrumental music. Focus on the sounds and let them help shift your mood.',
    category: CopingStrategyCategory.Sensory,
  },
  {
    title: 'Use Aromatherapy',
    description:
      'Try calming scents like lavender, chamomile, or vanilla through essential oils or candles.',
    category: CopingStrategyCategory.Sensory,
  },
  {
    title: 'Take a Warm Bath or Shower',
    description:
      'Use warm water to relax your body. Add Epsom salts or calming scents if available.',
    category: CopingStrategyCategory.Sensory,
  },

  // PHYSICAL STRATEGIES
  {
    title: 'Go for a Walk',
    description:
      'Take a 15-30 minute walk, preferably outside. Notice your surroundings and focus on your steps.',
    category: CopingStrategyCategory.Physical,
  },
  {
    title: 'Exercise or Stretch',
    description:
      'Engage in light exercise like yoga, stretching, or a workout routine for 20-30 minutes.',
    category: CopingStrategyCategory.Physical,
  },
  {
    title: 'Dance to Music',
    description:
      'Put on your favorite upbeat music and move your body freely. Let go and express yourself.',
    category: CopingStrategyCategory.Physical,
  },
  {
    title: 'Practice Yoga',
    description:
      'Follow a gentle yoga routine focusing on breathing and gentle movement. Use online videos or apps for guidance.',
    category: CopingStrategyCategory.Physical,
  },

  // CREATIVE STRATEGIES
  {
    title: 'Draw or Color',
    description:
      'Express yourself through art, doodling, or coloring. No artistic skill required - just let it flow.',
    category: CopingStrategyCategory.Creative,
  },
  {
    title: 'Write Creatively',
    description:
      'Write a poem, short story, or song lyrics. Use creative writing as an emotional outlet.',
    category: CopingStrategyCategory.Creative,
  },
  {
    title: 'Play an Instrument',
    description:
      'Make music on any instrument you have access to. Focus on expression rather than perfection.',
    category: CopingStrategyCategory.Creative,
  },

  // SOCIAL STRATEGIES
  {
    title: 'Call a Friend or Family Member',
    description:
      'Reach out to someone you trust for support, connection, or just to chat about everyday things.',
    category: CopingStrategyCategory.Social,
  },
  {
    title: 'Join a Support Group',
    description:
      'Participate in an online or in-person support group where you can share experiences with others.',
    category: CopingStrategyCategory.Social,
  },
  {
    title: 'Spend Time with a Pet',
    description:
      'Interact with a pet through play, cuddling, or going for a walk together. Animals can provide comfort and companionship.',
    category: CopingStrategyCategory.Social,
  },
];

/**
 * Get coping strategies organized by category
 */
export function getCopingStrategiesByCategory() {
  return defaultCopingStrategies.reduce(
    (acc, strategy) => {
      if (!acc[strategy.category]) {
        acc[strategy.category] = [];
      }
      acc[strategy.category].push(strategy);
      return acc;
    },
    {} as Record<
      CopingStrategyCategory,
      Array<Omit<CopingStrategy, 'id' | 'createdAt' | 'updatedAt'>>
    >
  );
}

/**
 * Category display configuration for the four main groups
 * Maps our categories into the user-friendly groups: Calming, Physical, Creative, Social
 */
export const categoryGroups: Record<
  string,
  {
    label: string;
    description: string;
    categories: CopingStrategyCategory[];
  }
> = {
  calming: {
    label: 'Calming',
    description: 'Strategies to help you relax and manage stress',
    categories: [
      CopingStrategyCategory.Emotional,
      CopingStrategyCategory.Cognitive,
      CopingStrategyCategory.Sensory,
    ],
  },
  physical: {
    label: 'Physical',
    description: 'Movement-based activities to boost well-being',
    categories: [CopingStrategyCategory.Physical],
  },
  creative: {
    label: 'Creative',
    description: 'Expressive activities for emotional release',
    categories: [CopingStrategyCategory.Creative],
  },
  social: {
    label: 'Social',
    description: 'Connection-based strategies for support',
    categories: [CopingStrategyCategory.Social],
  },
};
