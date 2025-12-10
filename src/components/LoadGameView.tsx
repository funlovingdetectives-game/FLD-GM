import { ArrowLeft, Search } from 'lucide-react';
import type { Branding } from '../types/game';

interface SavedGame {
  id: string;
  name: string;
  code: string;
  config: any;
  created_at: string;
}

interface LoadGameViewProps {
  branding: Branding;
  games: SavedGame[];
  onLoadGame: (gameId: string) => void;
  onBack: () => void;
}

export function LoadGameView({ branding, games, onLoadGame, onBack }: LoadGameViewProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      padding: 'clamp(1rem, 3vw, 2rem)',
      fontFamily: branding.bodyFont
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#374151',
              color: branding.primaryColor,
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              fontFamily: branding.headerFont
            }}
          >
            <ArrowLeft size={20} /> Terug
          </button>

          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 900,
            fontFamily: branding.headerFont,
            color: branding.primaryColor,
            flex: 1
          }}>
            Laad Spel
          </h1>
        </div>

        {games.length === 0 ? (
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            <Search size={64} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ fontSize: '1.25rem' }}>Geen opgeslagen spellen gevonden</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {games.map((game) => {
              const teams = game.config?.teams?.length || 0;
              const stations = game.config?.stations?.length || 0;
              const date = new Date(game.created_at).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });

              return (
                <button
                  key={game.id}
                  onClick={() => onLoadGame(game.id)}
                  style={{
                    backgroundColor: '#1f2937',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    border: `2px solid ${branding.primaryColor}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto auto',
                    gap: '1.5rem',
                    alignItems: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#374151';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#1f2937';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#fff',
                      fontFamily: branding.headerFont,
                      marginBottom: '0.25rem'
                    }}>
                      {game.name}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#9ca3af',
                      fontFamily: 'monospace'
                    }}>
                      Code: <span style={{ color: branding.primaryColor, fontWeight: 'bold' }}>{game.code}</span>
                    </p>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: branding.primaryColor
                    }}>{teams}</div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af'
                    }}>Teams</div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      color: branding.primaryColor
                    }}>{stations}</div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af'
                    }}>Stations</div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#9ca3af'
                    }}>{date}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}