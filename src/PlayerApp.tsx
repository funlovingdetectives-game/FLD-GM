import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { PlayerJoinView } from './components/PlayerJoinView';
import { TeamView } from './components/TeamView';
import type { Branding, GameConfig } from './types/game';

const defaultBranding: Branding = {
  companyName: 'FUN LOVING DETECTIVES',
  logoUrl: '',
  primaryColor: '#fbbf24',
  secondaryColor: '#000000',
  headerFont: 'system-ui',
  bodyFont: 'system-ui',
  customFontUrl: '',
  customFontName: ''
};

export function PlayerApp() {
  const [searchParams] = useSearchParams();
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [gameCode, setGameCode] = useState<string>(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (gameCode) {
      loadGame(gameCode);
    }
  }, [gameCode]);

  async function loadGame(code: string) {
    setLoading(true);
    setError('');

    const { data, error: loadError } = await supabase
      .from('games')
      .select('id, name, code, config, branding')
      .eq('code', code)
      .maybeSingle();

    if (loadError) {
      console.error('Load error:', loadError);
      setError('Fout bij ophalen van spel. Probeer opnieuw.');
      setLoading(false);
      return;
    }

    if (!data) {
      setError('Spelcode niet gevonden. Controleer de code en probeer opnieuw.');
      setLoading(false);
      return;
    }

    setBranding(data.branding || defaultBranding);
    setGameConfig(data.config);
    setLoading(false);
  }

  function handleJoinGame(code: string) {
    setGameCode(code);
  }

  // Show join screen if no game code
  if (!gameCode || error) {
    return (
      <div>
        <PlayerJoinView branding={branding} onJoinGame={handleJoinGame} />
        {error && (
          <div style={{
            position: 'fixed',
            top: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ef4444',
            color: '#fff',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            zIndex: 1000
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // Show loading
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: branding.bodyFont
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>⏳</div>
          <p style={{ fontSize: '1.25rem', color: '#9ca3af' }}>Laden...</p>
        </div>
      </div>
    );
  }

  // Show game (TeamView for now - this is what players see)
  if (gameConfig) {
    return (
      <TeamView
        branding={branding}
        config={gameConfig}
        onBack={() => setGameCode('')}
      />
    );
  }

  return null;
}