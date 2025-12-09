import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { HomeView } from './components/HomeView';
import { ControlView } from './components/ControlView';
import { SetupView } from './components/SetupView';
import { BrandingView } from './components/BrandingView';
import { TeamView } from './components/TeamView';
import { LoadGameView } from './components/LoadGameView';
import { QuizEditorView } from './components/QuizEditorView';
import { ResultsView } from './components/ResultsView';
import { initAudio, playRoundSound } from './utils/sound';
import { useGame } from './hooks/useGame';
import type { Branding, GameConfig, GameState, QuizQuestion } from './types/game';

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

export function GameApp() {
  const getInitialState = () => {
    try {
      const search = window.location.search.split('/?')[0];
      const params = new URLSearchParams(search);
      const view = params.get('view') || 'home';
      let gameId = params.get('game') || null;

      if (gameId && gameId.includes('/')) {
        gameId = gameId.split('/')[0];
      }

      console.log('Initial state:', { view, gameId, url: window.location.href });
      return { view, gameId };
    } catch (error) {
      console.error('Error parsing URL:', error);
      return { view: 'home', gameId: null };
    }
  };

  const initialState = getInitialState();
  const [view, setViewState] = useState(initialState.view);
  const [currentGameId, setCurrentGameId] = useState<string | null>(initialState.gameId);
  const [localBranding, setLocalBranding] = useState<Branding>(defaultBranding);
  const [localConfig, setLocalConfig] = useState<GameConfig | null>(null);
  const [savedGamesCount, setSavedGamesCount] = useState(0);
  const [localTeamQuiz, setLocalTeamQuiz] = useState<QuizQuestion[]>([]);
  const [localIndividualQuiz, setLocalIndividualQuiz] = useState<QuizQuestion[]>([]);

  // 🔥 NEW: Reload data from database when currentGameId changes
  useEffect(() => {
    if (currentGameId) {
      reloadGameData();
    }
  }, [currentGameId]);

  // 🔥 NEW: Function to reload all game data from database
  const reloadGameData = async () => {
    if (!currentGameId) return;

    console.log('🔄 Reloading game data from database...');
    
    // Load game config and branding
    const { data: game } = await supabase
      .from('games')
      .select('config, branding')
      .eq('id', currentGameId)
      .single();

    if (game) {
      setLocalConfig(game.config as GameConfig);
      setLocalBranding(game.branding as Branding);
      console.log('✅ Config and branding reloaded');
    }

    // Load team quiz
    const { data: teamQuizData } = await supabase
      .from('team_quizzes')
      .select('questions')
      .eq('game_id', currentGameId)
      .maybeSingle();

    if (teamQuizData?.questions) {
      setLocalTeamQuiz(teamQuizData.questions as QuizQuestion[]);
      console.log('✅ Team quiz reloaded:', (teamQuizData.questions as QuizQuestion[]).length, 'questions');
    }

    // Load individual quiz
    const { data: individualQuizData } = await supabase
      .from('individual_quizzes')
      .select('questions')
      .eq('game_id', currentGameId)
      .maybeSingle();

    if (individualQuizData?.questions) {
      setLocalIndividualQuiz(individualQuizData.questions as QuizQuestion[]);
      console.log('✅ Individual quiz reloaded:', (individualQuizData.questions as QuizQuestion[]).length, 'questions');
    }
  };

  const setView = (newView: string) => {
    console.log('setView called with:', newView);
    setViewState(newView);
    const params = new URLSearchParams(window.location.search);
    if (newView !== 'home') {
      params.set('view', newView);
    } else {
      params.delete('view');
    }
    if (currentGameId && (newView === 'control' || newView === 'team' || newView === 'setup' || newView === 'quiz-menu' || newView === 'quiz-team' || newView === 'quiz-individual')) {
      params.set('game', currentGameId);
    } else if (newView === 'team') {
      params.delete('game');
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    console.log('New URL:', newUrl);
    window.history.pushState({}, '', newUrl);
    
    // 🔥 NEW: Reload data when navigating back to setup or quiz views
    if ((newView === 'setup' || newView === 'quiz-team' || newView === 'quiz-individual') && currentGameId) {
      reloadGameData();
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const search = window.location.search.split('/?')[0];
      const params = new URLSearchParams(search);
      const urlView = params.get('view') || 'home';
      let urlGameId = params.get('game') || null;

      if (urlGameId && urlGameId.includes('/')) {
        urlGameId = urlGameId.split('/')[0];
      }

      console.log('PopState - updating view to:', urlView, 'gameId:', urlGameId);
      setViewState(urlView);
      setCurrentGameId(urlGameId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const {
    config,
    branding,
    gameState,
    teamQuiz,
    individualQuiz,
    teamSubmissions,
    individualSubmissions,
    updateGameState
  } = useGame(currentGameId);

  useEffect(() => {
    initAudio();
    loadSavedGames();

    const savedBranding = localStorage.getItem('fld-branding');
    if (savedBranding) {
      try {
        setLocalBranding(JSON.parse(savedBranding));
      } catch (e) {
        console.error('Error parsing branding:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (branding) {
      setLocalBranding(branding);
    }
    if (config) {
      setLocalConfig(config);
    }
  }, [branding, config]);

  const loadSavedGames = async () => {
    const { count } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true });
    setSavedGamesCount(count || 0);
  };

  const startGame = async () => {
    if (!localConfig) return;

    try {
      // Generate unique game code using timestamp
      const gameCode = 'FLD-' + Date.now().toString(36).slice(-6).toUpperCase();

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          name: localConfig.gameName,
          code: gameCode,
          config: localConfig as never,
          branding: localBranding as never
        })
        .select()
        .single();

      if (gameError) throw gameError;

      if (localTeamQuiz.length > 0) {
        await supabase.from('team_quizzes').insert({
          game_id: game.id,
          questions: localTeamQuiz as never
        });
      }

      if (localIndividualQuiz.length > 0) {
        await supabase.from('individual_quizzes').insert({
          game_id: game.id,
          questions: localIndividualQuiz as never
        });
      }

      await supabase.from('game_state').insert({
        game_id: game.id,
        is_running: true,
        current_round: 0,
        time_remaining: localConfig.stationDuration * 60,
        is_paused: false,
        team_quiz_unlocked: false,
        individual_quiz_unlocked: false,
        scores_revealed: false
      });

      setCurrentGameId(game.id);
      setView('control');
      loadSavedGames();
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Error starting game');
    }
  };

  const loadGame = async (gameId: string) => {
    setCurrentGameId(gameId);
    await reloadGameData(); // 🔥 NEW: Reload before navigating
    setView('control');
  };

  const exportGame = () => {
    const data = JSON.stringify(
      {
        gameConfig: localConfig,
        branding: localBranding,
        teamQuiz: localTeamQuiz,
        individualQuiz: localIndividualQuiz
      },
      null,
      2
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${localConfig?.gameName || 'fld-game'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importGame = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.branding) {
          setLocalBranding(data.branding);
          localStorage.setItem('fld-branding', JSON.stringify(data.branding));
        }
        if (data.gameConfig) {
          setLocalConfig(data.gameConfig);
        }
        if (data.teamQuiz) {
          setLocalTeamQuiz(data.teamQuiz);
        }
        if (data.individualQuiz) {
          setLocalIndividualQuiz(data.individualQuiz);
        }
        alert('✓ Geïmporteerd!');
      } catch {
        alert('❌ Fout bij importeren');
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateState = async (updates: Partial<GameState>) => {
    if (!currentGameId || !gameState) return;

    const prevRound = gameState.currentRound;
    const newRound = updates.currentRound ?? gameState.currentRound;

    if (newRound > prevRound) {
      playRoundSound();
    }

    await updateGameState(updates);
  };

  // 🔥 NEW: Create game in DB immediately when clicking "NEW GAME"
  const createNewGame = async () => {
    try {
      const gameCode = 'FLD-' + Date.now().toString(36).slice(-6).toUpperCase();
      
      const { data: game, error } = await supabase
        .from('games')
        .insert({
          name: 'Nieuw Spel',
          code: gameCode,
          config: {
            gameName: '',
            numStations: 8,
            numTeams: 5,
            stationDuration: 15,
            pauseDuration: 15,
            pauseAfterRound: 4,
            stations: [],
            teams: [],
            routes: {}
          },
          branding: localBranding
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentGameId(game.id);
      setView('setup');
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Fout bij aanmaken spel');
    }
  };

  if (view === 'home') {
    return (
      <HomeView
        branding={localBranding}
        gameConfig={localConfig}
        savedGamesCount={savedGamesCount}
        onNavigate={(v) => {
          if (v === 'setup') {
            createNewGame(); // Create game first!
          } else {
            setView(v);
          }
        }}
        onStartGame={startGame}
        onExport={exportGame}
        onImport={importGame}
      />
    );
  }

  if (view === 'control' && currentGameId && config && gameState) {
    if (gameState.gameEnded) {
      return (
        <ResultsView
          branding={localBranding}
          config={config}
          teamSubmissions={teamSubmissions}
          individualSubmissions={individualSubmissions}
          onBack={() => setView('home')}
        />
      );
    }

    return (
      <ControlView
        branding={localBranding}
        config={config}
        gameState={gameState}
        teamQuiz={teamQuiz}
        individualQuiz={individualQuiz}
        teamSubmissions={teamSubmissions}
        individualSubmissions={individualSubmissions}
        gameId={currentGameId}
        onUpdateState={handleUpdateState}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'branding') {
    return (
      <BrandingView
        initialBranding={localBranding}
        onSave={(newBranding) => {
          setLocalBranding(newBranding);
          localStorage.setItem('fld-branding', JSON.stringify(newBranding));
          setView('home');
        }}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'setup') {
    return (
      <SetupView
        branding={localBranding}
        initialConfig={localConfig}
        onBack={() => setView('home')}
        onSave={async (newConfig) => {
          console.log('💾 === SAVE GAME START ===');
          console.log('Current game ID:', currentGameId);
          console.log('New config:', {
            gameName: newConfig.gameName,
            teamsCount: newConfig.teams?.length,
            teams: newConfig.teams,
            stationsCount: newConfig.stations?.length,
            stations: newConfig.stations
          });
          console.log('Local quiz counts:', {
            teamQuiz: localTeamQuiz.length,
            individualQuiz: localIndividualQuiz.length
          });
          
          try {
            let gameCode: string | undefined;
            if (!currentGameId) {
              gameCode = 'FLD-' + Date.now().toString(36).slice(-6).toUpperCase();
              console.log('Generated new game code:', gameCode);
            } else {
              console.log('Updating existing game, no new code');
            }

            console.log('About to upsert to database...');
            
            // Save to database
            const { data: game, error } = await supabase
              .from('games')
              .upsert({
                id: currentGameId || undefined,
                name: newConfig.gameName,
                code: gameCode,
                config: newConfig as never,
                branding: localBranding as never
              })
              .select()
              .single();

            if (error) {
              console.error('❌ Database error:', error);
              throw error;
            }
            
            console.log('✅ Game saved successfully!', {
              gameId: game.id,
              gameName: game.name,
              gameCode: game.code
            });

            // Save quiz questions if they exist
            if (localTeamQuiz.length > 0) {
              console.log('Saving team quiz with', localTeamQuiz.length, 'questions');
              await supabase.from('team_quizzes').upsert({
                game_id: game.id,
                questions: localTeamQuiz as never
              });
              console.log('✅ Team quiz saved');
            }

            if (localIndividualQuiz.length > 0) {
              console.log('Saving individual quiz with', localIndividualQuiz.length, 'questions');
              await supabase.from('individual_quizzes').upsert({
                game_id: game.id,
                questions: localIndividualQuiz as never
              });
              console.log('✅ Individual quiz saved');
            }

            setCurrentGameId(game.id);
            setLocalConfig(newConfig);
            localStorage.setItem('fld-game-config', JSON.stringify(newConfig));
            console.log('💾 === SAVE COMPLETE ===');
            alert('✓ Configuratie opgeslagen in database!');
            setView('home');
            loadSavedGames();
          } catch (error: any) {
            console.error('Error saving config:', error);
            console.error('Error details:', {
              message: error?.message,
              code: error?.code,
              details: error?.details,
              hint: error?.hint
            });
            alert('❌ Fout bij opslaan naar database');
          }
        }}
        onNavigateToQuiz={() => setView('quiz-menu')}
      />
    );
  }

  if (view === 'quiz-menu') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
        color: '#fff',
        padding: '2rem',
        fontFamily: localBranding.bodyFont
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <button
            onClick={() => setView('setup')}
            style={{
              backgroundColor: 'transparent',
              color: localBranding.primaryColor,
              border: `2px solid ${localBranding.primaryColor}`,
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              fontFamily: localBranding.headerFont,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              marginBottom: '2rem'
            }}
          >
            ← Terug
          </button>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            marginBottom: '2rem',
            fontFamily: localBranding.headerFont,
            color: localBranding.primaryColor
          }}>
            Quiz Beheer
          </h1>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem'
          }}>
            <button
              onClick={() => setView('quiz-team')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'left'
              }}
            >
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                fontFamily: localBranding.headerFont,
                color: localBranding.primaryColor,
                marginBottom: '0.5rem'
              }}>
                👥 Team Quiz
              </h2>
              <p style={{
                color: '#9ca3af',
                fontSize: '0.875rem',
                marginTop: '0.5rem'
              }}>
                {localTeamQuiz.length} vragen
              </p>
              <p style={{
                color: '#d1d5db',
                fontSize: '0.875rem',
                marginTop: '0.5rem'
              }}>
                Klik om te bewerken
              </p>
            </button>

            <button
              onClick={() => setView('quiz-individual')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'left'
              }}
            >
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                fontFamily: localBranding.headerFont,
                color: localBranding.primaryColor,
                marginBottom: '0.5rem'
              }}>
                👤 Individuele Quiz
              </h2>
              <p style={{
                color: '#9ca3af',
                fontSize: '0.875rem',
                marginTop: '0.5rem'
              }}>
                {localIndividualQuiz.length} vragen
              </p>
              <p style={{
                color: '#d1d5db',
                fontSize: '0.875rem',
                marginTop: '0.5rem'
              }}>
                Klik om te bewerken
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'quiz-team') {
    return (
      <QuizEditorView
        quizType="team"
        initialQuestions={localTeamQuiz || []}
        branding={localBranding}
        onSave={(questions) => {
          setLocalTeamQuiz(questions);
          // 🔥 NEW: Auto-save to database immediately
          if (currentGameId) {
            supabase.from('team_quizzes').upsert({
              game_id: currentGameId,
              questions: questions as never
            });
          }
        }}
        onBack={() => setView('quiz-menu')}
        
      />
    );
  }

  if (view === 'quiz-individual') {
    return (
      <QuizEditorView
        quizType="individual"
        initialQuestions={localIndividualQuiz || []}
        branding={localBranding}
        onSave={(questions) => {
          setLocalIndividualQuiz(questions);
          // 🔥 NEW: Auto-save to database immediately
          if (currentGameId) {
            supabase.from('individual_quizzes').upsert({
              game_id: currentGameId,
              questions: questions as never
            });
          }
        }}
        onBack={() => setView('quiz-menu')}
        
      />
    );
  }

  if (view === 'load') {
    return (
      <LoadGameView
        branding={localBranding}
        onLoadGame={loadGame}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'team') {
    return (
      <TeamView
        gameId={currentGameId || undefined}
        onExit={() => setView('home')}
      />
    );
  }

  if (view === 'results') {
    return (
      <ResultsView
        branding={localBranding}
        config={config!}
        teamSubmissions={teamSubmissions}
        individualSubmissions={individualSubmissions}
        onBack={() => setView('control')}
      />
    );
  }

  console.log('Fallback view rendering. Current view:', view);
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Loading...</h1>
        <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
          View: {view} | Game ID: {currentGameId || 'none'}
        </p>
        <button
          onClick={() => setView('home')}
          style={{
            backgroundColor: localBranding.primaryColor,
            color: localBranding.secondaryColor,
            padding: '1rem 2rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ← Terug naar Home
        </button>
      </div>
    </div>
  );
}