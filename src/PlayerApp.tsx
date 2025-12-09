import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { PlayerJoinView } from './components/PlayerJoinView';
import { TeamView } from './components/TeamView';
import type { Branding } from './types/game';

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

export function PlayerApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gameCode, setGameCode] = useState(searchParams.get('code') || '');
  const [gameId, setGameId] = useState<string | null>(null);
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('🔍 PlayerApp render:', { gameCode, gameId, loading, error });

  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    console.log('🔍 URL code:', codeFromUrl);
    if (codeFromUrl && codeFromUrl !== gameCode) {
      setGameCode(codeFromUrl);
      loadGameByCode(codeFromUrl);
    }
  }, [searchParams]);

  async function loadGameByCode(code: string) {
    if (!code) return;

    console.log('🔍 Loading game:', code);
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('games')
        .select('id, name, code, config, branding')
        .eq('code', code)
        .maybeSingle();

      console.log('🔍 Supabase response:', { data, fetchError });

      if (fetchError) {
        console.error('❌ Supabase error:', fetchError);
        setError('Er ging iets mis bij het laden van het spel');
        return;
      }

      if (!data) {
        console.error('❌ Game not found');
        setError('Spelcode niet gevonden. Controleer de code en probeer opnieuw.');
        return;
      }

      console.log('✅ Game loaded:', data.id);
      setGameId(data.id);
      setBranding(data.branding as Branding || defaultBranding);
      setSearchParams({ code });
    } catch (err) {
      console.error('❌ Error loading game:', err);
      setError('Er ging iets mis');
    } finally {
      setLoading(false);
    }
  }

  function handleJoinGame(code: string) {
    const upperCode = code.toUpperCase().trim();
    setGameCode(upperCode);
    loadGameByCode(upperCode);
  }

  console.log('🔍 Render decision:', { 
    showJoin: !gameCode || error,
    showLoading: loading,
    showGame: !!gameId,
    willReturnNull: !gameCode && !error && !loading && !gameId
  });

  // Show join screen if no code
  if (!gameCode || error) {
    console.log('🎯 Showing PlayerJoinView');
    return (
      <PlayerJoinView
        branding={branding}
        onJoinGame={handleJoinGame}
      />
    );
  }

  // Show loading
  if (loading) {
    console.log('🎯 Showing loading');
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

  // Show game (TeamView for players)
  if (gameId) {
    console.log('🎯 Showing TeamView');
    return (
      <TeamView
        gameId={gameId}
        onExit={() => {
          setGameCode('');
          setGameId(null);
          setSearchParams({});
        }}
      />
    );
  }

  console.log('❌ Returning null - this should not happen!');
  return null;
}