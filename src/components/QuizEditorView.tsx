import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
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
  const [uploading, setUploading] = useState<number | null>(null);

  function createEmptyQuestion(): QuizQuestion {
    return {
      id: `q-${Date.now()}-${Math.random()}`,
      question: '',
      type: 'multiple-choice',
      correctAnswer: '',
      options: ['', '', '', ''],
      points: 10,
      imageUrl: undefined
    };
  }

  function addQuestion() {
    setQuestions([...questions, createEmptyQuestion()]);
  }

  function removeQuestion(index: number) {
    if (questions.length === 1) return;
    
    // Delete image if exists
    const question = questions[index];
    if (question.imageUrl) {
      deleteImage(question.imageUrl);
    }
    
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

  async function handleImageUpload(questionIndex: number, file: File) {
    try {
      setUploading(questionIndex);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Upload alleen afbeeldingen (jpg, png, gif, webp)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Afbeelding is te groot (max 5MB)');
        return;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('quiz-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        alert('Upload mislukt: ' + error.message);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('quiz-images')
        .getPublicUrl(data.path);

      // Update question with image URL
      updateQuestion(questionIndex, { imageUrl: urlData.publicUrl });

    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload mislukt');
    } finally {
      setUploading(null);
    }
  }

  async function deleteImage(imageUrl: string) {
    try {
      // Extract filename from URL
      const filename = imageUrl.split('/').pop();
      if (!filename) return;

      // Delete from Supabase Storage
      const { error } = await supabase.storage
        .from('quiz-images')
        .remove([filename]);

      if (error) {
        console.error('Delete error:', error);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  }

  function handleRemoveImage(questionIndex: number) {
    const question = questions[questionIndex];
    if (question.imageUrl) {
      deleteImage(question.imageUrl);
      updateQuestion(questionIndex, { imageUrl: undefined });
    }
  }

  function handleSave() {
    console.log('💾 handleSave called with', questions.length, 'questions');
    const validQuestions = questions.filter(q =>
      q.question.trim() !== '' &&
      q.correctAnswer.trim() !== ''
    );

    if (validQuestions.length === 0) {
      alert('Voeg minimaal 1 geldige vraag toe');
      return;
    }

    console.log('✅ Calling onSave with', validQuestions.length, 'valid questions');
    onSave(validQuestions);
    alert(`✅ ${validQuestions.length} ${validQuestions.length === 1 ? 'vraag' : 'vragen'} opgeslagen!`);
    onBack(); // 🔥 Go back automatically
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
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#374151',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '2rem'
          }}
        >
          <ArrowLeft size={20} />
          Terug
        </button>

        <h1 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          fontFamily: branding.headerFont,
          color: branding.primaryColor,
          marginBottom: '2rem'
        }}>
          {quizType === 'team' ? 'Team Quiz' : 'Individuele Quiz'} Bewerken
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {questions.map((question, qIndex) => (
            <div
              key={qIndex}
              style={{
                backgroundColor: '#1f2937',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                border: '2px solid #374151'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ fontSize: '1.25rem', color: branding.primaryColor }}>
                  Vraag {qIndex + 1}
                </h3>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Trash2 size={16} />
                    Verwijder
                  </button>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Vraag:
                </label>
                <textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                  placeholder="Typ hier je vraag..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#111827',
                    color: '#fff',
                    border: '1px solid #374151',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: branding.bodyFont
                  }}
                />
              </div>

              {/* Image Upload Section */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Afbeelding (optioneel):
                </label>
                
                {question.imageUrl ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={question.imageUrl}
                      alt="Quiz afbeelding"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: '0.5rem',
                        border: '2px solid ' + branding.primaryColor
                      }}
                    />
                    <button
                      onClick={() => handleRemoveImage(qIndex)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Verwijder afbeelding"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(qIndex, file);
                        }
                      }}
                      disabled={uploading === qIndex}
                      style={{ display: 'none' }}
                      id={`image-upload-${qIndex}`}
                    />
                    <label
                      htmlFor={`image-upload-${qIndex}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: uploading === qIndex ? '#6b7280' : '#4b5563',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: uploading === qIndex ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      {uploading === qIndex ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #fff',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Uploaden...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Upload Afbeelding
                        </>
                      )}
                    </label>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                      Max 5MB • JPG, PNG, GIF, WEBP
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Type:
                </label>
                <select
                  value={question.type}
                  onChange={(e) =>
                    updateQuestion(qIndex, {
                      type: e.target.value as 'open' | 'multiple-choice',
                      options: e.target.value === 'multiple-choice' ? ['', '', '', ''] : undefined
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#111827',
                    color: '#fff',
                    border: '1px solid #374151',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    fontFamily: branding.bodyFont
                  }}
                >
                  <option value="open">Open vraag</option>
                  <option value="multiple-choice">Multiple choice</option>
                </select>
              </div>

              {question.type === 'multiple-choice' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Antwoord opties:
                  </label>
                  {question.options?.map((option, oIndex) => (
                    <div key={oIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        placeholder={`Optie ${oIndex + 1}`}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          backgroundColor: '#111827',
                          color: '#fff',
                          border: '1px solid #374151',
                          borderRadius: '0.375rem',
                          fontSize: '1rem',
                          fontFamily: branding.bodyFont
                        }}
                      />
                      {(question.options?.length || 0) > 2 && (
                        <button
                          onClick={() => removeOption(qIndex, oIndex)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(qIndex)}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#4b5563',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    + Voeg optie toe
                  </button>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Correct antwoord:
                </label>
                {question.type === 'multiple-choice' ? (
                  <select
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(qIndex, { correctAnswer: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#111827',
                      color: '#fff',
                      border: '1px solid #374151',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontFamily: branding.bodyFont
                    }}
                  >
                    <option value="">Selecteer correct antwoord...</option>
                    {question.options?.map((option, i) => (
                      <option key={i} value={option}>
                        {option || `Optie ${i + 1}`}
                      </option>
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
                      backgroundColor: '#111827',
                      color: '#fff',
                      border: '1px solid #374151',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontFamily: branding.bodyFont
                    }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Punten:
                </label>
                <input
                  type="number"
                  value={question.points}
                  onChange={(e) => updateQuestion(qIndex, { points: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="100"
                  style={{
                    width: '100px',
                    padding: '0.75rem',
                    backgroundColor: '#111827',
                    color: '#fff',
                    border: '1px solid #374151',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    fontFamily: branding.bodyFont
                  }}
                />
              </div>
            </div>
          ))}

          <button
            onClick={addQuestion}
            style={{
              padding: '1rem',
              backgroundColor: '#4b5563',
              color: '#fff',
              border: '2px dashed #6b7280',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontFamily: branding.bodyFont
            }}
          >
            <Plus size={20} />
            Voeg vraag toe
          </button>
        </div>

        <div style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '1rem 2rem',
              backgroundColor: branding.primaryColor,
              color: branding.secondaryColor,
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontFamily: branding.headerFont
            }}
          >
            <Save size={20} />
            Opslaan
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}