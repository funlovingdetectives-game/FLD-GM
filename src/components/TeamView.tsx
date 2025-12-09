import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Team, QuizQuestion, Branding } from '../types/game';
import { Clock, Users, Trophy, CheckCircle, XCircle, Search } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';

interface SavedGame {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

interface TeamViewProps {
  gameId?: string;
  onExit: () => void;
}

export function TeamView({ gameId: initialGameId, onExit }: TeamViewProps) {
  const [gameId, setGameId] = useState<string | null>(initialGameId || null);
  const [availableGames, setAvailableGames] = useState<SavedGame[]>([]);
  const [manualGameId, setManualGameId] = useState('');
  const [showGameSelector, setShowGameSelector] = useState(!initialGameId);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [quizUnlocked, setQuizUnlocked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseVideoUrl, setPauseVideoUrl] = useState<string>('');
  const [gameEnded, setGameEnded] = useState(false);
  const [branding, setBranding] = useState<Branding>({
    headerFont: 'Arial Black, sans-serif',
    bodyFont: 'Arial, sans-serif',
    primaryColor: '#fbbf24',
    secondaryColor: '#000',
    logoUrl: '',
    companyName: '',
    customFontUrl: '',
    customFontName: ''
  });

  useTimer(isRunning, timeRemaining, (newTime) => {
    setTimeRemaining(newTime);
  });

  useEffect(() => {
    if (!initialGameId) {
      loadAvailableGames();
    }
  }, []);

  useEffect(() => {
    if (gameId) {
      loadGame();
      subscribeToGameState();
      subscribeToSubmission();
    }
  }, [gameId]);

  async function loadAvailableGames() {
    const { data } = await supabase
      .from('games')
      .select('id, name, code, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setAvailableGames(data as any);
    }
  }

  function handleSelectGame(selectedGameId: string) {
    setGameId(selectedGameId);
    setShowGameSelector(false);
  }

  async function handleManualGameId() {
    const gameCode = manualGameId.trim().toUpperCase();
    if (!gameCode) return;

    const { data } = await supabase
      .from('games')
      .select('id')
      .eq('code', gameCode)
      .maybeSingle();

    if (data) {
      setGameId(data.id);
      setShowGameSelector(false);
    } else {
      alert('Game niet gevonden. Controleer de Game ID.');
    }
  }

  useEffect(() => {
    if (selectedTeam) {
      loadQuestions();
    }
  }, [selectedTeam]);

  async function loadGame() {
    const { data: game } = await supabase
      .from('games')
      .select('config, branding')
      .eq('id', gameId)
      .maybeSingle();

    if (game?.config) {
      const config = game.config as any;
      setTeams(config.teams || []);
    }

    if (game?.branding) {
      setBranding(game.branding as Branding);
    }
  }

  async function loadQuestions() {
    const { data } = await supabase
      .from('team_quizzes')
      .select('questions')
      .eq('game_id', gameId)
      .maybeSingle();

    if (data?.questions) {
      const qs = data.questions as QuizQuestion[];
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(''));
    }
  }

