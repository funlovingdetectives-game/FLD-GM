import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import type { Branding, QuizQuestion } from '../types/game';

interface QuizEditorViewProps {
  branding: Branding;
  quizType: 'team' | 'individual';
  initialQuestions: QuizQuestion[];
  onBack: () => void;
  onSave: (questions: QuizQuestion[]) => void;
}

export function QuizEditorView({
  branding,
  quizType,
  initialQuestions,
  onBack,
  onSave
}: QuizEditorViewProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialQuestions.length > 0
      ? initialQuestions
      : [createEmptyQuestion()]
  );

 function createEmptyQuestion(): QuizQuestion {
    return {
      id: `q-${Date.now()}-${Math.random()}`,
      question: '',
      type: 'multiple-choice',
      correctAnswer: '',
      options: ['', '', '', ''],
      points: 10
    };
  }
  function addQuestion() {
    setQuestions([...questions, createEmptyQuestion()]);
  }

  function removeQuestion(index: number) {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, updates: Partial<QuizQuestion>) {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    const newQuestions = [...questions];
    const options = [...(newQuestions[questionIndex].options || [])];
    options[optionIndex] = value;
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], options };
    setQuestions(newQuestions);
  }

  function addOption(questionIndex: number) {
    const newQuestions = [...questions];
    const options = [...(newQuestions[questionIndex].options || [])];
    options.push('');
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], options };
    setQuestions(newQuestions);
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    const newQuestions = [...questions];
    const options = [...(newQuestions[questionIndex].options || [])];
    if (options.length <= 2) return;
    options.splice(optionIndex, 1);
    newQuestions[questionIndex] = { ...newQuestions[questionIndex], options };
    setQuestions(newQuestions);
  }

  function handleSave() {
    const validQuestions = questions.filter(q =>
      q.question.trim() !== '' &&
      q.correctAnswer.trim() !== ''
    );

    if (validQuestions.length === 0) {
      alert('Voeg minimaal 1 geldige vraag toe');
      return;
    }

    onSave(validQuestions);
  }

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
          {quizType === 'team' ? 'Team Quiz' : 'Individuele Quiz'}
        </h1>

        <p style={{
          fontSize: '1.125rem',
          color: '#9ca3af',
          marginBottom: '2rem'
        }}>
          Maak vragen voor de {quizType === 'team' ? 'teamquiz' : 'individuele quiz'}
        </p>

        <div style={{ marginBottom: '2rem' }}>
          {questions.map((question, qIndex) => (
            <div
              key={qIndex}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  fontFamily: branding.headerFont,
                  color: branding.primaryColor
                }}>
                  Vraag {qIndex + 1}
                </h3>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  disabled={questions.length === 1}
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: questions.length === 1 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: '#d1d5db'
                }}>
                  Vraag
                </label>
                <textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                  placeholder="Typ hier je vraag..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '1rem',
                    fontFamily: branding.bodyFont,
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: '#d1d5db'
                  }}>
                    Type
                  </label>
                  <select
                    value={question.type}
                    onChange={(e) => updateQuestion(qIndex, {
                      type: e.target.value as 'open' | 'multiple-choice',
                      options: e.target.value === 'multiple-choice' ? ['', '', '', ''] : undefined
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '1rem',
                      fontFamily: branding.bodyFont
                    }}
                  >
                    <option value="multiple">Meerkeuze</option>
                    <option value="open">Open vraag</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem',
                    color: '#d1d5db'
                  }}>
                    Punten
                  </label>
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => updateQuestion(qIndex, { points: parseInt(e.target.value) || 0 })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '1rem',
                      fontFamily: branding.bodyFont
                    }}
                  />
                </div>
              </div>

              {question.type === 'multiple-choice' && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <label style={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      color: '#d1d5db'
                    }}>
                      Antwoordopties
                    </label>
                    <button
                      onClick={() => addOption(qIndex)}
                      style={{
                        backgroundColor: branding.primaryColor,
                        color: branding.secondaryColor,
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Plus size={14} /> Optie
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {(question.options || []).map((option, oIndex) => (
                      <div key={oIndex} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Optie ${oIndex + 1}`}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.5rem',
                            color: '#fff',
                            fontSize: '1rem',
                            fontFamily: branding.bodyFont
                          }}
                        />
                        <button
                          onClick={() => removeOption(qIndex, oIndex)}
                          disabled={(question.options?.length || 0) <= 2}
                          style={{
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            padding: '0.75rem',
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            opacity: (question.options?.length || 0) <= 2 ? 0.3 : 1,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: '#d1d5db'
                }}>
                  Correct Antwoord
                </label>
                {question.type === 'multiple-choice' ? (
                  <select
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '1rem',
                      fontFamily: branding.bodyFont
                    }}
                  >
                    <option value="">Selecteer correct antwoord...</option>
                    {(question.options || []).filter(o => o.trim()).map((option, idx) => (
                      <option key={idx} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })}
                    placeholder="Typ het correcte antwoord..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.5rem',
                      color: '#fff',
                      fontSize: '1rem',
                      fontFamily: branding.bodyFont
                    }}
                  />
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: '#d1d5db'
                }}>
                  Afbeelding URL (optioneel)
                </label>
                <input
                  type="text"
                  value={question.imageUrl || ''}
                  onChange={(e) => updateQuestion(qIndex, { imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '1rem',
                    fontFamily: branding.bodyFont
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={addQuestion}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: branding.primaryColor,
              border: `2px solid ${branding.primaryColor}`,
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              fontFamily: branding.headerFont,
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s'
            }}
          >
            <Plus size={20} /> Vraag Toevoegen
          </button>

          <button
            onClick={handleSave}
            style={{
              flex: 1,
              backgroundColor: branding.primaryColor,
              color: branding.secondaryColor,
              padding: '1rem',
              fontSize: '1rem',
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
            <Save size={20} /> Opslaan
          </button>
        </div>
      </div>
    </div>
  );
}