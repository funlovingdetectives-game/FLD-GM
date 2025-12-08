import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Team, QuizQuestion, Branding, GameConfig } from '../types/game';
import { Clock, Users, Trophy, CheckCircle, ArrowLeft, Search } from 'lucide-react';

interface IndividualQuizViewProps {
  gameId: string;
  gameCode: string;
  onExit: () => void;
}

interface PlayerOption {
  name: string;
  teamId: string;
  teamName: string;
}

export function IndividualQuizView({ gameId, gameCode, onExit }: IndividualQuizViewProps) {
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<PlayerOption[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [quizUnlocked, setQuizUnlocked] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
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

  // Load game data
  useEffect(() => {
    loadGameData();
    subscribeToGameState();
  }, [gameId]);

  async function loadGameData() {
    try {
      // Load game config
      const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (game) {
        setConfig(game.config as GameConfig);
        setBranding(game.branding as Branding);
      }

      // Load individual quiz questions
      const { data: quizData } = await supabase
        .from('individual_quizzes')
        .select('questions')
        .eq('game_id', gameId)
        .single();

      if (quizData) {
        const qs = quizData.questions as QuizQuestion[];
        setQuestions(qs);
        setAnswers(new Array(qs.length).fill(''));
      }

      // Check if quiz is unlocked
      const { data: state } = await supabase
        .from('game_state')
        .select('individual_quiz_unlocked')
        .eq('game_id', gameId)
        .single();

      if (state) {
        setQuizUnlocked(state.individual_quiz_unlocked || false);
      }
    } catch (error) {
      console.error('Error loading game:', error);
    }
  }

  function subscribeToGameState() {
    const channel = supabase
      .channel(`individual_quiz_${gameId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_state',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        if (payload.new && typeof payload.new === 'object' && 'individual_quiz_unlocked' in payload.new) {
          setQuizUnlocked(payload.new.individual_quiz_unlocked || false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Get all players from all teams
  const allPlayers: PlayerOption[] = config
    ? config.teams.flatMap(team =>
        team.members.map(member => ({
          name: member,
          teamId: team.id,
          teamName: team.name
        }))
      )
    : [];

  // Handle search
  function handleSearch(value: string) {
    setSearchQuery(value);
    if (value.length > 0) {
      const filtered = allPlayers.filter(p =>
        p.name.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filtered);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
    }
  }

  // Select player
  function selectPlayer(player: PlayerOption) {
    setPlayerName(player.name);
    setSelectedTeamId(player.teamId);
    setSearchQuery(player.name);
    setShowDropdown(false);
  }

  // Start quiz
  function startQuiz() {
    if (!playerName || !selectedTeamId) {
      alert('Selecteer eerst je naam uit de lijst');
      return;
    }
    setQuizStarted(true);
  }

  // Update answer
  function updateAnswer(index: number, value: string) {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  }

  // Calculate score
  function calculateScore() {
    let totalScore = 0;
    questions.forEach((q, i) => {
      if (answers[i].toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        totalScore += q.points;
      }
    });
    return totalScore;
  }

  // Submit quiz
  async function handleSubmit() {
    if (!playerName || !selectedTeamId) {
      alert('Naam of team niet gevonden');
      return;
    }

    const finalScore = calculateScore();
    setScore(finalScore);

    try {
      await supabase
        .from('individual_submissions')
        .insert({
          game_id: gameId,
          team_id: selectedTeamId,
          player_name: playerName,
          answers: answers as any,
          score: finalScore,
          submitted_at: new Date().toISOString()
        });

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Fout bij indienen. Probeer opnieuw.');
    }
  }

  if (!config) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
        color: '#fff',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid ' + branding.primaryColor,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      color: '#fff',
      padding: '1rem',
      fontFamily: branding.bodyFont
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#1f2937',
          borderRadius: '0.75rem'
        }}>
          <button
            onClick={onExit}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#374151',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ArrowLeft size={20} />
            Terug
          </button>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontFamily: branding.headerFont,
              color: branding.primaryColor,
              margin: 0
            }}>
              Individuele Quiz
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '0.25rem 0 0' }}>
              Game: {gameCode}
            </p>
          </div>

          <div style={{ width: '100px' }} /> {/* Spacer */}
        </div>

        {/* Main Content */}
        {!quizUnlocked ? (
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '0.75rem',
            padding: '3rem 2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              borderRadius: '50%',
              backgroundColor: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={40} color={branding.primaryColor} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Quiz is nog vergrendeld
            </h2>
            <p style={{ color: '#9ca3af' }}>
              De spelleider moet de individuele quiz vrijgeven voordat je kunt beginnen.
            </p>
          </div>
        ) : !quizStarted ? (
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '0.75rem',
            padding: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              marginBottom: '1.5rem',
              color: branding.primaryColor
            }}>
              Welkom bij de individuele quiz!
            </h2>

            <p style={{ marginBottom: '1.5rem', color: '#d1d5db' }}>
              Zoek en selecteer je naam uit de lijst:
            </p>

            {/* Name Search */}
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 'bold',
                color: branding.primaryColor
              }}>
                Je naam:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery.length > 0 && setShowDropdown(true)}
                  placeholder="Begin te typen... (bijv. Linda)"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    paddingLeft: '3rem',
                    fontSize: '1.125rem',
                    backgroundColor: '#111827',
                    color: '#fff',
                    border: '2px solid ' + (playerName ? branding.primaryColor : '#374151'),
                    borderRadius: '0.5rem',
                    outline: 'none'
                  }}
                />
                <Search
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af'
                  }}
                />
              </div>

              {/* Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#1f2937',
                  border: '2px solid ' + branding.primaryColor,
                  borderRadius: '0.5rem',
                  marginTop: '0.5rem',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 10,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                  {searchResults.map((player, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectPlayer(player)}
                      style={{
                        padding: '1rem',
                        cursor: 'pointer',
                        borderBottom: idx < searchResults.length - 1 ? '1px solid #374151' : 'none',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#374151';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                        {player.name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                        {player.teamName}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length > 0 && searchResults.length === 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  backgroundColor: '#374151',
                  borderRadius: '0.5rem',
                  color: '#9ca3af'
                }}>
                  Geen spelers gevonden met "{searchQuery}"
                </div>
              )}
            </div>

            {playerName && selectedTeamId && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#065f46',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle size={20} color="#10b981" />
                <span>
                  Geselecteerd: <strong>{playerName}</strong> ({config.teams.find(t => t.id === selectedTeamId)?.name})
                </span>
              </div>
            )}

            <button
              onClick={startQuiz}
              disabled={!playerName || !selectedTeamId}
              style={{
                width: '100%',
                padding: '1.25rem',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                backgroundColor: playerName && selectedTeamId ? branding.primaryColor : '#6b7280',
                color: playerName && selectedTeamId ? branding.secondaryColor : '#9ca3af',
                border: 'none',
                borderRadius: '0.75rem',
                cursor: playerName && selectedTeamId ? 'pointer' : 'not-allowed',
                fontFamily: branding.headerFont
              }}
            >
              Start Quiz
            </button>
          </div>
        ) : submitted ? (
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '0.75rem',
            padding: '3rem 2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 1.5rem',
              borderRadius: '50%',
              backgroundColor: '#065f46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trophy size={50} color={branding.primaryColor} />
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: branding.primaryColor }}>
              Ingeleverd!
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#d1d5db', marginBottom: '1rem' }}>
              {playerName}, je score:
            </p>
            <div style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: branding.primaryColor,
              marginBottom: '2rem'
            }}>
              {score} punten
            </div>
            <button
              onClick={onExit}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.125rem',
                backgroundColor: '#374151',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              Sluiten
            </button>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '0.75rem',
            padding: '2rem'
          }}>
            <div style={{
              marginBottom: '2rem',
              padding: '1rem',
              backgroundColor: '#374151',
              borderRadius: '0.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>{playerName}</strong>
                <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>
                  ({config.teams.find(t => t.id === selectedTeamId)?.name})
                </span>
              </div>
              <div style={{ color: branding.primaryColor, fontWeight: 'bold' }}>
                {questions.length} vragen
              </div>
            </div>

            {questions.map((question, index) => (
              <div
                key={question.id}
                style={{
                  marginBottom: '2rem',
                  padding: '1.5rem',
                  backgroundColor: '#374151',
                  borderRadius: '0.75rem'
                }}
              >
                <h3 style={{
                  fontSize: '1.25rem',
                  marginBottom: '1rem',
                  color: branding.primaryColor
                }}>
                  Vraag {index + 1} ({question.points} punten)
                </h3>

                {question.imageUrl && (
                  <img
                    src={question.imageUrl}
                    alt="Quiz afbeelding"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      borderRadius: '0.5rem',
                      marginBottom: '1rem'
                    }}
                  />
                )}

                <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>
                  {question.question}
                </p>

                {question.type === 'multiple-choice' && question.options ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {question.options.map((option, oIdx) => (
                      <label
                        key={oIdx}
                        style={{
                          padding: '1rem',
                          backgroundColor: answers[index] === option ? branding.primaryColor : '#1f2937',
                          color: answers[index] === option ? branding.secondaryColor : '#fff',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          border: '2px solid ' + (answers[index] === option ? branding.primaryColor : '#4b5563'),
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          fontSize: '1.125rem'
                        }}
                      >
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option}
                          checked={answers[index] === option}
                          onChange={(e) => updateAnswer(index, e.target.value)}
                          style={{ width: '20px', height: '20px' }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answers[index]}
                    onChange={(e) => updateAnswer(index, e.target.value)}
                    placeholder="Typ je antwoord..."
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '1.125rem',
                      backgroundColor: '#1f2937',
                      color: '#fff',
                      border: '2px solid #4b5563',
                      borderRadius: '0.5rem'
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
                padding: '1.25rem',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                backgroundColor: answers.some(a => !a) ? '#6b7280' : branding.primaryColor,
                color: answers.some(a => !a) ? '#9ca3af' : branding.secondaryColor,
                border: 'none',
                borderRadius: '0.75rem',
                cursor: answers.some(a => !a) ? 'not-allowed' : 'pointer',
                fontFamily: branding.headerFont
              }}
            >
              {answers.some(a => !a) ? 'Beantwoord alle vragen' : 'Inleveren'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
