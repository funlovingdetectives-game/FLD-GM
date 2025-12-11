import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { initAudio, playTimeUpSound } from '../utils/sound';
import { ResultsView } from './ResultsView';
import type { Team, QuizQuestion, Branding, Station, GameConfig } from '../types/game';
import { Clock, Users, Trophy, Lock, Unlock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface TeamViewProps {
  gameId?: string;
}

export function TeamView({ gameId: initialGameId }: TeamViewProps) {
  const [gameId, setGameId] = useState<string | null>(initialGameId || null);
  
  // Game config
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  
  // Team selection
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Game state (FROM MASTER!)
  const [isRunning, setIsRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [teamQuizUnlocked, setTeamQuizUnlocked] = useState(false);
  const [individualQuizUnlocked, setIndividualQuizUnlocked] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  
  // Quiz data
  const [teamQuestions, setTeamQuestions] = useState<QuizQuestion[]>([]);
  const [teamAnswers, setTeamAnswers] = useState<string[]>([]);
  const [teamSubmitted, setTeamSubmitted] = useState(false);
  const [teamScore, setTeamScore] = useState<number | null>(null);
  
  // Station check-in
  const [checkedIn, setCheckedIn] = useState(false);
  
  // Results data (for game ended)
  const [allTeamSubmissions, setAllTeamSubmissions] = useState<Record<string, any>>({});
  const [allIndividualSubmissions, setAllIndividualSubmissions] = useState<any[]>([]);
  
  // Branding
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

  // Join game by code
  const [inputCode, setInputCode] = useState('');
  
  // Track previous time for sound effect
  const prevTimeRef = useRef<number>(0);

  // Initialize audio on mount
  useEffect(() => {
    initAudio();
  }, []);

  // Play sound when timer hits 0
  useEffect(() => {
    if (timeRemaining === 0 && prevTimeRef.current > 0) {
      playTimeUpSound();
    }
    prevTimeRef.current = timeRemaining;
  }, [timeRemaining]);

  // Load final results when game ends
  useEffect(() => {
    if (gameEnded && gameId) {
      loadFinalResults();
    }
  }, [gameEnded, gameId]);

  async function loadFinalResults() {
    // Load team submissions
    const { data: teamSubs } = await supabase
      .from('team_submissions')
      .select('*')
      .eq('game_id', gameId);

    if (teamSubs) {
      const teamSubsMap: Record<string, any> = {};
      teamSubs.forEach((sub: any) => {
        teamSubsMap[sub.team_id] = sub;
      });
      setAllTeamSubmissions(teamSubsMap);
    }

    // Load individual submissions
    const { data: indSubs } = await supabase
      .from('individual_submissions')
      .select('*')
      .eq('game_id', gameId);

    if (indSubs) {
      setAllIndividualSubmissions(indSubs);
    }
  }

  useEffect(() => {
    if (gameId) {
      loadGame();
      subscribeToGameState();
    }
  }, [gameId]);

  useEffect(() => {
    if (gameId && selectedTeam) {
      loadTeamQuiz();
      subscribeToTeamSubmission();
    }
  }, [gameId, selectedTeam]);

  async function handleJoinByCode() {
    if (!inputCode.trim()) return;

    const { data: game } = await supabase
      .from('games')
      .select('id')
      .eq('code', inputCode.toUpperCase())
      .maybeSingle();

    if (game) {
      setGameId(game.id);
    } else {
      alert('Spelcode niet gevonden');
    }
  }

  async function loadGame() {
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (game) {
      const cfg = game.config as GameConfig;
      setConfig(cfg);
      setTeams(cfg.teams);
      setStations(cfg.stations);
      setBranding(game.branding as Branding);

      // Load current game state
      const { data: state } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_id', gameId)
        .maybeSingle();

      if (state) {
        setIsRunning(state.is_running);
        setCurrentRound(state.current_round);
        setTimeRemaining(state.time_remaining);
        setIsPaused(state.is_paused);
        setTeamQuizUnlocked(state.team_quiz_unlocked);
        setIndividualQuizUnlocked(state.individual_quiz_unlocked);
        setGameEnded(state.game_ended);
      }
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
          
          // Check if round changed - reset check-in
          if (state.current_round !== currentRound) {
            setCheckedIn(false);
          }
          
          setIsRunning(state.is_running || false);
          setCurrentRound(state.current_round || 0);
          setTimeRemaining(state.time_remaining || 0);
          setIsPaused(state.is_paused || false);
          setTeamQuizUnlocked(state.team_quiz_unlocked || false);
          setIndividualQuizUnlocked(state.individual_quiz_unlocked || false);
          setGameEnded(state.game_ended || false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function loadTeamQuiz() {
    const { data } = await supabase
      .from('team_quizzes')
      .select('questions')
      .eq('game_id', gameId)
      .maybeSingle();

    if (data?.questions) {
      const qs = data.questions as QuizQuestion[];
      setTeamQuestions(qs);
      setTeamAnswers(new Array(qs.length).fill(''));
    }
  }

  function subscribeToTeamSubmission() {
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
            setTeamSubmitted(submission.submitted);
            setTeamScore(submission.score);
            if (submission.answers) {
              const answersArray = Object.values(submission.answers);
              setTeamAnswers(answersArray as string[]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function handleTeamQuizSubmit() {
    if (!selectedTeam || teamSubmitted) return;

    const answersObject: Record<string, string> = {};
    teamQuestions.forEach((q, i) => {
      answersObject[q.id] = teamAnswers[i] || '';
    });

    await supabase
      .from('team_submissions')
      .update({
        answers: answersObject as never,
        submitted: true
      })
      .eq('game_id', gameId)
      .eq('team_id', selectedTeam.id);
  }

  function handleCheckIn() {
    setCheckedIn(true);
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Calculate current station
  function getCurrentStation(): { station: Station | null; nextStation: Station | null } {
    if (!selectedTeam || !config || stations.length === 0) {
      return { station: null, nextStation: null };
    }

    const route = config.routes[selectedTeam.id] || [];
    
    // Current round index (0-based)
    const currentIndex = currentRound - 1;
    const nextIndex = currentRound;

    const currentStationId = route[currentIndex];
    const nextStationId = route[nextIndex];

    const station = stations.find(s => s.id === currentStationId) || null;
    const nextStation = stations.find(s => s.id === nextStationId) || null;

    return { station, nextStation };
  }

  // JOIN SCREEN
  if (!gameId) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
        color: '#fff',
        padding: '2rem',
        fontFamily: branding.bodyFont,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: '#1f2937',
          borderRadius: '1rem',
          padding: '2rem',
          border: `3px solid ${branding.primaryColor}`
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            fontFamily: branding.headerFont,
            color: branding.primaryColor,
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            Voer Spelcode In
          </h1>

          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="FLD-XXXXX"
            maxLength={20}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              textAlign: 'center',
              fontFamily: 'monospace',
              backgroundColor: '#374151',
              color: '#fff',
              border: '2px solid #4B5563',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              letterSpacing: '0.1em'
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleJoinByCode()}
          />

          <button
            onClick={handleJoinByCode}
            disabled={!inputCode.trim()}
            style={{
              width: '100%',
              padding: '1rem',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              fontFamily: branding.headerFont,
              backgroundColor: inputCode.trim() ? branding.primaryColor : '#4B5563',
              color: inputCode.trim() ? branding.secondaryColor : '#9ca3af',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: inputCode.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Verbinden
          </button>
        </div>
      </div>
    );
  }

  // TEAM SELECTION SCREEN
  if (!selectedTeam) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
        color: '#fff',
        padding: '2rem',
        fontFamily: branding.bodyFont
      }}>
        <div style={{
          maxWidth: '1024px',
          margin: '0 auto'
        }}>
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '1rem',
            padding: '2rem'
          }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              fontFamily: branding.headerFont,
              color: branding.primaryColor,
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Users size={32} />
              Selecteer je team
            </h1>

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
                    border: `3px solid ${team.color}`,
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
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#fff',
                      fontFamily: branding.headerFont
                    }}>
                      {team.name}
                    </h3>
                  </div>
                  <p style={{
                    color: '#d1d5db',
                    fontSize: '0.875rem',
                    marginBottom: '0.25rem'
                  }}>
                    Aanvoerder: {team.captain}
                  </p>
                  <p style={{
                    color: '#9ca3af',
                    fontSize: '0.75rem'
                  }}>
                    {team.members.length} leden
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { station: currentStation, nextStation } = getCurrentStation();
  const individualQuizUrl = `${window.location.origin}/play/individual?game=${gameId}&team=${selectedTeam.id}`;

  // GAME ENDED - SHOW RESULTS
  if (gameEnded && config) {
    return (
      <ResultsView
        branding={branding}
        config={config}
        teamSubmissions={allTeamSubmissions}
        individualSubmissions={allIndividualSubmissions}
      />
    );
  }

  // MAIN GAME VIEW
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      padding: '1rem',
      fontFamily: branding.bodyFont
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
      `}</style>
      
      <div style={{
        maxWidth: '1024px',
        margin: '0 auto'
      }}>
        {/* TEAM HEADER */}
        <div
          style={{
            backgroundColor: selectedTeam.color,
            borderRadius: '1rem 1rem 0 0',
            padding: '1.5rem',
            marginBottom: 0
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
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  fontFamily: branding.headerFont
                }}>
                  {selectedTeam.name}
                </h1>
                <p style={{
                  fontSize: '0.875rem',
                  opacity: 0.9
                }}>
                  Aanvoerder: {selectedTeam.captain}
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Trophy size={20} />
              <span style={{
                fontSize: '1.125rem',
                fontWeight: 'bold'
              }}>
                Score: {teamScore !== null ? teamScore : selectedTeam.score}
              </span>
            </div>
          </div>
        </div>

        {/* GAME STATUS & TIMER */}
        <div style={{
          backgroundColor: '#1f2937',
          padding: '1.5rem',
          borderBottom: `3px solid ${branding.primaryColor}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#fff'
            }}>
              <Clock size={32} style={{ color: branding.primaryColor }} />
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                color: branding.primaryColor
              }}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            
            {isPaused && (
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#fbbf24',
                color: '#000',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1.125rem'
              }}>
                ⏸️ PAUZE
              </div>
            )}

            {!isRunning && !gameEnded && (
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#9ca3af',
                color: '#000',
                borderRadius: '0.5rem',
                fontWeight: 'bold'
              }}>
                Wacht op spelleider...
              </div>
            )}
          </div>
        </div>

        {/* STATION INFO */}
        {isRunning && currentStation && (
          <div style={{
            backgroundColor: '#1f2937',
            padding: '2rem',
            borderBottom: `2px solid #374151`
          }}>
            {/* TIME UP ALERT */}
            {timeRemaining === 0 && (
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#dc2626',
                color: '#fff',
                borderRadius: '0.75rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
                animation: 'pulse 1s infinite',
                border: '3px solid #fff'
              }}>
                <AlertCircle size={48} style={{ margin: '0 auto 0.5rem' }} />
                <p style={{
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  fontFamily: branding.headerFont,
                  textTransform: 'uppercase'
                }}>
                  ⏰ TIJD IS OP! GA NAAR VOLGEND STATION!
                </p>
              </div>
            )}
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <MapPin size={32} style={{ color: branding.primaryColor }} />
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  fontFamily: branding.headerFont,
                  color: branding.primaryColor
                }}>
                  {checkedIn ? 'Huidig Station' : 'Ga naar Station'}
                </h2>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  fontFamily: branding.headerFont
                }}>
                  {checkedIn ? currentStation.name : (nextStation?.name || currentStation.name)}
                </p>
              </div>
            </div>

            {/* ROUTE IMAGE */}
            {!checkedIn && nextStation?.mapUrl && (
              <div style={{
                marginBottom: '1.5rem',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                border: `3px solid ${branding.primaryColor}`
              }}>
                <img
                  src={nextStation.mapUrl}
                  alt="Route naar station"
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    backgroundColor: '#374151'
                  }}
                />
              </div>
            )}

            {/* CHECK-IN BUTTON */}
            {!checkedIn ? (
              <button
                onClick={handleCheckIn}
                style={{
                  width: '100%',
                  padding: '1.5rem',
                  backgroundColor: branding.primaryColor,
                  color: branding.secondaryColor,
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  fontFamily: branding.headerFont,
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}
              >
                <CheckCircle size={32} />
                AANGEKOMEN BIJ STATION
              </button>
            ) : (
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#22c55e',
                color: '#fff',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                fontFamily: branding.headerFont,
                borderRadius: '0.75rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle size={32} />
                Ingecheckt bij {currentStation.name}
              </div>
            )}
          </div>
        )}

        {/* TEAM QUIZ SECTION */}
        <div style={{
          backgroundColor: '#1f2937',
          padding: '2rem',
          borderBottom: `2px solid #374151`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              fontFamily: branding.headerFont,
              color: branding.primaryColor,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              👥 Team Quiz
            </h2>
            {teamQuizUnlocked ? (
              <Unlock size={24} style={{ color: '#22c55e' }} />
            ) : (
              <Lock size={24} style={{ color: '#9ca3af' }} />
            )}
          </div>

          {!teamQuizUnlocked ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: '#374151',
              borderRadius: '0.75rem',
              border: '2px dashed #4B5563'
            }}>
              <Lock size={64} style={{ color: '#9ca3af', margin: '0 auto 1rem' }} />
              <p style={{
                fontSize: '1.25rem',
                color: '#9ca3af',
                fontWeight: 'bold'
              }}>
                Quiz wordt vrijgegeven door spelleider
              </p>
            </div>
          ) : teamSubmitted ? (
            <div style={{
              padding: '2rem',
              backgroundColor: '#22c55e',
              borderRadius: '0.75rem',
              textAlign: 'center'
            }}>
              <CheckCircle size={64} style={{ margin: '0 auto 1rem' }} />
              <p style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem'
              }}>
                Quiz Ingeleverd!
              </p>
              <p style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                fontFamily: branding.headerFont
              }}>
                Score: {teamScore !== null ? `${teamScore} punten` : 'Wordt berekend...'}
              </p>
            </div>
          ) : (
            <div>
              {teamQuestions.map((q, index) => (
                <div
                  key={q.id}
                  style={{
                    backgroundColor: '#374151',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    marginBottom: '1rem'
                  }}
                >
                  <p style={{
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '1rem'
                  }}>
                    {index + 1}. {q.question}
                  </p>

                  {q.type === 'multiple-choice' && q.options ? (
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {q.options.map((option, i) => (
                        <label
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '1rem',
                            backgroundColor: teamAnswers[index] === option ? branding.primaryColor : '#4B5563',
                            color: teamAnswers[index] === option ? branding.secondaryColor : '#fff',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                          }}
                        >
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={option}
                            checked={teamAnswers[index] === option}
                            onChange={(e) => {
                              const newAnswers = [...teamAnswers];
                              newAnswers[index] = e.target.value;
                              setTeamAnswers(newAnswers);
                            }}
                            style={{ width: '1.25rem', height: '1.25rem' }}
                          />
                          <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={teamAnswers[index] || ''}
                      onChange={(e) => {
                        const newAnswers = [...teamAnswers];
                        newAnswers[index] = e.target.value;
                        setTeamAnswers(newAnswers);
                      }}
                      placeholder="Jouw antwoord..."
                      style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1rem',
                        backgroundColor: '#4B5563',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.5rem'
                      }}
                    />
                  )}
                </div>
              ))}

              <button
                onClick={handleTeamQuizSubmit}
                disabled={teamAnswers.some(a => !a)}
                style={{
                  width: '100%',
                  padding: '1.5rem',
                  backgroundColor: teamAnswers.some(a => !a) ? '#4B5563' : branding.primaryColor,
                  color: teamAnswers.some(a => !a) ? '#9ca3af' : branding.secondaryColor,
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  fontFamily: branding.headerFont,
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: teamAnswers.some(a => !a) ? 'not-allowed' : 'pointer'
                }}
              >
                INLEVEREN
              </button>
            </div>
          )}
        </div>

        {/* INDIVIDUAL QUIZ QR CODE */}
        <div style={{
          backgroundColor: '#1f2937',
          padding: '2rem',
          borderRadius: '0 0 1rem 1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              fontFamily: branding.headerFont,
              color: branding.primaryColor,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              👤 Individuele Quiz
            </h2>
            {individualQuizUnlocked ? (
              <Unlock size={24} style={{ color: '#22c55e' }} />
            ) : (
              <Lock size={24} style={{ color: '#9ca3af' }} />
            )}
          </div>

          {!individualQuizUnlocked ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: '#374151',
              borderRadius: '0.75rem',
              border: '2px dashed #4B5563'
            }}>
              <Lock size={64} style={{ color: '#9ca3af', margin: '0 auto 1rem' }} />
              <p style={{
                fontSize: '1.25rem',
                color: '#9ca3af',
                fontWeight: 'bold'
              }}>
                Quiz wordt vrijgegeven door spelleider
              </p>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              backgroundColor: '#374151',
              borderRadius: '0.75rem'
            }}>
              <p style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '1.5rem'
              }}>
                Scan deze QR code met je telefoon
              </p>
              <div style={{
                backgroundColor: '#fff',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                display: 'inline-block'
              }}>
                <QRCodeSVG
                  value={individualQuizUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#9ca3af',
                marginTop: '1rem'
              }}>
                Elk teamlid doet de quiz individueel
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}