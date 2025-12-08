import { Bell, Clock, Play, Pause } from 'lucide-react';
import { useTimer } from '../hooks/useTimer';
import type { Branding, GameConfig, GameState, QuizQuestion, TeamSubmission, IndividualSubmission } from '../types/game';

interface ControlViewProps {
  branding: Branding;
  config: GameConfig;
  gameState: GameState;
  teamQuiz: QuizQuestion[];
  individualQuiz: QuizQuestion[];
  teamSubmissions: Record<string, TeamSubmission>;
  individualSubmissions: IndividualSubmission[];
  gameId: string;
  onBack: () => void;
  onUpdateState: (updates: Partial<GameState>) => void;
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
  useTimer(gameState.isRunning, gameState.timeRemaining, (newTime) => {
    onUpdateState({ timeRemaining: newTime });
  });

  const pauseIdx = config.pauseAfterRound || Math.floor(config.stations.length / 2);
  const isPause = gameState.currentRound === pauseIdx;
  const totalRounds = config.stations.length + 1;
  const min = Math.floor(gameState.timeRemaining / 60);
  const sec = gameState.timeRemaining % 60;

  const nextRound = () => {
    const next = gameState.currentRound + 1;
    const willBePause = next === pauseIdx;
    onUpdateState({
      currentRound: next,
      timeRemaining: (willBePause ? config.pauseDuration : config.stationDuration) * 60,
      isPaused: willBePause
    });
  };

