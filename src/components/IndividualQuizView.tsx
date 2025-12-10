import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { QuizQuestion, Branding } from '../types/game';
import { User, CheckCircle, XCircle, Trophy, Lock } from 'lucide-react';

interface IndividualQuizViewProps {
  gameId: string;
  teamId: string;
}

export function IndividualQuizView({ gameId, teamId }: IndividualQuizViewProps) {
  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [quizUnlocked, setQuizUnlocked] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [branding, setBranding] = useState<Branding>({
    headerFont: 'Arial Black, sans-serif',
    bodyFont: 'Arial, sans-serif',
    primaryColor: '#fbbf24',
    secondaryColor: '#000',
    logoUrl: '',
    companyName: '',
    customFontUrl: '',
    customFontName: ''
  });

  useEffect(() => {
    loadGame();
    subscribeToGameState();
  }, []);

  useEffect(() => {
    if (hasJoined && playerName) {
      checkExistingSubmission();
    }
  }, [hasJoined, playerName]);

  async function loadGame() {
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (game) {
      setBranding(game.branding as Branding);
      
      const config = game.config as any;
      const team = config.teams.find((t: any) => t.id === teamId);
      if (team) {
        setTeamName(team.name);
      }

      // Load quiz
      const { data: quiz } = await supabase
        .from('individual_quizzes')
        .select('questions')
        .eq('game_id', gameId)
        .maybeSingle();

      if (quiz?.questions) {
        const qs = quiz.questions as QuizQuestion[];
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(''));
      }

      // Load game state
      const { data: state } = await supabase
        .from('game_state')
        .select('individual_quiz_unlocked')
        .eq('game_id', gameId)
        .maybeSingle();

      if (state) {
        setQuizUnlocked(state.individual_quiz_unlocked || false);
      }
    }
  }

  function subscribeToGameState() {
    const channel = supabase
      .channel(`individual-game-state-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const state = payload.new as any;
          setQuizUnlocked(state.individual_quiz_unlocked || false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  async function checkExistingSubmission() {
    const { data: submission } = await supabase
      .from('individual_submissions')
      .select('*')
      .eq('game_id', gameId)
      .eq('team_id', teamId)
      .eq('player_name', playerName)
      .maybeSingle();

    if (submission) {
      setSubmitted(submission.submitted);
      setScore(submission.score);
      if (submission.answers) {
        const answersArray = Object.values(submission.answers);
        setAnswers(answersArray as string[]);
      }
    }
  }

  async function handleJoin() {
    if (!playerName.trim()) return;
    setHasJoined(true);
  }

  async function handleSubmit() {
    if (submitted) return;

    const answersObject: Record<string, string> = {};
    questions.forEach((q, i) => {
      answersObject[q.id] = answers[i] || '';
    });

    // Check if submission exists
    const { data: existing } = await supabase
      .from('individual_submissions')
      .select('id')
      .eq('game_id', gameId)
      .eq('team_id', teamId)
      .eq('player_name', playerName)
      .maybeSingle();

    if (existing) {
      // Update existing
      await supabase
        .from('individual_submissions')
        .update({
          answers: answersObject as never,
          submitted: true
        })
        .eq('id', existing.id);
    } else {
      // Create new
      await supabase
        .from('individual_submissions')
        .insert({
          game_id: gameId,
          team_id: teamId,
          player_name: playerName,
          answers: answersObject as never,
          score: 0,
          submitted: true
        });
    }

    setSubmitted(true);
  }

  // JOIN SCREEN
  if (!hasJoined) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
        color: '#fff',
        padding: '2rem',
        fontFamily: branding.bodyFont,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {branding.customFontUrl && (
          <style>{`@font-face { font-family: '${branding.customFontName}'; src: url('${branding.customFontUrl}'); }`}</style>
        )}

        <div style={{
          maxWidth: '500px',
          width: '100%'
        }}>
          {branding.logoUrl && (
            <img
              src={branding.logoUrl}
              alt={branding.companyName}
              style={{
                maxHeight: '6rem',
                maxWidth: '90%',
                margin: '0 auto 2rem',
                display: 'block',
                objectFit: 'contain'
              }}
            />
          )}

          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '1rem',
            padding: '2rem',
            border: `3px solid ${branding.primaryColor}`
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <User size={64} style={{ color: branding.primaryColor, margin: '0 auto 1rem' }} />
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                fontFamily: branding.headerFont,
                color: branding.primaryColor,
                marginBottom: '0.5rem'
              }}>
                Individuele Quiz
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#9ca3af'
              }}>
                Team: {teamName}
              </p>
            </div>

            <label style={{
              display: 'block',
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#d1d5db',
              marginBottom: '0.5rem'
            }}>
              Jouw Naam
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Voer je naam in..."
              autoFocus
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                backgroundColor: '#374151',
                color: '#fff',
                border: '2px solid #4B5563',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
            />

            <button
              onClick={handleJoin}
              disabled={!playerName.trim()}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                fontFamily: branding.headerFont,
                backgroundColor: playerName.trim() ? branding.primaryColor : '#4B5563',
                color: playerName.trim() ? branding.secondaryColor : '#9ca3af',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: playerName.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QUIZ NOT UNLOCKED
  if (!quizUnlocked) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
        color: '#fff',
        padding: '2rem',
        fontFamily: branding.bodyFont,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: '#1f2937',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center',
          border: `3px solid ${branding.primaryColor}`
        }}>
          <Lock size={80} style={{ color: '#9ca3af', margin: '0 auto 1.5rem' }} />
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 'bold',
            fontFamily: branding.headerFont,
            color: branding.primaryColor,
            marginBottom: '1rem'
          }}>
            Quiz Nog Niet Vrijgegeven
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#9ca3af',
            marginBottom: '1rem'
          }}>
            Hoi {playerName}! De spelleider heeft de individuele quiz nog niet vrijgegeven.
          </p>
          <p style={{
            fontSize: '1rem',
            color: '#6b7280'
          }}>
            Deze pagina wordt automatisch bijgewerkt zodra de quiz beschikbaar is.
          </p>
        </div>
      </div>
    );
  }

  // SUBMITTED SCREEN
  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
        color: '#fff',
        padding: '2rem',
        fontFamily: branding.bodyFont,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: '#1f2937',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center',
          border: `3px solid ${branding.primaryColor}`
        }}>
          <CheckCircle size={80} style={{ color: '#22c55e', margin: '0 auto 1.5rem' }} />
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            fontFamily: branding.headerFont,
            color: branding.primaryColor,
            marginBottom: '1rem'
          }}>
            Quiz Ingeleverd!
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#d1d5db',
            marginBottom: '2rem'
          }}>
            Bedankt {playerName}!
          </p>
          {score !== null && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: branding.primaryColor,
              borderRadius: '0.75rem',
              marginBottom: '1rem'
            }}>
              <Trophy size={48} style={{ color: branding.secondaryColor, margin: '0 auto 1rem' }} />
              <p style={{
                fontSize: '1rem',
                color: branding.secondaryColor,
                marginBottom: '0.5rem'
              }}>
                Jouw Score
              </p>
              <p style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                fontFamily: branding.headerFont,
                color: branding.secondaryColor
              }}>
                {score}
              </p>
            </div>
          )}
          <p style={{
            fontSize: '0.875rem',
            color: '#9ca3af'
          }}>
            Je kunt dit scherm nu sluiten
          </p>
        </div>
      </div>
    );
  }

  // QUIZ SCREEN
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      color: '#fff',
      padding: '1rem',
      fontFamily: branding.bodyFont
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* HEADER */}
        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: '1rem 1rem 0 0',
          padding: '1.5rem',
          borderBottom: `3px solid ${branding.primaryColor}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                fontFamily: branding.headerFont,
                color: branding.primaryColor,
                marginBottom: '0.25rem'
              }}>
                👤 Individuele Quiz
              </h1>
              <p style={{
                fontSize: '1rem',
                color: '#9ca3af'
              }}>
                {playerName} • Team {teamName}
              </p>
            </div>
          </div>
        </div>

        {/* QUESTIONS */}
        <div style={{
          backgroundColor: '#1f2937',
          padding: '2rem',
          borderRadius: '0 0 1rem 1rem'
        }}>
          {questions.map((q, index) => (
            <div
              key={q.id}
              style={{
                backgroundColor: '#374151',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}
            >
              <p style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: '#fff',
                marginBottom: '1rem'
              }}>
                {index + 1}. {q.question}
              </p>

              {q.imageUrl && (
                <img
                  src={q.imageUrl}
                  alt="Vraag afbeelding"
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    backgroundColor: '#4B5563'
                  }}
                />
              )}

              {q.type === 'multiple-choice' && q.options ? (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {q.options.map((option, i) => (
                    <label
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1rem',
                        backgroundColor: answers[index] === option ? branding.primaryColor : '#4B5563',
                        color: answers[index] === option ? branding.secondaryColor : '#fff',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={answers[index] === option}
                        onChange={(e) => {
                          const newAnswers = [...answers];
                          newAnswers[index] = e.target.value;
                          setAnswers(newAnswers);
                        }}
                        style={{ width: '1.25rem', height: '1.25rem' }}
                      />
                      <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[index] || ''}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[index] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  placeholder="Jouw antwoord..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1rem',
                    backgroundColor: '#4B5563',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    resize: 'vertical',
                    fontFamily: branding.bodyFont
                  }}
                />
              )}
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={answers.some(a => !a)}
            style={{
              width: '100%',
              padding: '1.5rem',
              backgroundColor: answers.some(a => !a) ? '#4B5563' : branding.primaryColor,
              color: answers.some(a => !a) ? '#9ca3af' : branding.secondaryColor,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              fontFamily: branding.headerFont,
              borderRadius: '0.75rem',
              border: 'none',
              cursor: answers.some(a => !a) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
          >
            <CheckCircle size={32} />
            INLEVEREN
          </button>
        </div>
      </div>
    </div>
  );
}