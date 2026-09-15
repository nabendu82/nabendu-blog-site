export type Difficulty = 'easy' | 'medium' | 'hard'
export const DIFFICULTIES = {
  easy: { name: 'Easy', timing: 1, description: 'Original pace. First raid at 10 minutes; Modern Age at 40 minutes.' },
  medium: { name: 'Medium', timing: 0.6, description: 'Earlier pressure. First raid at 6 minutes; Modern Age at 24 minutes.' },
  hard: { name: 'Hard', timing: 0.35, description: 'Rapid escalation. First raid at 3:30; Modern Age at 14 minutes.' },
} as const
export function enemyTime(seconds: number, difficulty: Difficulty): number { return seconds * DIFFICULTIES[difficulty].timing }

/** A small recovery window only when both armies reach Modern on Medium. */
export function raidInterval(seconds: number, difficulty: Difficulty, playerAge: number, enemyAge: number): number {
  return enemyTime(seconds, difficulty) * (difficulty === 'medium' && playerAge >= 4 && enemyAge >= 4 ? 1.125 : 1)
}
