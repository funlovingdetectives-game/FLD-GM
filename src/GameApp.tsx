import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { HomeView } from './components/HomeView';
import { ControlView } from './components/ControlView';
import { SetupView } from './components/SetupView';
import { BrandingView } from './components/BrandingView';
import { LoadGameView } from './components/LoadGameView';
import { QuizEditorView } from './components/QuizEditorView';
import { CreateGameModal } from './components/CreateGameModal';
import { SaveConfirmation } from './components/SaveConfirmation';
import { GameHeader } from './components/GameHeader';
import { initAudio, playRoundSound } from './utils/sound';
import { useGame } from './hooks/useGame';
import type { Branding, GameConfig, QuizQuestion } from './types/game';

const defaultBranding: Branding = {
  logoUrl: '',
  companyName: 'FUN LOVING DETECTIVES',
  primaryColor: '#FFB800',
  secondaryColor: '#000000',
  headerFont: 'system-ui',
  bodyFont: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  customFontUrl: '',
  customFontName: ''
};

const defaultConfig: GameConfig = {
  gameName: '',
  numTeams: 2,
  numStations: 0,
  stationDuration: 15,
  pauseDuration: 5,
  pauseAfterRound: 1,
  teams: [],
  stations: [],
  routes: {}
};

export function GameApp() {
  const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view') || 'home';
    const gameId = params.get('game') || null;
    return { view, gameId };
  };

  const initialState = getInitialState();
  const [view, setViewState] = useState(initialState.view);
  const [currentGameId, setCurrentGameId] = useState<string | null>(initialState.gameId);
  const [localBranding, setLocalBranding] = useState<Branding>(defaultBranding);
  const [localConfig, setLocalConfig] = useState<GameConfig>(defaultConfig);
  const [localTeamQuiz, setLocalTeamQuiz] = useState<QuizQuestion[]>([]);
  const [localIndividualQuiz, setLocalIndividualQuiz] = useState<QuizQuestion[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const {
    config,
    branding,
    gameCode,
    gameState,
    teamQuiz,
    individualQuiz,
    teamSubmissions,
    individualSubmissions,
    updateGameState
  } = useGame(currentGameId);

  const setView = (newView: string) => {
    setViewState(newView);
    const params = new URLSearchParams();
    if (newView !== 'home') {
      params.set('view', newView);
    }
    if (currentGameId && newView !== 'home' && newView !== 'load') {
      params.set('game', currentGameId);
    }
    const newUrl = params.toString() ? `/admin?${params.toString()}` : '/admin';
    window.history.pushState({}, '', newUrl);
  };

  useEffect(() => {
    initAudio();
  }, []);

  useEffect(() => {
    if (branding) setLocalBranding(branding);
    if (config) setLocalConfig(config);
    if (teamQuiz) setLocalTeamQuiz(teamQuiz);
    if (individualQuiz) setLocalIndividualQuiz(individualQuiz);
  }, [branding, config, teamQuiz, individualQuiz]);

  // CREATE NEW GAME - gebeurt METEEN, niet bij START
  const createNewGame = async (gameName: string) => {
    try {
      const gameCode = 'FLD-' + Date.now().toString(36).slice(-6).toUpperCase();
      
      const newConfig = {
        ...defaultConfig,
        gameName
      };

      const { data: game, error } = await supabase
        .from('games')
        .insert({
          name: gameName,
          code: gameCode,
          config: newConfig as never,
          branding: localBranding as never
        })
        .select()
        .single();

      if (error) throw error;

      // Initialize empty quizzes
      await supabase.from('team_quizzes').insert({
        game_id: game.id,
        questions: [] as never
      });

      await supabase.from('individual_quizzes').insert({
        game_id: game.id,
        questions: [] as never
      });

      setCurrentGameId(game.id);
      setLocalConfig(newConfig);
      setShowCreateModal(false);
      setSaveMessage(`✅ Spel '${gameName}' (${gameCode}) aangemaakt`);
      setView('setup');
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Fout bij aanmaken spel');
    }
  };

  // SAVE CHANGES - update bestaand spel
  const saveGame = async (configToSave?: GameConfig) => {
    if (!currentGameId) return;
    
    const saveConfig = configToSave || localConfig;
    if (configToSave) {
      setLocalConfig(configToSave);
    }

    try {
      await supabase
        .from('games')
        .update({
          name: saveConfig.gameName,
          config: saveConfig as never,
          branding: localBranding as never
        })
        .eq('id', currentGameId);

      await supabase
        .from('team_quizzes')
        .update({ questions: localTeamQuiz as never })
        .eq('game_id', currentGameId);

      await supabase
        .from('individual_quizzes')
        .update({ questions: localIndividualQuiz as never })
        .eq('game_id', currentGameId);

      setSaveMessage(`✅ Spel '${saveConfig.gameName}' (${gameCode}) opgeslagen`);
    } catch (error) {
      console.error('Error saving game:', error);
      alert('Fout bij opslaan');
    }
  };

  // START GAME - alleen game_state updaten
  const startGame = async () => {
    if (!currentGameId || !localConfig) return;

    try {
      // Check if game_state exists
      const { data: existingState } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_id', currentGameId)
        .maybeSingle();

      if (!existingState) {
        // Create initial game_state
        await supabase.from('game_state').insert({
          game_id: currentGameId,
          is_running: true,
          current_round: 1,
          time_remaining: localConfig.stationDuration * 60,
          is_paused: false,
          team_quiz_unlocked: false,
          individual_quiz_unlocked: false
        });

        // Create team submissions
        for (const team of localConfig.teams) {
          await supabase.from('team_submissions').insert({
            game_id: currentGameId,
            team_id: team.id,
            answers: {} as never,
            score: 0,
            submitted: false
          });
        }
      } else {
        // Just start the game
        await updateGameState({ isRunning: true });
      }

      setView('control');
      playRoundSound();
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Fout bij starten spel');
    }
  };

  const loadGame = async (gameId: string) => {
    setCurrentGameId(gameId);
    setView('setup');
  };

  const handleUpdateState = async (updates: any) => {
    await updateGameState(updates);
  };

  // HOME VIEW
  if (view === 'home') {
    return (
      <div>
        <HomeView
          branding={localBranding}
          gameConfig={localConfig}
          savedGamesCount={0}
          onNavigate={(view) => {
            if (view === 'setup') {
              setShowCreateModal(true);
            } else {
              setView(view);
            }
          }}
          onStartGame={startGame}
          onExport={() => {}}
          onImport={() => {}}
        />
        {showCreateModal && (
          <CreateGameModal
            branding={localBranding}
            onConfirm={createNewGame}
            onCancel={() => setShowCreateModal(false)}
          />
        )}
      </div>
    );
  }

  // LOAD GAME VIEW
  if (view === 'load') {
    return (
      <LoadGameList
        branding={localBranding}
        onLoadGame={loadGame}
        onBack={() => setView('home')}
      />
    );
  }

  // BRANDING VIEW
  if (view === 'branding') {
    return (
      <BrandingView
        initialBranding={localBranding}
        onSave={(newBranding) => {
          setLocalBranding(newBranding);
          setView('home');
        }}
        onBack={() => setView('home')}
      />
    );
  }

  // SETUP VIEW (requires gameId)
  if (view === 'setup' && currentGameId && gameCode) {
    return (
      <div>
        <GameHeader
          gameName={localConfig.gameName}
          gameCode={gameCode}
          branding={localBranding}
        />
        <SetupView
          branding={localBranding}
          initialConfig={localConfig}
          onBack={() => setView('home')}
          onSave={saveGame}
          onNavigateToQuiz={() => setView('team-quiz')}
        />
        {saveMessage && (
          <SaveConfirmation
            message={saveMessage}
            onClose={() => setSaveMessage('')}
          />
        )}
      </div>
    );
  }

  // QUIZ EDITORS
  if (view === 'team-quiz' && currentGameId && gameCode) {
    return (
      <div>
        <GameHeader
          gameName={localConfig.gameName}
          gameCode={gameCode}
          branding={localBranding}
        />
        <QuizEditorView
          branding={localBranding}
          quizType="team"
          initialQuestions={localTeamQuiz}
          onSave={(questions) => {
            setLocalTeamQuiz(questions);
            saveGame();
          }}
          onBack={() => setView('setup')}
        />
        {saveMessage && (
          <SaveConfirmation
            message={saveMessage}
            onClose={() => setSaveMessage('')}
          />
        )}
      </div>
    );
  }

  if (view === 'individual-quiz' && currentGameId && gameCode) {
    return (
      <div>
        <GameHeader
          gameName={localConfig.gameName}
          gameCode={gameCode}
          branding={localBranding}
        />
        <QuizEditorView
          branding={localBranding}
          quizType="individual"
          initialQuestions={localIndividualQuiz}
          onSave={(questions) => {
            setLocalIndividualQuiz(questions);
            saveGame();
          }}
          onBack={() => setView('setup')}
        />
        {saveMessage && (
          <SaveConfirmation
            message={saveMessage}
            onClose={() => setSaveMessage('')}
          />
        )}
      </div>
    );
  }

  // CONTROL VIEW
  if (view === 'control' && currentGameId && gameCode && gameState) {
    return (
      <div>
        <GameHeader
          gameName={localConfig.gameName}
          gameCode={gameCode}
          branding={localBranding}
        />
        <ControlView
          branding={localBranding}
          config={localConfig}
          gameState={gameState}
          teamQuiz={teamQuiz || []}
          individualQuiz={individualQuiz || []}
          teamSubmissions={teamSubmissions}
          individualSubmissions={individualSubmissions}
          gameId={currentGameId}
          gameCode={gameCode}
          onBack={() => setView('home')}
          onUpdateState={handleUpdateState}
        />
      </div>
    );
  }

  // Fallback
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000',
      color: '#fff'
    }}>
      Loading...
    </div>
  );
}

// Load game list component
function LoadGameList({ branding, onLoadGame, onBack }: any) {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });
    setGames(data || []);
  };

  return (
    <LoadGameView
      branding={branding}
      games={games}
      onLoadGame={onLoadGame}
      onBack={onBack}
    />
  );
}