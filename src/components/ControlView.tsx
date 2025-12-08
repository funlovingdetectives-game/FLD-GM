import { useState, useEffect } from 'react';
import { Bell, Clock, Play, Map } from 'lucide-react';
import type { Branding, GameConfig, GameState } from '../types/game';

interface ControlViewProps {
  branding: Branding;
  config: GameConfig;
  gameState: GameState;
  teamQuiz: any[];
  individualQuiz: any[];
  teamSubmissions: Record<string, any> | any[];
  individualSubmissions: any[];
  gameId: string;
  onBack: () => void;
  onUpdateState: (updates: Partial<GameState>) => Promise<void>;
}

export function ControlView({ 
  branding, 
  config, 
  gameState, 
  teamQuiz,
  individualQuiz,
  teamSubmissions,
  individualSubmissions,
  gameId,
  onBack, 
  onUpdateState 
}: ControlViewProps) {
  // Safety checks
  if (!config || !config.stations || !config.teams) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
        color: '#fff',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: branding.primaryColor }}>
            Game configuratie ontbreekt
          </h2>
          <p style={{ marginBottom: '2rem', color: '#9ca3af' }}>
            Configureer eerst je spel in Setup.
          </p>
          <button
            onClick={onBack}
            style={{
              backgroundColor: branding.primaryColor,
              color: branding.secondaryColor,
              padding: '1rem 2rem',
              fontSize: '1.125rem',
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

  const [timeRemaining, setTimeRemaining] = useState(gameState?.timeRemaining || config.stationDuration * 60);
  const [isRunning, setIsRunning] = useState(false);

  const pauseIndex = config.pauseAfterRound || Math.floor(config.stations.length / 2);
  const isPause = gameState.currentRound === pauseIndex;
  const totalRounds = config.stations.length + (config.pauseAfterRound > 0 ? 1 : 0);

  // Timer effect
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          onUpdateState({ timeRemaining: newTime });
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isRunning, timeRemaining]);

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    const duration = isPause ? config.pauseDuration : config.stationDuration;
    setTimeRemaining(duration * 60);
    onUpdateState({ timeRemaining: duration * 60 });
  };

  const addTime = (minutes: number) => {
    const newTime = timeRemaining + (minutes * 60);
    setTimeRemaining(newTime);
    onUpdateState({ timeRemaining: newTime });
  };

  const nextRound = () => {
    if (gameState.currentRound >= totalRounds - 1) {
      alert('Laatste ronde bereikt!');
      return;
    }

    const nextRoundNum = gameState.currentRound + 1;
    const willBePause = nextRoundNum === pauseIndex;
    const duration = willBePause ? config.pauseDuration : config.stationDuration;
    
    setTimeRemaining(duration * 60);
    setIsRunning(false);
    
    onUpdateState({
      currentRound: nextRoundNum,
      timeRemaining: duration * 60,
      isPaused: willBePause
    });
  };

  const toggleTeamQuiz = () => {
    onUpdateState({
      teamQuizUnlocked: !gameState.teamQuizUnlocked
    });
  };

  const toggleIndividualQuiz = () => {
    onUpdateState({
      individualQuizUnlocked: !gameState.individualQuizUnlocked
    });
  };

  const toggleScoresRevealed = () => {
    onUpdateState({
      scoresRevealed: !gameState.scoresRevealed
    });
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const qrCodeUrl = (type: 'individual') => {
    const baseUrl = window.location.origin;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${baseUrl}/${type}-quiz/${gameId}`)}`;
  };

  // Calculate team scores
  const getTeamScore = (teamId: string) => {
    const team = config.teams.find(t => t.id === teamId);
    // Handle both array and object formats for teamSubmissions
    let submission;
    if (Array.isArray(teamSubmissions)) {
      submission = teamSubmissions.find((s: any) => s.team_id === teamId);
    } else if (teamSubmissions && typeof teamSubmissions === 'object') {
      submission = (teamSubmissions as any)[teamId];
    }
    const quizScore = submission?.score || 0;
    return (team?.score || 0) + quizScore;
  };

  // Get sorted team leaderboard
  const teamLeaderboard = [...config.teams]
    .map(team => {
      // Handle both array and object formats
      let quizSubmitted = false;
      if (Array.isArray(teamSubmissions)) {
        quizSubmitted = teamSubmissions.some((s: any) => s.team_id === team.id && s.submitted);
      } else if (teamSubmissions && typeof teamSubmissions === 'object') {
        const sub = (teamSubmissions as any)[team.id];
        quizSubmitted = sub?.submitted || false;
      }
      
      return {
        ...team,
        totalScore: getTeamScore(team.id),
        quizSubmitted
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  // Get sorted individual leaderboard
  const individualLeaderboard = Array.isArray(individualSubmissions) 
    ? [...individualSubmissions].sort((a: any, b: any) => b.score - a.score).slice(0, 10)
    : [];

  // Get contrast text color
  const getTextColor = (bgColor: string) => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? '#000000' : '#FFFFFF';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      color: '#fff',
      padding: 'clamp(1rem, 3vw, 2rem)',
      fontFamily: branding.bodyFont
    }}>
      {branding.customFontUrl && (
        <style>{`@font-face { font-family: '${branding.customFontName}'; src: url('${branding.customFontUrl}'); }`}</style>
      )}

      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: branding.primaryColor,
          fontSize: 'clamp(1rem, 3vw, 1.25rem)',
          fontFamily: branding.headerFont,
          cursor: 'pointer',
          marginBottom: '1rem',
          padding: '0.5rem'
        }}
      >
        ← Home
      </button>

      {/* Game Info Header */}
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '0.75rem',
        padding: 'clamp(1rem, 3vw, 1.5rem)',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          fontWeight: 900,
          fontFamily: branding.headerFont,
          marginBottom: '0.5rem'
        }}>
          {config.gameName}
        </h2>
        <div style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: '#9ca3af' }}>
          Ronde {gameState.currentRound + 1} / {totalRounds}
          {isPause && <span style={{ marginLeft: '1rem', color: '#fbbf24', fontWeight: 'bold' }}>☕ PAUZE</span>}
        </div>
      </div>

      {/* Timer Section */}
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '0.75rem',
        padding: 'clamp(1.5rem, 4vw, 2rem)',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: 'clamp(4rem, 12vw, 6rem)',
          fontWeight: 900,
          color: timeRemaining < 60 ? '#ef4444' : branding.primaryColor,
          marginBottom: '1rem',
          fontFamily: 'monospace',
          lineHeight: 1
        }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          {!isRunning ? (
            <button
              onClick={startTimer}
              style={{
                backgroundColor: '#22c55e',
                color: '#fff',
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                fontWeight: 'bold',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Play size={20} /> START
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              style={{
                backgroundColor: '#f59e0b',
                color: '#000',
                padding: 'clamp(0.75rem, 2vw, 1rem)',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                fontWeight: 'bold',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              ⏸ PAUZE
            </button>
          )}

          <button
            onClick={resetTimer}
            style={{
              backgroundColor: '#6366f1',
              color: '#fff',
              padding: 'clamp(0.75rem, 2vw, 1rem)',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              fontWeight: 'bold',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            🔄 RESET
          </button>

          <button
            onClick={() => addTime(5)}
            style={{
              backgroundColor: '#8b5cf6',
              color: '#fff',
              padding: 'clamp(0.75rem, 2vw, 1rem)',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              fontWeight: 'bold',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Clock size={20} /> +5 MIN
          </button>
        </div>

        <button
          onClick={nextRound}
          disabled={gameState.currentRound >= totalRounds - 1}
          style={{
            backgroundColor: gameState.currentRound >= totalRounds - 1 ? '#4B5563' : branding.primaryColor,
            color: gameState.currentRound >= totalRounds - 1 ? '#9ca3af' : branding.secondaryColor,
            padding: 'clamp(1rem, 3vw, 1.5rem)',
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            fontWeight: 'bold',
            fontFamily: branding.headerFont,
            borderRadius: '0.5rem',
            border: 'none',
            cursor: gameState.currentRound >= totalRounds - 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            width: '100%',
            opacity: gameState.currentRound >= totalRounds - 1 ? 0.5 : 1
          }}
        >
          <Bell size={24} /> VOLGENDE RONDE
        </button>
      </div>

      {/* Quiz Controls */}
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '0.75rem',
        padding: 'clamp(1rem, 3vw, 1.5rem)',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
          fontWeight: 'bold',
          fontFamily: branding.headerFont,
          marginBottom: '1rem',
          color: branding.primaryColor
        }}>
          🎯 Quiz Controle
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {/* Team Quiz */}
          <div style={{
            backgroundColor: '#374151',
            borderRadius: '0.75rem',
            padding: 'clamp(1rem, 3vw, 1.5rem)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  👥 Team Quiz
                </h4>
                <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>
                  Captain ({teamQuiz?.length || 0} vragen)
                </p>
              </div>
              <button
                onClick={toggleTeamQuiz}
                style={{
                  backgroundColor: gameState.teamQuizUnlocked ? '#22c55e' : '#ef4444',
                  color: '#fff',
                  padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  fontWeight: 'bold',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {gameState.teamQuizUnlocked ? '✅ UNLOCKED' : '🔒 LOCKED'}
              </button>
            </div>

            {gameState.teamQuizUnlocked && (
              <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: branding.primaryColor }}>
                  Inzendingen:
                </div>
                {config.teams.map(team => {
                  // Handle both array and object formats
                  let submission;
                  if (Array.isArray(teamSubmissions)) {
                    submission = teamSubmissions.find((s: any) => s.team_id === team.id);
                  } else if (teamSubmissions && typeof teamSubmissions === 'object') {
                    submission = (teamSubmissions as any)[team.id];
                  }
                  
                  return (
                    <div key={team.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.25rem 0',
                      borderBottom: '1px solid #4B5563'
                    }}>
                      <span>{team.name}</span>
                      <span style={{ color: submission?.submitted ? '#22c55e' : '#9ca3af' }}>
                        {submission?.submitted ? `✅ ${submission.score}pt` : '⏳ Bezig'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Individual Quiz */}
          <div style={{
            backgroundColor: '#374151',
            borderRadius: '0.75rem',
            padding: 'clamp(1rem, 3vw, 1.5rem)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  👤 Persoonlijk
                </h4>
                <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>
                  Via QR ({individualQuiz?.length || 0} vragen)
                </p>
              </div>
              <button
                onClick={toggleIndividualQuiz}
                style={{
                  backgroundColor: gameState.individualQuizUnlocked ? '#22c55e' : '#ef4444',
                  color: '#fff',
                  padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  fontWeight: 'bold',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {gameState.individualQuizUnlocked ? '✅ UNLOCKED' : '🔒 LOCKED'}
              </button>
            </div>

            {gameState.individualQuizUnlocked && (
              <div>
                <div style={{
                  backgroundColor: '#fff',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <img src={qrCodeUrl('individual')} alt="QR Code" style={{ width: '100%', display: 'block' }} />
                </div>
                <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af', textAlign: 'center', marginBottom: '0.5rem' }}>
                  Scan om quiz te starten
                </div>
                <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', fontWeight: 'bold', color: branding.primaryColor }}>
                  Inzendingen: {individualSubmissions?.length || 0}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scoreboards */}
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '0.75rem',
        padding: 'clamp(1rem, 3vw, 1.5rem)',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h3 style={{
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
            fontWeight: 'bold',
            fontFamily: branding.headerFont,
            color: branding.primaryColor
          }}>
            📊 Scoreboard
          </h3>
          <button
            onClick={toggleScoresRevealed}
            style={{
              background: gameState.scoresRevealed 
                ? 'linear-gradient(to right, #22c55e, #10b981)' 
                : 'linear-gradient(to right, #fbbf24, #f97316)',
              color: '#000',
              padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
              fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
              fontWeight: 'bold',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {gameState.scoresRevealed ? '✅ SCORES GETOOND' : '🏆 ONTHUL SCORES'}
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Team Leaderboard */}
          <div>
            <h4 style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
              fontWeight: 'bold',
              marginBottom: '0.75rem',
              color: branding.primaryColor
            }}>
              🏅 Team Scores
            </h4>
            {teamLeaderboard.map((team, index) => (
              <div
                key={team.id}
                style={{
                  backgroundColor: '#374151',
                  borderRadius: '0.5rem',
                  padding: 'clamp(0.75rem, 2vw, 1rem)',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                    fontWeight: 900,
                    minWidth: '2rem'
                  }}>
                    {index + 1}.
                  </span>
                  <div
                    style={{
                      width: 'clamp(1rem, 2.5vw, 1.5rem)',
                      height: 'clamp(1rem, 2.5vw, 1.5rem)',
                      borderRadius: '50%',
                      backgroundColor: team.color
                    }}
                  />
                  <span style={{ fontWeight: 'bold', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                    {team.name}
                  </span>
                </div>
                <span style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                  fontWeight: 900,
                  color: branding.primaryColor
                }}>
                  {team.totalScore}pt
                </span>
              </div>
            ))}
          </div>

          {/* Individual Leaderboard */}
          <div>
            <h4 style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
              fontWeight: 'bold',
              marginBottom: '0.75rem',
              color: branding.primaryColor
            }}>
              🌟 Top 10 Individueel ({individualSubmissions?.length || 0})
            </h4>
            <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
              {individualLeaderboard.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#9ca3af',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                }}>
                  Nog geen scores
                </div>
              ) : (
                individualLeaderboard.map((submission: any, index) => {
                  const team = config.teams.find(t => t.id === submission.team_id);
                  return (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#374151',
                        borderRadius: '0.5rem',
                        padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 900, minWidth: '1.5rem' }}>{index + 1}.</span>
                        {team && (
                          <div
                            style={{
                              width: '0.75rem',
                              height: '0.75rem',
                              borderRadius: '50%',
                              backgroundColor: team.color
                            }}
                          />
                        )}
                        <span>{submission.player_name || 'Onbekend'}</span>
                      </div>
                      <span style={{ fontWeight: 900, color: branding.primaryColor }}>
                        {submission.score}pt
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Team Positions */}
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '0.75rem',
        padding: 'clamp(1rem, 3vw, 1.5rem)'
      }}>
        <h3 style={{
          fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
          fontWeight: 'bold',
          fontFamily: branding.headerFont,
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Map size={24} style={{ color: branding.primaryColor }} />
          <span style={{ color: branding.primaryColor }}>Team Posities</span>
        </h3>

        {isPause ? (
          <div style={{
            textAlign: 'center',
            padding: 'clamp(2rem, 5vw, 3rem)',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            borderRadius: '0.75rem',
            border: '2px dashed #fbbf24'
          }}>
            <div style={{ fontSize: 'clamp(3rem, 8vw, 4rem)', marginBottom: '1rem' }}>☕</div>
            <div style={{
              fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
              fontWeight: 'bold',
              color: '#fbbf24',
              marginBottom: '0.5rem'
            }}>
              ALLE TEAMS IN PAUZE
            </div>
            <div style={{ color: '#9ca3af', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
              Quiz beschikbaar
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: '1rem'
          }}>
            {config.teams.map(team => {
              const adjustedRound = gameState.currentRound > pauseIndex ? gameState.currentRound - 1 : gameState.currentRound;
              const stationId = config.routes?.[team.id]?.[adjustedRound];
              const station = config.stations.find(s => s.id === stationId);
              const textColor = getTextColor(team.color);

              return (
                <div
                  key={team.id}
                  style={{
                    backgroundColor: team.color,
                    color: textColor,
                    borderRadius: '0.75rem',
                    padding: 'clamp(0.75rem, 2vw, 1rem)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                    marginBottom: '0.5rem',
                    wordBreak: 'break-word'
                  }}>
                    {team.name}
                  </div>
                  <div style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                    fontWeight: 900,
                    fontFamily: 'monospace'
                  }}>
                    {stationId || '?'}
                  </div>
                  {station && (
                    <div style={{
                      fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                      marginTop: '0.25rem',
                      opacity: 0.8
                    }}>
                      {station.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}