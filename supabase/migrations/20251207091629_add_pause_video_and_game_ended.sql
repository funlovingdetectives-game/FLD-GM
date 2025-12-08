/*
  # Add Pause Video and Game Ended Fields

  1. Changes
    - Add `pause_video_url` column to game_state table
      - Stores URL of video to play during pause/briefing
      - Optional field (text, nullable)
    - Add `game_ended` column to game_state table
      - Boolean flag to indicate if game has ended
      - Defaults to false
  
  2. Purpose
    - Enable video playback during pause periods for teams
    - Support end-game state to show results view
    
  3. Notes
    - These are non-breaking changes
    - Existing games will have null pause_video_url and false game_ended
*/

-- Add pause_video_url column to game_state
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_state' AND column_name = 'pause_video_url'
  ) THEN
    ALTER TABLE game_state ADD COLUMN pause_video_url text;
  END IF;
END $$;

-- Add game_ended column to game_state
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_state' AND column_name = 'game_ended'
  ) THEN
    ALTER TABLE game_state ADD COLUMN game_ended boolean DEFAULT false;
  END IF;
END $$;
