/*
  # FLD Game Master Database Schema
  
  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `name` (text) - Game name
      - `config` (jsonb) - Complete game configuration including stations, teams, routes
      - `branding` (jsonb) - Logo, colors, fonts
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `team_quizzes`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `questions` (jsonb) - Array of quiz questions
      - `created_at` (timestamptz)
      
    - `individual_quizzes`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `questions` (jsonb) - Array of quiz questions
      - `created_at` (timestamptz)
      
    - `game_state`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key, unique)
      - `is_running` (boolean) - Game active status
      - `current_round` (int) - Current round number
      - `time_remaining` (int) - Seconds remaining
      - `is_paused` (boolean) - Pause status
      - `team_quiz_unlocked` (boolean)
      - `individual_quiz_unlocked` (boolean)
      - `scores_revealed` (boolean)
      - `updated_at` (timestamptz)
      
    - `team_submissions`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `team_id` (text) - Team identifier
      - `answers` (jsonb) - Array of answers
      - `score` (int) - Calculated score
      - `submitted` (boolean)
      - `submitted_at` (timestamptz)
      
    - `individual_submissions`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `team_id` (text) - Team identifier
      - `player_name` (text) - Player name
      - `answers` (jsonb) - Array of answers
      - `score` (int) - Calculated score
      - `submitted_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since this is a local game master app)
    
  3. Important Notes
    - All game data stored in structured JSON for flexibility
    - Real-time subscriptions enabled for live updates
    - Indexes added for performance
*/

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team quizzes table
CREATE TABLE IF NOT EXISTS team_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create individual quizzes table
CREATE TABLE IF NOT EXISTS individual_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create game state table
CREATE TABLE IF NOT EXISTS game_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  is_running boolean DEFAULT false,
  current_round int DEFAULT 0,
  time_remaining int DEFAULT 0,
  is_paused boolean DEFAULT false,
  team_quiz_unlocked boolean DEFAULT false,
  individual_quiz_unlocked boolean DEFAULT false,
  scores_revealed boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Create team submissions table
CREATE TABLE IF NOT EXISTS team_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id text NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score int DEFAULT 0,
  submitted boolean DEFAULT false,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(game_id, team_id)
);

-- Create individual submissions table
CREATE TABLE IF NOT EXISTS individual_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  team_id text NOT NULL,
  player_name text NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score int DEFAULT 0,
  submitted_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_quizzes_game_id ON team_quizzes(game_id);
CREATE INDEX IF NOT EXISTS idx_individual_quizzes_game_id ON individual_quizzes(game_id);
CREATE INDEX IF NOT EXISTS idx_game_state_game_id ON game_state(game_id);
CREATE INDEX IF NOT EXISTS idx_team_submissions_game_id ON team_submissions(game_id);
CREATE INDEX IF NOT EXISTS idx_individual_submissions_game_id ON individual_submissions(game_id);
CREATE INDEX IF NOT EXISTS idx_individual_submissions_score ON individual_submissions(score DESC);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (game master app)
CREATE POLICY "Allow public read access to games"
  ON games FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to games"
  ON games FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to games"
  ON games FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access to games"
  ON games FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to team_quizzes"
  ON team_quizzes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to team_quizzes"
  ON team_quizzes FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to team_quizzes"
  ON team_quizzes FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to individual_quizzes"
  ON individual_quizzes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to individual_quizzes"
  ON individual_quizzes FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to individual_quizzes"
  ON individual_quizzes FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to game_state"
  ON game_state FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to game_state"
  ON game_state FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to game_state"
  ON game_state FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to team_submissions"
  ON team_submissions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to team_submissions"
  ON team_submissions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to team_submissions"
  ON team_submissions FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to individual_submissions"
  ON individual_submissions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to individual_submissions"
  ON individual_submissions FOR INSERT
  TO public
  WITH CHECK (true);