import { CopingStrategy, CopingStrategyCategory } from '@/lib/types/coping-strategy';

/**
 * Evidence-based coping strategies for youth well-being action plans
 *
 * Sources:
 * - National Alliance on Mental Illness (NAMI) - Youth Mental Health Resources
 * - American Psychological Association (APA) - Healthy Coping for Teens
 * - Substance Abuse and Mental Health Services Administration (SAMHSA)
 * - DBT Skills Training Manual (Dialectical Behavior Therapy)
 * - Mindfulness-Based Stress Reduction (MBSR) research
 *
 * Language level: Designed for ages 13-18
 * Organized by category: Calming (Emotional/Cognitive/Sensory), Physical, Creative, and Social
 */
export const defaultCopingStrategies: Omit<CopingStrategy, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // CALMING STRATEGIES - Emotional (Evidence: MBSR, DBT, APA)
  {
    title: 'Deep Breathing Exercise',
    description:
      'Take slow, deep breaths for 5 minutes. Breathe in through your nose for 4 seconds, hold for 4 seconds, then breathe out through your mouth for 6 seconds. This helps calm your nervous system.',
    category: CopingStrategyCategory.Emotional,
  },
  {
    title: 'Progressive Muscle Relaxation',
    description:
      'Squeeze and then relax different muscle groups in your body. Start with your toes and work up to your head. Squeeze for 5 seconds, then let go and notice the difference.',
    category: CopingStrategyCategory.Emotional,
  },
  {
    title: 'Guided Meditation',
    description:
      'Use an app like Headspace, Calm, or Insight Timer for a 10-15 minute guided meditation. Perfect for beginners who want help staying focused.',
    category: CopingStrategyCategory.Emotional,
  },
  {
    title: 'Journaling Your Feelings',
    description:
      "Write down what you're feeling and what might have triggered it. Don't worry about grammar or spelling—just let your thoughts flow onto the page.",
    category: CopingStrategyCategory.Emotional,
  },
  {
    title: 'Safe Place Visualization',
    description:
      'Close your eyes and imagine a place where you feel completely safe and calm. Picture all the details—what you see, hear, smell, and feel. Stay there in your mind for a few minutes.',
    category: CopingStrategyCategory.Emotional,
  },
  {
    title: 'Emotional Check-In',
    description:
      'Pause and ask yourself: "What am I feeling right now?" Name the emotion without judging it. Sometimes just naming feelings can help you feel more in control.',
    category: CopingStrategyCategory.Emotional,
  },
  {
    title: 'Self-Compassion Break',
    description:
      'Talk to yourself like you would to a good friend. Instead of being hard on yourself, say something kind like "This is tough, but I\'m doing my best."',
    category: CopingStrategyCategory.Emotional,
  },

  // CALMING STRATEGIES - Cognitive (Evidence: CBT, DBT, NAMI)
  {
    title: 'Positive Affirmations',
    description:
      'Say helpful statements to yourself like "I can handle this" or "This feeling will pass." Pick phrases that feel real and believable to you.',
    category: CopingStrategyCategory.Cognitive,
  },
  {
    title: 'Challenge Negative Thoughts',
    description:
      'When you catch yourself thinking something negative, ask: "Is this really true?" Look for evidence that proves and disproves the thought. Often you\'ll find a more balanced way to see things.',
    category: CopingStrategyCategory.Cognitive,
  },
  {
    title: 'Grounding 5-4-3-2-1 Technique',
    description:
      'Look around and name: 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This brings you back to the present moment.',
    category: CopingStrategyCategory.Cognitive,
  },
  {
    title: 'Gratitude List',
    description:
      'Write down three good things from your day, even small ones. It could be a tasty snack, a funny meme, or a moment with a friend. This helps train your brain to notice positive things.',
    category: CopingStrategyCategory.Cognitive,
  },
  {
    title: 'Worry Time',
    description:
      'Set aside 15 minutes each day as "worry time." When anxious thoughts pop up during the day, tell yourself "I\'ll think about that during worry time." This helps contain anxious thoughts.',
    category: CopingStrategyCategory.Cognitive,
  },
  {
    title: 'Mindful Observation',
    description:
      'Pick one object nearby and study it for a minute. Notice every detail—color, texture, shape. This interrupts racing thoughts and grounds you in the moment.',
    category: CopingStrategyCategory.Cognitive,
  },
  {
    title: 'Fact vs. Feeling',
    description:
      'Write two columns: Facts (what actually happened) and Feelings (how you interpreted it). This helps separate reality from anxious thoughts.',
    category: CopingStrategyCategory.Cognitive,
  },

  // CALMING STRATEGIES - Sensory (Evidence: MBSR, Sensory Integration Therapy)
  {
    title: 'Listen to Calming Music',
    description:
      'Put on chill music, nature sounds, or lo-fi beats. Focus on the sounds and rhythms to help shift your mood and calm your mind.',
    category: CopingStrategyCategory.Sensory,
  },
  {
    title: 'Use Calming Scents',
    description:
      'Try relaxing scents like lavender, vanilla, or fresh mint. You can use essential oils, scented candles, or even smell something from nature like flowers or fresh air.',
    category: CopingStrategyCategory.Sensory,
  },
  {
    title: 'Take a Warm Bath or Shower',
    description:
      'Let warm water relax your muscles and wash away stress. Try making the room dark or playing soft music to make it extra peaceful.',
    category: CopingStrategyCategory.Sensory,
  },
  {
    title: 'Hold Something Cold',
    description:
      'Hold an ice cube, splash cold water on your face, or drink ice water. The cold sensation can interrupt intense emotions and help you feel more grounded.',
    category: CopingStrategyCategory.Sensory,
  },
  {
    title: 'Use a Stress Ball or Fidget Toy',
    description:
      "Squeeze a stress ball, play with a fidget spinner, or manipulate putty. The repetitive movement and texture can be really calming when you're anxious.",
    category: CopingStrategyCategory.Sensory,
  },
  {
    title: 'Wrap Up in a Cozy Blanket',
    description:
      'Get under a soft blanket or wear your comfiest hoodie. The feeling of being wrapped up can be soothing and make you feel safe.',
    category: CopingStrategyCategory.Sensory,
  },

  // PHYSICAL STRATEGIES (Evidence: APA, SAMHSA, Exercise Psychology Research)
  {
    title: 'Go for a Walk',
    description:
      'Take a 15-30 minute walk around your neighborhood or a park. Notice what you see, hear, and smell. Walking helps clear your mind and releases feel-good chemicals in your brain.',
    category: CopingStrategyCategory.Physical,
  },
  {
    title: 'Stretch It Out',
    description:
      'Do some simple stretches for 5-10 minutes. Roll your shoulders, stretch your arms overhead, touch your toes. It releases tension and gets your blood flowing.',
    category: CopingStrategyCategory.Physical,
  },
  {
    title: 'Dance to Music',
    description:
      "Put on your favorite upbeat songs and just move. Dance alone in your room—no one's watching! It's a fun way to release energy and boost your mood.",
    category: CopingStrategyCategory.Physical,
  },
  {
    title: 'Try Yoga',
    description:
      'Follow a beginner yoga video on YouTube or use an app like Yoga for Beginners. Focus on breathing and gentle movements. Start with just 10-15 minutes.',
    category: CopingStrategyCategory.Physical,
  },
  {
    title: 'Do Jumping Jacks or Push-Ups',
    description:
      'Do 20 jumping jacks, 10 push-ups, or run in place for a minute. Quick bursts of exercise can shake off anxious energy and help you refocus.',
    category: CopingStrategyCategory.Physical,
  },
  {
    title: 'Bike Ride',
    description:
      'Go for a bike ride around your neighborhood or local trails. The movement and fresh air can help clear your head and improve your mood.',
    category: CopingStrategyCategory.Physical,
  },
  {
    title: 'Play a Sport or Active Game',
    description:
      "Shoot some hoops, kick a soccer ball, or play an active video game. Physical activity that's also fun makes it easier to stay active.",
    category: CopingStrategyCategory.Physical,
  },

  // CREATIVE STRATEGIES (Evidence: Art Therapy, Expressive Arts Therapy Research)
  {
    title: 'Draw or Color',
    description:
      "Doodle, sketch, or use a coloring app. You don't need to be good at art—just let your pen or pencil move however it wants. It's about expressing yourself, not making something perfect.",
    category: CopingStrategyCategory.Creative,
  },
  {
    title: 'Write Creatively',
    description:
      'Write a poem, song lyrics, short story, or even fan fiction. Let your imagination run wild. Creative writing is a great way to work through feelings.',
    category: CopingStrategyCategory.Creative,
  },
  {
    title: 'Play an Instrument',
    description:
      'Play guitar, piano, drums, or any instrument you have. Don\'t worry about playing it "right"—just make sounds that express how you\'re feeling.',
    category: CopingStrategyCategory.Creative,
  },
  {
    title: 'Create a Playlist',
    description:
      'Make a playlist that matches your mood or the mood you want to have. Organizing music can be therapeutic and gives you a tool to use later.',
    category: CopingStrategyCategory.Creative,
  },
  {
    title: 'Make Something with Your Hands',
    description:
      'Try origami, build with Legos, bead bracelets, or make slime. Hands-on activities can distract your mind from stress and give you something to focus on.',
    category: CopingStrategyCategory.Creative,
  },
  {
    title: 'Photography Walk',
    description:
      'Take your phone and go on a walk to photograph things you find interesting or beautiful. Looking at the world through a camera lens can shift your perspective.',
    category: CopingStrategyCategory.Creative,
  },
  {
    title: 'Create Digital Art or Edits',
    description:
      "Use apps like Procreate, Canva, or photo editors to create something. Make memes, edit photos, or design graphics. Digital creation is perfect if you're always on your phone anyway.",
    category: CopingStrategyCategory.Creative,
  },

  // SOCIAL STRATEGIES (Evidence: Social Support Research, NAMI, APA)
  {
    title: 'Text or Call a Friend',
    description:
      "Reach out to someone you trust. You don't have to talk about what's bothering you if you don't want to—sometimes just chatting about random stuff helps.",
    category: CopingStrategyCategory.Social,
  },
  {
    title: 'Join an Online Community',
    description:
      "Find a Discord server, subreddit, or online forum about something you're interested in. Connecting with people who share your interests can help you feel less alone.",
    category: CopingStrategyCategory.Social,
  },
  {
    title: 'Spend Time with a Pet',
    description:
      'Pet a dog or cat, play with them, or just sit with them. Animals are great at making people feel calmer and less stressed without any judgment.',
    category: CopingStrategyCategory.Social,
  },
  {
    title: 'Video Chat with Someone',
    description:
      "FaceTime, Zoom, or video chat with a friend or family member. Seeing someone's face and hearing their voice can feel more connecting than just texting.",
    category: CopingStrategyCategory.Social,
  },
  {
    title: 'Ask for a Hug',
    description:
      "If you have someone around you trust, ask for a hug. Physical comfort from safe people can be really soothing when you're struggling.",
    category: CopingStrategyCategory.Social,
  },
  {
    title: 'Help Someone Else',
    description:
      'Do something nice for someone—help with homework, make someone laugh, or just listen to them. Helping others can make you feel better too.',
    category: CopingStrategyCategory.Social,
  },
  {
    title: 'Talk to a Trusted Adult',
    description:
      'Reach out to a parent, teacher, counselor, or coach. Sometimes getting advice or support from someone older who cares about you can really help.',
    category: CopingStrategyCategory.Social,
  },
  {
    title: 'Hang Out in Person',
    description:
      'Meet up with a friend to grab food, watch a movie, or just hang out. Being physically present with people you like can boost your mood.',
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
