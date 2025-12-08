import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { GameConfig, GameState, QuizQuestion, TeamSubmission, IndividualSubmission, Branding } from '../types/game';

export function useGame(gameId: string | null) {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [teamQuiz, setTeamQuiz] = useState<QuizQuestion[]>([]);
  const [individualQuiz, setIndividualQuiz] = useState<QuizQuestion[]>([]);
  const [teamSubmissions, setTeamSubmissions] = useState<Record<string, TeamSubmission>>({});
  const [individualSubmissions, setIndividualSubmissions] = useState<IndividualSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!gameId) {
    setConfig(null);
    setBranding(null);
    setGameState(null);
    setTeamQuiz([]);
    setIndividualQuiz([]);
    setTeamSubmissions({});
    setIndividualSubmissions([]);
    setLoading(false);
    return;
  }

  setLoading(true);
  loadGame();
  const cleanup = subscribeToUpdates();

  return () => {
    if (cleanup) cleanup();
  };
}, [gameId]);


  const loadGame = async () => {
    if (!gameId) return;

    try {
      const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .maybeSingle();

      if (game) {
        setConfig(game.config as GameConfig);
        setBranding(game.branding as Branding);
      }

      const { data: state } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_id', gameId)
        .maybeSingle();

      if (state) {
        setGameState({
          isRunning: state.is_running,
          currentRound: state.current_round,
          isPaused: state.is_paused,
          timeRemaining: state.time_remaining,
          teamQuizUnlocked: state.team_quiz_unlocked,
          personalQuizUnlocked: state.individual_quiz_unlocked,
          scoresRevealed: state.scores_revealed
        });
      }

      const { data: tQuiz } = await supabase
        .from('team_quizzes')
        .select('questions')
        .eq('game_id', gameId)
        .maybeSingle();

      if (tQuiz) {
        setTeamQuiz(tQuiz.questions as QuizQuestion[]);
      }

      const { data: iQuiz } = await supabase
        .from('individual_quizzes')
        .select('questions')
        .eq('game_id', gameId)
        .maybeSingle();

      if (iQuiz) {
        setIndividualQuiz(iQuiz.questions as QuizQuestion[]);
      }

      const { data: tSubs } = await supabase
        .from('team_submissions')
        .select('*')
        .eq('game_id', gameId);

      if (tSubs) {
        const subsMap: Record<string, TeamSubmission> = {};
        tSubs.forEach(sub => {
          subsMap[sub.team_id] = {
            teamId: sub.team_id,
            answers: sub.answers as string[],
            score: sub.score,
            submitted: sub.submitted
          };
        });
        setTeamSubmissions(subsMap);
      }

      const { data: iSubs } = await supabase
        .from('individual_submissions')
        .select('*')
        .eq('game_id', gameId)
        .order('score', { ascending: false });

      if (iSubs) {
        setIndividualSubmissions(iSubs.map(sub => ({
          teamId: sub.team_id,
          playerName: sub.player_name,
          answers: sub.answers as string[],
          score: sub.score
        })));
      }
    } catch (error) {
      console.error('Error loading game:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    if (!gameId) return;

    const channel = supabase
      .channel(`game_${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state', filter: `game_id=eq.${gameId}` }, () => {
        loadGame();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_submissions', filter: `game_id=eq.${gameId}` }, () => {
        loadGame();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'individual_submissions', filter: `game_id=eq.${gameId}` }, () => {
        loadGame();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateGameState = async (updates: Partial<GameState>) => {
    if (!gameId || !gameState) return;

    const newState = { ...gameState, ...updates };
    setGameState(newState);

    await supabase
      .from('game_state')
      .upsert({
        game_id: gameId,
        is_running: newState.isRunning,
        current_round: newState.currentRound,
        is_paused: newState.isPaused,
        time_remaining: newState.timeRemaining,
        team_quiz_unlocked: newState.teamQuizUnlocked,
        individual_quiz_unlocked: newState.personalQuizUnlocked,
        scores_revealed: newState.scoresRevealed,
        updated_at: new Date().toISOString()
      });
  };

  const submitTeamQuiz = async (teamId: string, answers: string[], score: number) => {
    if (!gameId) return;

    await supabase
      .from('team_submissions')
      .upsert({
        game_id: gameId,
        team_id: teamId,
        answers: answers as unknown as never,
        score,
        submitted: true,
        submitted_at: new Date().toISOString()
      });

    await loadGame();
  };

  const submitIndividualQuiz = async (teamId: string, playerName: string, answers: string[], score: number) => {
    if (!gameId) return;

    await supabase
      .from('individual_submissions')
      .insert({
        game_id: gameId,
        team_id: teamId,
        player_name: playerName,
        answers: answers as unknown as never,
        score,
        submitted_at: new Date().toISOString()
      });

    await loadGame();
  };

  return {
    config,
    branding,
    gameState,
    teamQuiz,
    individualQuiz,
    teamSubmissions,
    individualSubmissions,
    loading,
    updateGameState,
    submitTeamQuiz,
    submitIndividualQuiz,
    reload: loadGame
  };
}
