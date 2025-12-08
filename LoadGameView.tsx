import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Play, Trash2 } from 'lucide-react';
import type { Branding } from '../types/game';

interface SavedGame {
  id: string;
  name: string;
  created_at: string;
  config: any;
  branding: any;
}

interface LoadGameViewProps {
  branding: Branding;
  onBack: () => void;
  onLoadGame: (gameId: string) => void;
}

export function LoadGameView({ branding, onBack, onLoadGame }: LoadGameViewProps) {
  const [games, setGames] = useState<SavedGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    setLoading(true);
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGames(data);
    }
    setLoading(false);
  }

  async function deleteGame(id: string) {
    if (!confirm('Weet je zeker dat je dit spel wilt verwijderen?')) return;

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id);

    if (!error) {
      setGames(games.filter(g => g.id !== id));
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      color: '#fff',
      padding: '2rem',
      fontFamily: branding.bodyFont
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button
          onClick={onBack}
          style={{
            backgroundColor: 'transparent',
            color: branding.primaryColor,
            border: `2px solid ${branding.primaryColor}`,
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            fontFamily: branding.headerFont,
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2rem',
            transition: 'all 0.3s'
          }}
        >
          <ArrowLeft size={20} /> Terug
        </button>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          marginBottom: '0.5rem',
          fontFamily: branding.headerFont,
          color: branding.primaryColor
        }}>
          Opgeslagen Spellen
        </h1>

        <p style={{
          fontSize: '1.125rem',
          color: '#9ca3af',
          marginBottom: '2rem'
        }}>
          Hervat een eerder gestart spel
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#9ca3af' }}>Laden...</p>
          </div>
        ) : games.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '1rem'
          }}>
            <p style={{ color: '#9ca3af', fontSize: '1.125rem' }}>
              Geen opgeslagen spellen gevonden
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
          }}>
            {games.map(game => (
              <div
                key={game.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s'
                }}
              >
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  fontFamily: branding.headerFont,
                  color: branding.primaryColor,
                  marginBottom: '0.5rem'
                }}>
                  {game.name}
                </h3>

                <p style={{
                  fontSize: '0.875rem',
                  color: '#9ca3af',
                  marginBottom: '1rem'
                }}>
                  {formatDate(game.created_at)}
                </p>

                <div style={{
                  fontSize: '0.875rem',
                  color: '#d1d5db',
                  marginBottom: '1rem',
                  lineHeight: '1.5'
                }}>
                  <p>Teams: {game.config?.teams?.length || 0}</p>
                  <p>Stations: {game.config?.stations?.length || 0}</p>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => onLoadGame(game.id)}
                    style={{
                      flex: 1,
                      backgroundColor: branding.primaryColor,
                      color: branding.secondaryColor,
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      fontFamily: branding.headerFont,
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Play size={16} /> HERVATTEN
                  </button>

                  <button
                    onClick={() => deleteGame(game.id)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      fontFamily: branding.headerFont,
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
