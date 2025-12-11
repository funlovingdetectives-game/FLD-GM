import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { PlayerJoinView } from './components/PlayerJoinView';
import { TeamView } from './components/TeamView';
import { IndividualQuizView } from './components/IndividualQuizView';
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
  const [gameId, setGameId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [isIndividualQuiz, setIsIndividualQuiz] = useState(false);
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for individual quiz route or team route
  useEffect(() => {
    const gameParam = searchParams.get('game');
    const teamParam = searchParams.get('team');
    const codeFromUrl = searchParams.get('code');

    // Individual quiz route: /play?game=XXX&team=YYY
    if (gameParam && teamParam) {
      setGameId(gameParam);
      setTeamId(teamParam);
      setIsIndividualQuiz(true);
      return;
    }

    // Team view route: /play?code=FLD-XXX
    if (codeFromUrl) {
      loadGameByCode(codeFromUrl, true); // silent fail on mount
    }
  }, []);

  async function loadGameByCode(code: string, silentFail = false) {
    if (!code) return;

    setLoading(true);
    if (!silentFail) {
      setError(''); // Only clear error if not silent
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('games')
        .select('id, name, code, config, branding')
        .eq('code', code)
        .maybeSingle();

      if (fetchError || !data) {
        console.error('Game not found:', code);
        
        if (!silentFail) {
          // User submitted manually - show error
          setError('Spelcode niet gevonden. Controleer de code en probeer opnieuw.');
        } else {
          // Initial URL load failed - just clear URL, no error
          setSearchParams({});
        }
        return;
      }

      // Success!
      setGameId(data.id);
      setBranding(data.branding as Branding || defaultBranding);
      setSearchParams({ code }); // Update URL
      setError(''); // Clear any previous error
    } catch (err: any) {
      console.error('Error loading game:', err);
      
      if (!silentFail) {
        setError('Er ging iets mis bij het laden van het spel');
      } else {
        setSearchParams({});
      }
    } finally {
      setLoading(false);
    }
  }

  function handleJoinGame(code: string) {
    const upperCode = code.toUpperCase().trim();
    loadGameByCode(upperCode, false); // false = show errors
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

  // Show individual quiz
  if (isIndividualQuiz && gameId && teamId) {
    return (
      <IndividualQuizView
        gameId={gameId}
        teamId={teamId}
      />
    );
  }

  // Show game (TeamView)
  if (gameId && !isIndividualQuiz) {
    return (
      <TeamView
        gameId={gameId}
      />
    );
  }

  // Show join screen (no game loaded yet, or after error)
  return (
    <PlayerJoinView
      branding={branding}
      onJoinGame={handleJoinGame}
      error={error}
      onCodeChange={() => setError('')}
    />
  );
}
