/*
  # Add Game Code Column

  1. Changes
    - Add `game_code` column to `games` table
      - Unique 6-character code in format FLD-XXX
      - Used for easy game access by teams
    - Create unique index on game_code
    - Add function to generate unique game codes

  2. Notes
    - Game codes follow pattern: FLD-001, FLD-002, etc.
    - Automatically generated when creating new games
    - Existing games will get codes assigned
*/

-- Add game_code column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'game_code'
  ) THEN
    ALTER TABLE games ADD COLUMN game_code text;
  END IF;
END $$;

-- Create function to generate unique game code
CREATE OR REPLACE FUNCTION generate_game_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
  counter int;
BEGIN
  -- Find the highest existing code number
  SELECT COALESCE(MAX(CAST(SUBSTRING(game_code FROM 5) AS integer)), 0) + 1
  INTO counter
  FROM games
  WHERE game_code LIKE 'FLD-%';
  
  LOOP
    new_code := 'FLD-' || LPAD(counter::text, 3, '0');
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM games WHERE game_code = new_code)
    INTO code_exists;
    
    EXIT WHEN NOT code_exists;
    
    counter := counter + 1;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Update existing games without codes using a CTE
WITH numbered_games AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM games
  WHERE game_code IS NULL
)
UPDATE games
SET game_code = 'FLD-' || LPAD(numbered_games.rn::text, 3, '0')
FROM numbered_games
WHERE games.id = numbered_games.id;

-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'games_game_code_key'
  ) THEN
    ALTER TABLE games ADD CONSTRAINT games_game_code_key UNIQUE (game_code);
  END IF;
END $$;

-- Make game_code required for new games (only if no NULL values exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM games WHERE game_code IS NULL) THEN
    ALTER TABLE games ALTER COLUMN game_code SET NOT NULL;
  END IF;
END $$;