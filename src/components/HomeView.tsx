import { Settings, Play, Users } from 'lucide-react';
import type { Branding, GameConfig } from '../types/game';

interface HomeViewProps {
  branding: Branding;
  gameConfig: GameConfig | null;
  savedGamesCount: number;
  onNavigate: (view: string) => void;
  onStartGame: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function HomeView({
  branding,
  gameConfig,
  savedGamesCount,
  onNavigate,
  onStartGame,
  onExport,
  onImport
}: HomeViewProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      color: '#fff',
      padding: '1rem',
      fontFamily: branding.bodyFont
    }}>
      {branding.customFontUrl && (
        <style>{`@font-face { font-family: '${branding.customFontName}'; src: url('${branding.customFontUrl}'); }`}</style>
      )}

      <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1rem 0' }}>
        {branding.logoUrl && (
          <img
            src={branding.logoUrl}
            alt="Logo"
            style={{
              maxHeight: '8rem',
              maxWidth: '90%',
              margin: '0 auto 1rem',
              display: 'block',
              objectFit: 'contain'
            }}
          />
        )}
        <h1 style={{
          fontSize: 'clamp(2rem, 8vw, 4rem)',
          fontWeight: 900,
          marginBottom: '0.5rem',
          fontStyle: 'italic',
          fontFamily: branding.headerFont,
          color: branding.primaryColor,
          letterSpacing: '1px',
          wordBreak: 'break-word',
          padding: '0 1rem'
        }}>
          {branding.companyName}
        </h1>
        <p style={{
          fontSize: 'clamp(1rem, 3vw, 1.5rem)',
          color: branding.primaryColor,
          fontWeight: 600,
          fontFamily: branding.headerFont
        }}>
          Game Master Control
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
        <button
          onClick={() => onNavigate('branding')}
          style={buttonStyle(branding, false)}
        >
          <Settings size={20} /> BRANDING AANPASSEN
        </button>

        <button
          onClick={() => onNavigate('setup')}
          style={buttonStyle(branding, true)}
        >
          <Settings size={24} /> NIEUW SPEL INSTELLEN
        </button>

        {savedGamesCount > 0 && (
          <button
            onClick={() => onNavigate('load')}
            style={{ ...buttonStyle(branding, false), backgroundColor: '#2563eb' }}
          >
            📁 LAAD SPEL ({savedGamesCount})
          </button>
        )}

        {gameConfig && gameConfig.stations.length > 0 && (
          <>
            <button
              onClick={onStartGame}
              style={{ ...buttonStyle(branding, false), backgroundColor: '#22c55e' }}
            >
              <Play size={24} /> START SPEL
            </button>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <button
                onClick={onExport}
                style={{ ...buttonStyle(branding, false), backgroundColor: '#7c3aed', marginBottom: 0, fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}
              >
                💾 EXPORT
              </button>
              <label style={{ ...buttonStyle(branding, false), backgroundColor: '#7c3aed', marginBottom: 0, fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>
                📂 IMPORT
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </>
        )}

        <button
          onClick={() => onNavigate('team')}
          style={buttonStyle(branding, false)}
        >
          <Users size={20} /> TEAM WEERGAVE
        </button>
      </div>
    </div>
  );
}

function buttonStyle(branding: Branding, primary: boolean) {
  return {
    backgroundColor: primary ? branding.primaryColor : '#374151',
    color: primary ? branding.secondaryColor : '#fff',
    padding: 'clamp(0.875rem, 3vw, 1.5rem)',
    fontSize: 'clamp(0.9rem, 2.5vw, 1.25rem)',
    fontWeight: 'bold' as const,
    fontFamily: branding.headerFont,
    borderRadius: '0.75rem',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: '100%',
    transition: 'all 0.3s',
    marginBottom: '1rem',
    minHeight: '3rem'
  };
}
