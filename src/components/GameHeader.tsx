import type { Branding } from '../types/game';

interface GameHeaderProps {
  gameName: string;
  gameCode: string;
  branding: Branding;
}

export function GameHeader({ gameName, gameCode, branding }: GameHeaderProps) {
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: '#1f2937',
      borderBottom: `3px solid ${branding.primaryColor}`,
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      <div>
        <div style={{
          fontSize: '0.875rem',
          color: '#9ca3af',
          marginBottom: '0.25rem'
        }}>
          Je bewerkt:
        </div>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          fontFamily: branding.headerFont,
          color: '#fff'
        }}>
          {gameName} <span style={{ 
            color: branding.primaryColor,
            fontFamily: 'monospace'
          }}>({gameCode})</span>
        </div>
      </div>
    </div>
  );
}
