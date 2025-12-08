export interface Branding {
  logoUrl: string;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  headerFont: string;
  bodyFont: string;
  customFontUrl: string;
  customFontName: string;
}

export interface Station {
  id: string;
  name: string;
  type: 'manned' | 'task';
  taskAnswer?: string;
  location?: string;
  mapUrl?: string;
}

export interface Team {
  id: string;
  name: string;
  captain: string;
  members: string[];
  color: string;
  score: number;
}

export interface GameConfig {
  gameName: string;
  numStations: number;
  numTeams: number;
  stationDuration: number;
  pauseDuration: number;
  pauseAfterRound: number;
  stations: Station[];
  teams: Team[];
  routes: Record<string, string[]>;
}

export interface QuizQuestion {
  question: string;
  type: 'open' | 'multiple';
  correctAnswer: string;
  options?: string[];
  imageUrl?: string;
  points: number;
}

export interface GameState {
  isRunning: boolean;
  currentRound: number;
  isPaused: boolean;
  timeRemaining: number;
  teamQuizUnlocked: boolean;
  personalQuizUnlocked: boolean;
  scoresRevealed: boolean;
}

export interface TeamSubmission {
  teamId: string;
  answers: string[];
  score: number;
  submitted: boolean;
}

export interface IndividualSubmission {
  teamId: string;
  playerName: string;
  answers: string[];
  score: number;
}
