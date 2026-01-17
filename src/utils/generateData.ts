import type { Item } from '../types';

const TAGS = [
  'Action',
  'Comedy',
  'Drama',
  'Horror',
  'Sci-Fi',
  'Romance',
  'Thriller',
  'Documentary',
  'Animation',
  'Fantasy',
];

const TITLES = [
  'The Adventure',
  'Dark Night',
  'Summer Love',
  'Space Journey',
  'Mystery Island',
  'City Lights',
  'Wild Chase',
  'Silent Echo',
  'Final Stand',
  'Ocean Deep',
];

function getRandomTags(): string[] {
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...TAGS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getRandomTitle(index: number): string {
  const prefix = TITLES[index % TITLES.length];
  const suffix = Math.floor(index / TITLES.length) + 1;
  return suffix > 1 ? `${prefix} ${suffix}` : prefix;
}

export function generateItems(count: number): Item[] {
  const items: Item[] = [];

  for (let i = 0; i < count; i++) {
    items.push({
      id: `item-${i}`,
      title: getRandomTitle(i),
      tags: getRandomTags(),
      rating: Math.round((Math.random() * 4 + 1) * 10) / 10, // 1.0 - 5.0
      isPlayable: Math.random() > 0.2,
    });
  }

  return items;
}

export const DATA_SIZES = [10000, 20000, 50000] as const;
export type DataSize = (typeof DATA_SIZES)[number];
