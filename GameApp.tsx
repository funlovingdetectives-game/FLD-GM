import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { HomeView } from './components/HomeView';
import { ControlView } from './components/ControlView';
import { SetupView } from './components/SetupView';
import { BrandingView } from './components/BrandingView';
import { TeamView } from './components/TeamView';
import { LoadGameView } from './components/LoadGameView';
import { QuizEditorView } from './components/QuizEditorView';
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
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view') || 'home';
      const gameId = params.get('game') || null;
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

  const setView = (newView: string) => {
    setViewState(newView);
    const params = new URLSearchParams(window.location.search);
    if (newView !== 'home') {
      params.set('view', newView);
    } else {
      params.delete('view');
    }
    if (currentGameId && (newView === 'control' || newView === 'team')) {
      params.set('game', currentGameId);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : '/';
    window.history.pushState({}, '', newUrl);
  };

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
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          name: localConfig.gameName,
          config: localConfig as never,
          branding: localBranding as never
        })
        .select()
        .single();

      if (gameError) throw gameError;

      await supabase.from('team_quizzes').insert({
        game_id: game.id,
        questions: localTeamQuiz as never
      });

      await supabase.from('individual_quizzes').insert({
        game_id: game.id,
        questions: localIndividualQuiz as never
      });

      await supabase.from('game_state').insert({
        game_id: game.id,
        is_running: false,
        current_round: 0,
        time_remaining: localConfig.stationDuration * 60,
        is_paused: false,
        team_quiz_unlocked: false,
        individual_quiz_unlocked: false,
        scores_revealed: false
      });

      for (const team of localConfig.teams) {
        await supabase.from('team_submissions').insert({
          game_id: game.id,
          team_id: team.id,
          answers: [] as never,
          score: 0,
          submitted: false
        });
      }

      setCurrentGameId(game.id);
      setView('control');
      playRoundSound();
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Fout bij het starten van het spel');
    }
  };

  const exportGame = () => {
    const data = JSON.stringify(
      { branding: localBranding, gameConfig: localConfig, exportedAt: new Date().toISOString() },
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

  if (view === 'home') {
    return (
      <HomeView
        branding={localBranding}
        gameConfig={localConfig}
        savedGamesCount={savedGamesCount}
        onNavigate={setView}
        onStartGame={startGame}
        onExport={exportGame}
        onImport={importGame}
      />
    );
  }

  if (view === 'control' && currentGameId && config && gameState) {
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
        onBack={() => setView('home')}
        onUpdateState={handleUpdateState}
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
          try {
            // Save to database
            const { data: game, error } = await supabase
              .from('games')
              .upsert({
                id: currentGameId || undefined,
                name: newConfig.gameName,
                config: newConfig as never,
                branding: localBranding as never
              })
              .select()
              .single();

            if (error) throw error;

            // Save quiz questions if they exist
            if (localTeamQuiz.length > 0) {
              await supabase.from('team_quizzes').upsert({
                game_id: game.id,
                questions: localTeamQuiz as never
              });
            }

            if (localIndividualQuiz.length > 0) {
              await supabase.from('individual_quizzes').upsert({
                game_id: game.id,
                questions: localIndividualQuiz as never
              });
            }

            setCurrentGameId(game.id);
            setLocalConfig(newConfig);
            localStorage.setItem('fld-game-config', JSON.stringify(newConfig));
            alert('✓ Configuratie opgeslagen in database!');
            setView('home');
            loadSavedGames();
          } catch (error) {
            console.error('Error saving config:', error);
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
                Team Quiz
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '1rem' }}>
                {localTeamQuiz.length} vragen
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
                Individuele Quiz
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '1rem' }}>
                {localIndividualQuiz.length} vragen
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
        branding={localBranding}
        quizType="team"
        initialQuestions={localTeamQuiz}
        onBack={() => setView('quiz-menu')}
        onSave={async (questions) => {
          try {
            setLocalTeamQuiz(questions);

            // Save to database if we have a game ID
            if (currentGameId) {
              await supabase.from('team_quizzes').upsert({
                game_id: currentGameId,
                questions: questions as never
              });
            }

            alert(`✓ ${questions.length} team quiz vragen opgeslagen!`);
            setView('quiz-menu');
          } catch (error) {
            console.error('Error saving team quiz:', error);
            alert('❌ Fout bij opslaan team quiz');
          }
        }}
      />
    );
  }

  if (view === 'quiz-individual') {
    return (
      <QuizEditorView
        branding={localBranding}
        quizType="individual"
        initialQuestions={localIndividualQuiz}
        onBack={() => setView('quiz-menu')}
        onSave={async (questions) => {
          try {
            setLocalIndividualQuiz(questions);

            // Save to database if we have a game ID
            if (currentGameId) {
              await supabase.from('individual_quizzes').upsert({
                game_id: currentGameId,
                questions: questions as never
              });
            }

            alert(`✓ ${questions.length} individuele quiz vragen opgeslagen!`);
            setView('quiz-menu');
          } catch (error) {
            console.error('Error saving individual quiz:', error);
            alert('❌ Fout bij opslaan individuele quiz');
          }
        }}
      />
    );
  }

  if (view === 'branding') {
    return (
      <BrandingView
        initialBranding={localBranding}
        onBack={() => setView('home')}
        onSave={(newBranding) => {
          setLocalBranding(newBranding);
          localStorage.setItem('fld-branding', JSON.stringify(newBranding));
          alert('✓ Branding opgeslagen!');
          setView('home');
        }}
      />
    );
  }

    if (view === 'load') {
    return (
      <LoadGameView
        branding={localBranding}
        onBack={() => setView('home')}
        onLoadGame={async (gameId) => {
          try {
            // Load game data from database
            const { data: game } = await supabase
              .from('games')
              .select('*')
              .eq('id', gameId)
              .single();

            if (game) {
              setLocalConfig(game.config as GameConfig);
              if (game.branding) {
                setLocalBranding(game.branding as Branding);
                localStorage.setItem('fld-branding', JSON.stringify(game.branding));
              }
            }

            // Load quiz questions from database
            const { data: teamQuizData } = await supabase
              .from('team_quizzes')
              .select('questions')
              .eq('game_id', gameId)
              .maybeSingle();

            const { data: individualQuizData } = await supabase
              .from('individual_quizzes')
              .select('questions')
              .eq('game_id', gameId)
              .maybeSingle();

            if (teamQuizData) {
              setLocalTeamQuiz(teamQuizData.questions as QuizQuestion[]);
            }

            if (individualQuizData) {
              setLocalIndividualQuiz(individualQuizData.questions as QuizQuestion[]);
            }

            setCurrentGameId(gameId);
            alert('✓ Spel geladen! Je kunt het nu bewerken.');
            setView('setup');  // ← Nu naar setup in plaats van control!
          } catch (error) {
            console.error('Error loading game:', error);
            alert('❌ Fout bij laden van spel');
            setView('home');
          }
        }}
      />
    );
  }
  if (view === 'team') {
    if (!currentGameId) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
          color: '#fff',
          padding: '2rem',
          fontFamily: localBranding.bodyFont,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '1rem',
            fontFamily: localBranding.headerFont,
            color: localBranding.primaryColor
          }}>
            Geen Game ID gevonden
          </h2>
          <p style={{ marginBottom: '2rem', color: '#9ca3af' }}>
            Je hebt een geldige game link nodig om mee te spelen.
          </p>
          <button
            onClick={() => setView('home')}
            style={{
              backgroundColor: localBranding.primaryColor,
              color: localBranding.secondaryColor,
              padding: '1rem 2rem',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              fontFamily: localBranding.headerFont,
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Naar Home
          </button>
        </div>
      );
    }

    return (
      <TeamView
        gameId={currentGameId}
        onExit={() => setView('home')}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      color: '#fff',
      padding: '2rem',
      fontFamily: localBranding.bodyFont,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontFamily: localBranding.headerFont, color: localBranding.primaryColor }}>
          Deze view wordt binnenkort toegevoegd...
        </h2>
        <button
          onClick={() => setView('home')}
          style={{
            backgroundColor: localBranding.primaryColor,
            color: localBranding.secondaryColor,
            padding: '1rem 2rem',
            fontSize: '1.125rem',
            fontWeight: 'bold',
            fontFamily: localBranding.headerFont,
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