  function subscribeToGameState() {
    const channel = supabase
      .channel(`game-state-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const state = payload.new as any;
          setQuizUnlocked(state.team_quiz_unlocked || false);
          setTimeRemaining(state.time_remaining || 0);
          setCurrentRound(state.current_round || 0);
          setIsRunning(state.is_running || false);
          setIsPaused(state.is_paused || false);
          setPauseVideoUrl(state.pause_video_url || '');
          setGameEnded(state.game_ended || false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  function subscribeToSubmission() {
    if (!selectedTeam) return;

    const channel = supabase
      .channel(`team-submission-${gameId}-${selectedTeam.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_submissions',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const submission = payload.new as any;
          if (submission.team_id === selectedTeam.id) {
            setSubmitted(submission.submitted);
            setScore(submission.score);
            if (submission.answers) {
              setAnswers(submission.answers as string[]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleSubmit() {
    if (!selectedTeam || submitted) return;

    let calculatedScore = 0;
    answers.forEach((answer, idx) => {
      const question = questions[idx];
      if (question.type === 'multiple-choice') {
        if (answer === question.correctAnswer) {
          calculatedScore += question.points;
        }
      }
    });

    const { error } = await supabase
      .from('team_submissions')
      .upsert({
        game_id: gameId,
        team_id: selectedTeam.id,
        answers,
        score: calculatedScore,
        submitted: true,
      });

    if (!error) {
      setSubmitted(true);
      setScore(calculatedScore);
    }
  }

  function handleAnswerChange(index: number, value: string) {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showGameSelector) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
        padding: 'clamp(1rem, 3vw, 2rem)',
        fontFamily: branding.bodyFont
      }}>
        <div style={{
          maxWidth: '1024px',
          margin: '0 auto'
        }}>
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '1rem',
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            color: '#fff'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <h1 style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 'bold',
                fontFamily: branding.headerFont,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: branding.primaryColor
              }}>
                <Search size={32} />
                Selecteer een spel
              </h1>
              <button
                onClick={onExit}
                style={{
                  padding: '0.5rem 1rem',
                  color: '#9ca3af',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontFamily: branding.headerFont
                }}
              >
                Terug
              </button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                fontWeight: 'bold',
                color: '#d1d5db',
                marginBottom: '0.5rem'
              }}>
                Voer Game Code in
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={manualGameId}
                  onChange={(e) => setManualGameId(e.target.value.toUpperCase())}
                  placeholder="Bijv. FLD-001"
                  style={{
                    flex: '1 1 250px',
                    padding: '0.75rem',
                    border: '2px solid #374151',
                    borderRadius: '0.5rem',
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                    backgroundColor: '#374151',
                    color: '#fff',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualGameId()}
                />
                <button
                  onClick={handleManualGameId}
                  disabled={!manualGameId.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: branding.primaryColor,
                    color: branding.secondaryColor,
                    fontWeight: 'bold',
                    fontFamily: branding.headerFont,
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: manualGameId.trim() ? 'pointer' : 'not-allowed',
                    opacity: manualGameId.trim() ? 1 : 0.5,
                    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                  }}
                >
                  Verbinden
                </button>
              </div>
            </div>

