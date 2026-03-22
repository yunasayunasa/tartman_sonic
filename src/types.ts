export interface GameResult {
  rings: number;
  timeSeconds: number;
  score: number;
  distance?: number; // infinite run mode
}

export type GameMode = 'normal' | 'infinite';
export type StageTheme = 'normal' | 'desert' | 'night';