  const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
  const playerUrl = `${baseUrl}/?view=team&game=${gameId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(playerUrl)}`;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      color: '#fff',
      padding: '1rem',
      fontFamily: branding.bodyFont
    }}>
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

      <div style={card()}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, fontFamily: branding.headerFont, marginBottom: '0.5rem' }}>
          {config.gameName}
        </h2>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <div>
            <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>Game ID: </span>
            <span style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', fontFamily: 'monospace', color: branding.primaryColor, fontWeight: 'bold' }}>
              {gameId}
            </span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(gameId);
              alert('Game ID gekopieerd!');
            }}
            style={{
              backgroundColor: branding.primaryColor,
              color: branding.secondaryColor,
              padding: '0.5rem 1rem',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
              fontWeight: 'bold',
              fontFamily: branding.headerFont,
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Kopieer ID
          </button>
        </div>
        <div style={{
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          marginTop: '1rem',
          border: '2px solid rgba(34, 197, 94, 0.3)'
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>Spelers Link: </span>
            <span style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#22c55e', wordBreak: 'break-all' }}>
              {playerUrl}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(playerUrl);
                alert('Link gekopieerd!');
              }}
              style={{
                backgroundColor: '#22c55e',
                color: '#000',
                padding: '0.5rem 1rem',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                fontWeight: 'bold',
                fontFamily: branding.headerFont,
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                flex: '1 1 auto'
              }}
            >
              Kopieer Link
            </button>
            <button
              onClick={() => {
                const win = window.open('', '_blank');
                if (win) {
                  win.document.write(`
                    <html>
                      <head><title>QR Code - Spelers Toegang</title></head>
                      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:system-ui;background:#000;color:#fff;">
                        <h1 style="margin-bottom:1rem;">Scan om mee te spelen</h1>
                        <img src="${qrUrl}" alt="QR Code" style="max-width:90vw;max-height:80vh;" />
                        <p style="margin-top:1rem;color:#999;">Of ga naar: ${playerUrl}</p>
                      </body>
                    </html>
                  `);
                }
              }}
              style={{
                backgroundColor: branding.primaryColor,
                color: branding.secondaryColor,
                padding: '0.5rem 1rem',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                fontWeight: 'bold',
                fontFamily: branding.headerFont,
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                flex: '1 1 auto'
              }}
            >
              Toon QR Code
            </button>
          </div>
        </div>
        <div style={{ fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', marginTop: '1rem' }}>
          Ronde {gameState.currentRound + 1} / {totalRounds}
          {isPause && <span style={{ marginLeft: '0.5rem', color: '#fbbf24' }}>☕ PAUZE</span>}
        </div>
      </div>

      <div style={{ ...card(), textAlign: 'center' }}>
        <div style={{
          fontSize: 'clamp(3rem, 12vw, 5rem)',
          fontWeight: 900,
          fontFamily: branding.headerFont,
          color: branding.primaryColor
        }}>
          {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
        </div>

        {!gameState.isRunning && gameState.currentRound === 0 && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            borderRadius: '0.5rem',
            border: '2px solid #fbbf24'
          }}>
            <p style={{
              color: '#fbbf24',
              fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              Timer staat nog op pauze. Deel eerst de Game ID met je teams!
            </p>
            <button
              onClick={() => onUpdateState({ isRunning: true })}
              style={{
                ...btn(branding, false),
                backgroundColor: '#22c55e',
                fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                padding: '1rem 2rem',
                marginBottom: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Play size={24} /> START TIMER
            </button>
          </div>
        )}

        {gameState.isRunning && (
          <button
            onClick={() => onUpdateState({ isRunning: false })}
            style={{
              ...btn(branding, false),
              backgroundColor: '#ef4444',
              marginTop: '1rem',
              marginBottom: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Pause size={20} /> PAUZEER
          </button>
        )}

        {!gameState.isRunning && gameState.currentRound > 0 && (
          <button
            onClick={() => onUpdateState({ isRunning: true })}
            style={{
              ...btn(branding, false),
              backgroundColor: '#22c55e',
              marginTop: '1rem',
              marginBottom: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Play size={20} /> HERVAT
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: gameState.currentRound >= totalRounds - 1 ? '1fr' : '1fr 1fr',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        {gameState.currentRound < totalRounds - 1 && (
          <button
            onClick={nextRound}
            style={{
              ...btn(branding, false),
              backgroundColor: '#22c55e',
              marginBottom: 0
            }}
          >
            <Bell size={20} /> VOLGENDE
          </button>
        )}
        <button
          onClick={() => onUpdateState({ timeRemaining: gameState.timeRemaining + 300 })}
          style={{ ...btn(branding, true), marginBottom: 0 }}
        >
          <Clock size={20} /> +5 MIN
        </button>
      </div>

      <div style={card()}>
        <h3 style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.5rem)', fontWeight: 'bold', fontFamily: branding.headerFont, marginBottom: '1rem' }}>
          🎯 Quiz Controle
        </h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <QuizControl
            title="Team Quiz"
            subtitle={`Captain (${teamQuiz.length} vragen)`}
            unlocked={gameState.teamQuizUnlocked}
            onToggle={() => onUpdateState({ teamQuizUnlocked: !gameState.teamQuizUnlocked })}
            branding={branding}
          >
            {gameState.teamQuizUnlocked && (
              <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', marginTop: '0.5rem' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Inzendingen:</div>
                {config.teams.map(team => {
                  const sub = teamSubmissions[team.id];
                  return (
                    <div
                      key={team.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '0.25rem'
                      }}
                    >
                      <span>{team.name}</span>
                      <span style={{ color: sub?.submitted ? '#22c55e' : '#9ca3af' }}>
                        {sub?.submitted ? `✅ ${sub.score}pt` : '⏳ Bezig'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </QuizControl>

          <QuizControl
            title="Persoonlijk"
            subtitle={`Via QR (${individualQuiz.length} vragen)`}
            unlocked={gameState.personalQuizUnlocked}
            onToggle={() => onUpdateState({ personalQuizUnlocked: !gameState.personalQuizUnlocked })}
            branding={branding}
          >
            {gameState.personalQuizUnlocked && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{
                  backgroundColor: '#fff',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <img src={qrUrl} alt="QR" style={{ width: '100%', maxWidth: '200px', display: 'block', margin: '0 auto' }} />
                </div>
                <div style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)', color: '#9ca3af', textAlign: 'center' }}>
                  Scan om quiz te starten
                </div>
                <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', marginTop: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Inzendingen: {individualSubmissions.length}
                  </div>
                </div>
              </div>
            )}
          </QuizControl>
        </div>
      </div>

      <div style={card()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.5rem)', fontWeight: 'bold', fontFamily: branding.headerFont }}>📊 Scoreboard</h3>
          <button
            onClick={() => onUpdateState({ scoresRevealed: !gameState.scoresRevealed })}
            style={{
              padding: 'clamp(0.75rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              fontFamily: branding.headerFont,
              fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
              background: 'linear-gradient(to right, #fbbf24, #f97316)',
              color: '#000',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {gameState.scoresRevealed ? '✅ SCORES GETOOND' : '🏆 ONTHUL SCORES'}
          </button>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <h4 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', fontWeight: 'bold', fontFamily: branding.headerFont, marginBottom: '0.5rem', color: branding.primaryColor }}>
              Team Scores
            </h4>
            {[...config.teams]
              .map(t => ({
                ...t,
                total: t.score + (teamSubmissions[t.id]?.score || 0)
              }))
              .sort((a, b) => b.total - a.total)
              .map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    backgroundColor: '#374151',
                    borderRadius: '0.5rem',
                    padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: 900 }}>
                      {i + 1}.
                    </span>
                    <div
                      style={{
                        width: 'clamp(0.75rem, 2.5vw, 1rem)',
                        height: 'clamp(0.75rem, 2.5vw, 1rem)',
                        borderRadius: '50%',
                        backgroundColor: t.color
                      }}
                    />
                    <span style={{ fontWeight: 'bold', fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>
                      {t.name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                    fontWeight: 900,
                    color: branding.primaryColor
                  }}>
                    {t.total}pt
                  </span>
                </div>
              ))}
          </div>

          <div>
            <h4 style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              color: branding.primaryColor
            }}>
              Top 10 Individueel ({individualSubmissions.length})
            </h4>
            <div style={{ maxHeight: '20rem', overflowY: 'auto' }}>
              {individualSubmissions.slice(0, 10).map((sub, i) => {
                const team = config.teams.find(tm => tm.id === sub.teamId);
                return (
                  <div
                    key={i}
                    style={{
                      backgroundColor: '#374151',
                      borderRadius: '0.5rem',
                      padding: 'clamp(0.4rem, 1.5vw, 0.5rem)',
                      marginBottom: '0.4rem',
                      fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 900 }}>{i + 1}.</span>
                      {team && (
                        <div
                          style={{
                            width: 'clamp(0.6rem, 2vw, 0.75rem)',
                            height: 'clamp(0.6rem, 2vw, 0.75rem)',
                            borderRadius: '50%',
                            backgroundColor: team.color
                          }}
                        />
                      )}
                      <span>{sub.playerName}</span>
                    </div>
                    <span style={{ fontWeight: 900, color: branding.primaryColor }}>
                      {sub.score}pt
                    </span>
                  </div>
                );
              })}
              {individualSubmissions.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#9ca3af',
                  fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
                }}>
                  Nog geen scores
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizControl({
  title,
  subtitle,
  unlocked,
  onToggle,
  branding,
  children
}: {
  title: string;
  subtitle: string;
  unlocked: boolean;
  onToggle: () => void;
  branding: Branding;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: '#374151', borderRadius: '0.75rem', padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.5rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div>
          <h4 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', fontWeight: 'bold', fontFamily: branding.headerFont }}>{title}</h4>
          <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>{subtitle}</p>
        </div>
        <button
          onClick={onToggle}
          style={{
            ...btn(branding, false),
            width: 'auto',
            marginBottom: 0,
            backgroundColor: unlocked ? '#22c55e' : '#ef4444',
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)'
          }}
        >
          {unlocked ? '✅ UNLOCKED' : '🔒 LOCKED'}
        </button>
      </div>
      {children}
    </div>
  );
}

function card() {
  return {
    backgroundColor: '#1f2937',
    borderRadius: 'clamp(0.75rem, 2vw, 1rem)',
    padding: 'clamp(1rem, 3vw, 1.5rem)',
    marginBottom: '1rem'
  };
}

function btn(branding: Branding, primary: boolean) {
  return {
    backgroundColor: primary ? branding.primaryColor : '#374151',
    color: primary ? branding.secondaryColor : '#fff',
    padding: 'clamp(0.75rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
    fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
    fontWeight: 'bold' as const,
    fontFamily: branding.headerFont,
    borderRadius: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: '100%',
    transition: 'all 0.3s',
    marginBottom: '1rem'
  };
}
