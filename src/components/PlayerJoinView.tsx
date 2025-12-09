import { useState } from 'react';
import type { Branding } from '../types/game';

interface PlayerJoinViewProps {
  branding: Branding;
  onJoinGame: (gameCode: string) => void;
}

export function PlayerJoinView({ branding, onJoinGame }: PlayerJoinViewProps) {
  const [gameCode, setGameCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameCode.trim()) {
      onJoinGame(gameCode.toUpperCase());
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      color: '#fff',
      padding: 'clamp(1rem, 3vw, 2rem)',
      fontFamily: branding.bodyFont,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {branding.customFontUrl && (
        <style>{`@font-face { font-family: '${branding.customFontName}'; src: url('${branding.customFontUrl}'); }`}</style>
      )}

      <div style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        {branding.logoUrl && (
          <img
            src={branding.logoUrl}
            alt={branding.companyName}
            style={{
              maxHeight: 'clamp(4rem, 12vw, 8rem)',
              maxWidth: '90%',
              margin: '0 auto 2rem',
              display: 'block',
              objectFit: 'contain'
            }}
          />
        )}

        <h1 style={{
          fontSize: 'clamp(2rem, 8vw, 4rem)',
          fontWeight: 900,
          fontFamily: branding.headerFont,
          color: branding.primaryColor,
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {branding.companyName}
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 3vw, 1.5rem)',
          color: '#d1d5db',
          marginBottom: '3rem'
        }}>
          Welkom! Voer de spelcode in om te beginnen
        </p>

        <form onSubmit={handleSubmit} style={{
          backgroundColor: '#1f2937',
          borderRadius: '1rem',
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
          border: `3px solid ${branding.primaryColor}`
        }}>
          <label style={{
            display: 'block',
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            fontWeight: 'bold',
            fontFamily: branding.headerFont,
            color: branding.primaryColor,
            marginBottom: '1rem',
            textAlign: 'left'
          }}>
            Spelcode
          </label>

          <input
            type="text"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            placeholder="FLD-XXX"
            maxLength={20}
            style={{
              width: '100%',
              backgroundColor: '#374151',
              color: '#fff',
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              borderRadius: '0.75rem',
              border: '2px solid #4B5563',
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 'bold',
              textAlign: 'center',
              letterSpacing: '0.1em',
              marginBottom: '1.5rem',
              fontFamily: 'monospace'
            }}
            autoFocus
          />

          <button
            type="submit"
            disabled={!gameCode.trim()}
            style={{
              backgroundColor: gameCode.trim() ? branding.primaryColor : '#4B5563',
              color: gameCode.trim() ? branding.secondaryColor : '#9ca3af',
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              fontWeight: 'bold',
              fontFamily: branding.headerFont,
              borderRadius: '0.75rem',
              border: 'none',
              cursor: gameCode.trim() ? 'pointer' : 'not-allowed',
              width: '100%',
              transition: 'all 0.3s',
              textTransform: 'uppercase'
            }}
          >
            Start Spel
          </button>
        </form>

        <p style={{
          marginTop: '2rem',
          fontSize: 'clamp(0.875rem, 2vw, 1rem)',
          color: '#9ca3af'
        }}>
          Vraag de spelleider om de code als je deze niet hebt
        </p>
      </div>
    </div>
  );
}