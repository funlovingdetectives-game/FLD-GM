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

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'open';
  options?: string[];
  correctAnswer: string;
  points: number;
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
  routes: { [key: string]: string[] };
  teamQuiz?: QuizQuestion[];
  individualQuiz?: QuizQuestion[];
}

export interface TeamSubmission {
  team_id: string;
  submitted: boolean;
  score: number;
  answers: { [key: string]: string };
}

export interface IndividualSubmission {
  player_name: string;
  team_id: string;
  submitted: boolean;
  score: number;
  answers: { [key: string]: string };
}

export interface GameState {
  currentRound: number;
  timeRemaining: number;
  isPaused: boolean;
  teamQuizUnlocked: boolean;
  individualQuizUnlocked: boolean;
  scoresRevealed: boolean;
  teamQuizSubmissions?: { [key: string]: TeamSubmission };
  individualQuizSubmissions?: IndividualSubmission[];
}