            {availableGames.length > 0 && (
              <>
                <div style={{
                  position: 'relative',
                  margin: '2rem 0',
                  textAlign: 'center'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '1px',
                    backgroundColor: '#374151'
                  }} />
                  <span style={{
                    position: 'relative',
                    padding: '0 1rem',
                    backgroundColor: '#1f2937',
                    color: '#9ca3af',
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                  }}>
                    Of kies een actief spel
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  {availableGames.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => handleSelectGame(game.id)}
                      style={{
                        padding: '1.5rem',
                        borderRadius: '0.75rem',
                        border: `2px solid ${branding.primaryColor}`,
                        backgroundColor: '#374151',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#4b5563';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#374151';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <h3 style={{
                          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                          fontWeight: 'bold',
                          color: '#fff',
                          fontFamily: branding.headerFont
                        }}>
                          {game.name}
                        </h3>
                        <span style={{
                          fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          color: branding.primaryColor
                        }}>
                          {game.code}
                        </span>
                      </div>
                      <p style={{
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                        color: '#9ca3af'
                      }}>
                        {new Date(game.created_at).toLocaleString('nl-NL')}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedTeam) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
        padding: 'clamp(1rem, 3vw, 2rem)',
        fontFamily: branding.bodyFont
      }}>
        <div style={{
          maxWidth: '1024px',
          margin: '0 auto'
        }}>
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '1rem',
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            color: '#fff'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <h1 style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 'bold',
                fontFamily: branding.headerFont,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: branding.primaryColor
              }}>
                <Users size={32} />
                Selecteer je team
              </h1>
              <button
                onClick={onExit}
                style={{
                  padding: '0.5rem 1rem',
                  color: '#9ca3af',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  fontFamily: branding.headerFont
                }}
              >
                Terug
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  style={{
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    border: `2px solid ${team.color}`,
                    backgroundColor: '#374151',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#4b5563';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#374151';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div
                      style={{
                        width: '1rem',
                        height: '1rem',
                        borderRadius: '50%',
                        backgroundColor: team.color
                      }}
                    />
                    <h3 style={{
                      fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                      fontWeight: 'bold',
                      color: '#fff',
                      fontFamily: branding.headerFont
                    }}>
                      {team.name}
                    </h3>
                  </div>
                  <p style={{
                    color: '#d1d5db',
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                    marginBottom: '0.25rem'
                  }}>
                    Aanvoerder: {team.captain}
                  </p>
                  <p style={{
                    color: '#9ca3af',
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                  }}>
                    {team.members.length} teamleden
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      padding: 'clamp(1rem, 3vw, 2rem)',
      fontFamily: branding.bodyFont
    }}>
      <div style={{
        maxWidth: '1024px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: '1rem',
          overflow: 'hidden',
          color: '#fff'
        }}>
          <div
            style={{
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              backgroundColor: selectedTeam.color
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Users size={32} />
                <div>
                  <h1 style={{
                    fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
                    fontWeight: 'bold',
                    fontFamily: branding.headerFont
                  }}>
                    {selectedTeam.name}
                  </h1>
                  <p style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                    opacity: 0.9
                  }}>
                    Aanvoerder: {selectedTeam.captain}
                  </p>
                </div>
              </div>
              <button
                onClick={onExit}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  fontFamily: branding.headerFont,
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                Terug
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(1rem, 3vw, 1.5rem)',
              marginTop: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Trophy size={20} />
                <span style={{
                  fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
                  fontWeight: 'bold'
                }}>
                  Score: {score !== null ? score : selectedTeam.score}
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Clock size={20} />
                <span style={{
                  fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
                  fontWeight: 'bold'
                }}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
              }}>
                Ronde: {currentRound + 1}
              </div>
            </div>
          </div>

          <div style={{
            padding: 'clamp(1.5rem, 4vw, 2rem)'
          }}>
            {gameEnded ? (
              <div style={{
                textAlign: 'center',
                padding: 'clamp(2rem, 5vw, 3rem) 0'
              }}>
                <Trophy size={64} style={{ margin: '0 auto 1rem', color: branding.primaryColor }} />
                <h2 style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: 'bold',
                  fontFamily: branding.headerFont,
                  marginBottom: '0.5rem',
                  color: branding.primaryColor
                }}>
                  Spel Beëindigd!
                </h2>
                <p style={{
                  color: '#9ca3af',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                }}>
                  De spelleider heeft het spel beëindigd. Bekijk de resultaten op het hoofdscherm!
                </p>
              </div>
            ) : isPaused && pauseVideoUrl ? (
              <div style={{
                textAlign: 'center',
                padding: 'clamp(1rem, 3vw, 2rem) 0'
              }}>
                <h2 style={{
                  fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
                  fontWeight: 'bold',
                  fontFamily: branding.headerFont,
                  marginBottom: '1rem',
                  color: branding.primaryColor
                }}>
                  ☕ Pauze / Briefing
                </h2>
                <div style={{
                  maxWidth: '800px',
                  margin: '0 auto',
                  backgroundColor: '#000',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  marginBottom: '1rem'
                }}>
                  <video
                    src={pauseVideoUrl}
                    controls
                    style={{
                      width: '100%',
                      display: 'block'
                    }}
                    autoPlay
                  />
                </div>
                <p style={{
                  color: '#9ca3af',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  marginTop: '1rem'
                }}>
                  Je kunt de video opnieuw afspelen als je wilt. De pauze duurt tot de spelleider het spel hervat.
                </p>
              </div>
            ) : !quizUnlocked ? (
              <div style={{
                textAlign: 'center',
                padding: 'clamp(2rem, 5vw, 3rem) 0'
              }}>
                <Clock size={64} style={{ margin: '0 auto 1rem', color: '#9ca3af' }} />
                <h2 style={{
                  fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
                  fontWeight: 'bold',
                  fontFamily: branding.headerFont,
                  marginBottom: '0.5rem',
                  color: branding.primaryColor
                }}>
                  Wacht op de spelleider
                </h2>
                <p style={{
                  color: '#9ca3af',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                }}>
                  De teamquiz wordt binnenkort vrijgegeven...
                </p>
              </div>
            ) : submitted ? (
              <div style={{
                textAlign: 'center',
                padding: 'clamp(2rem, 5vw, 3rem) 0'
              }}>
                <CheckCircle size={64} style={{ margin: '0 auto 1rem', color: '#22c55e' }} />
                <h2 style={{
                  fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
                  fontWeight: 'bold',
                  fontFamily: branding.headerFont,
                  marginBottom: '0.5rem',
                  color: branding.primaryColor
                }}>
                  Antwoorden ingediend!
                </h2>
                <p style={{
                  color: '#9ca3af',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                  marginBottom: '2rem'
                }}>
                  Jullie hebben {score} van de {questions.reduce((sum, q) => sum + q.points, 0)} punten behaald
                </p>
                <div style={{
                  marginTop: '2rem',
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {questions.map((q, idx) => {
                    const isCorrect = answers[idx] === q.correctAnswer;
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          border: `2px solid ${isCorrect ? '#22c55e' : '#ef4444'}`,
                          backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem'
                        }}>
                          {isCorrect ? (
                            <CheckCircle size={24} style={{ color: '#22c55e', flexShrink: 0 }} />
                          ) : (
                            <XCircle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1 }}>
                            <p style={{
                              fontWeight: 'bold',
                              marginBottom: '0.5rem',
                              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                            }}>
                              {q.question}
                            </p>
                            <p style={{
                              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                              color: '#d1d5db'
                            }}>
                              Jouw antwoord: <span style={{ fontWeight: 'bold' }}>{answers[idx]}</span>
                            </p>
                            {!isCorrect && (
                              <p style={{
                                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                                color: '#d1d5db'
                              }}>
                                Correct antwoord: <span style={{ fontWeight: 'bold', color: '#22c55e' }}>{q.correctAnswer}</span>
                              </p>
                            )}
                          </div>
                          <span style={{
                            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                            fontWeight: 'bold',
                            color: '#9ca3af'
                          }}>
                            +{q.points}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <h2 style={{
                  fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
                  fontWeight: 'bold',
                  fontFamily: branding.headerFont,
                  marginBottom: '0.5rem',
                  color: branding.primaryColor
                }}>
                  Teamquiz
                </h2>
                {questions.map((question, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 'clamp(1rem, 3vw, 1.5rem)',
                      borderRadius: '0.75rem',
                      border: '2px solid #374151',
                      backgroundColor: '#374151'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                      gap: '1rem'
                    }}>
                      <h3 style={{
                        fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
                        fontWeight: 'bold',
                        flex: 1
                      }}>
                        {idx + 1}. {question.question}
                      </h3>
                      <span style={{
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                        fontWeight: 'bold',
                        color: branding.primaryColor
                      }}>
                        {question.points} pt
                      </span>
                    </div>

                    {question.imageUrl && (
                      <img
                        src={question.imageUrl}
                        alt="Question"
                        style={{
                          width: '100%',
                          maxWidth: '500px',
                          margin: '0 auto 1rem',
                          borderRadius: '0.5rem',
                          display: 'block'
                        }}
                      />
                    )}

                    {question.type === 'multiple-choice' && question.options ? (
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {question.options.map((option, optIdx) => (
                          <button
                            key={optIdx}
                            onClick={() => handleAnswerChange(idx, option)}
                            style={{
                              width: '100%',
                              padding: '1rem',
                              borderRadius: '0.5rem',
                              border: `2px solid ${answers[idx] === option ? branding.primaryColor : '#4b5563'}`,
                              backgroundColor: answers[idx] === option ? 'rgba(251, 191, 36, 0.1)' : '#1f2937',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                              color: '#fff',
                              transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                              if (answers[idx] !== option) {
                                e.currentTarget.style.borderColor = '#6b7280';
                              }
                            }}
                            onMouseOut={(e) => {
                              if (answers[idx] !== option) {
                                e.currentTarget.style.borderColor = '#4b5563';
                              }
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={answers[idx] || ''}
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        placeholder="Typ je antwoord..."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #4b5563',
                          borderRadius: '0.5rem',
                          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                          backgroundColor: '#1f2937',
                          color: '#fff'
                        }}
                      />
                    )}
                  </div>
                ))}

                <button
                  onClick={handleSubmit}
                  disabled={answers.some(a => !a)}
                  style={{
                    width: '100%',
                    padding: '1rem 1.5rem',
                    background: `linear-gradient(to right, ${branding.primaryColor}, #f97316)`,
                    color: branding.secondaryColor,
                    fontWeight: 'bold',
                    fontFamily: branding.headerFont,
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: answers.some(a => !a) ? 'not-allowed' : 'pointer',
                    fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                    opacity: answers.some(a => !a) ? 0.5 : 1,
                    transition: 'all 0.3s'
                  }}
                >
                  Antwoorden indienen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}