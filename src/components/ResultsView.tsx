import { Trophy, Award, Star } from 'lucide-react';
import type { Branding, GameConfig, TeamSubmission, IndividualSubmission } from '../types/game';

interface ResultsViewProps {
  branding: Branding;
  config: GameConfig;
  teamSubmissions: Record<string, TeamSubmission>;
  individualSubmissions: IndividualSubmission[];
  onBack: () => void;
}

export function ResultsView({
  branding,
  config,
  teamSubmissions,
  individualSubmissions,
  onBack
}: ResultsViewProps) {
  const teamScores = [...config.teams]
    .map(t => ({
      ...t,
      total: t.score + (teamSubmissions[t.id]?.score || 0)
    }))
    .sort((a, b) => b.total - a.total);

  const topIndividual = [...individualSubmissions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      color: '#fff',
      padding: 'clamp(1rem, 3vw, 2rem)',
      fontFamily: branding.bodyFont
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: branding.primaryColor,
            fontSize: 'clamp(1rem, 3vw, 1.25rem)',
            fontFamily: branding.headerFont,
            cursor: 'pointer',
            marginBottom: '2rem',
            padding: '0.5rem'
          }}
        >
          ← Terug naar controle
        </button>

        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          {branding.logoUrl && (
            <img
              src={branding.logoUrl}
              alt={branding.companyName}
              style={{
                maxHeight: 'clamp(3rem, 8vw, 5rem)',
                marginBottom: '1rem'
              }}
            />
          )}
          <h1 style={{
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            fontWeight: 900,
            fontFamily: branding.headerFont,
            color: branding.primaryColor,
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {config.gameName}
          </h1>
          <p style={{
            fontSize: 'clamp(1.25rem, 3vw, 2rem)',
            fontFamily: branding.headerFont,
            color: '#d1d5db'
          }}>
            Eindresultaten
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '1rem',
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            border: `3px solid ${branding.primaryColor}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <Trophy size={40} style={{ color: branding.primaryColor }} />
              <h2 style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 900,
                fontFamily: branding.headerFont,
                color: branding.primaryColor
              }}>
                Team Klassement
              </h2>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {teamScores.map((team, index) => {
                const isWinner = index === 0;
                const isPodium = index < 3;

                return (
                  <div
                    key={team.id}
                    style={{
                      backgroundColor: isWinner ? branding.primaryColor : '#374151',
                      borderRadius: '0.75rem',
                      padding: 'clamp(1rem, 3vw, 1.5rem)',
                      border: isPodium ? `3px solid ${branding.primaryColor}` : 'none',
                      transform: isWinner ? 'scale(1.02)' : 'none',
                      transition: 'all 0.3s'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flex: 1
                      }}>
                        <div style={{
                          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                          fontWeight: 900,
                          fontFamily: branding.headerFont,
                          color: isWinner ? branding.secondaryColor : branding.primaryColor,
                          width: 'clamp(2rem, 5vw, 3rem)',
                          textAlign: 'center'
                        }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                        </div>
                        <div
                          style={{
                            width: 'clamp(1rem, 3vw, 1.5rem)',
                            height: 'clamp(1rem, 3vw, 1.5rem)',
                            borderRadius: '50%',
                            backgroundColor: team.color,
                            border: '2px solid #fff'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                            fontWeight: 900,
                            fontFamily: branding.headerFont,
                            color: isWinner ? branding.secondaryColor : '#fff',
                            marginBottom: '0.25rem'
                          }}>
                            {team.name}
                          </h3>
                          <p style={{
                            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                            color: isWinner ? branding.secondaryColor : '#d1d5db',
                            opacity: 0.8
                          }}>
                            Aanvoerder: {team.captain}
                          </p>
                        </div>
                      </div>
                      <div style={{
                        fontSize: 'clamp(1.75rem, 5vw, 3rem)',
                        fontWeight: 900,
                        fontFamily: branding.headerFont,
                        color: isWinner ? branding.secondaryColor : branding.primaryColor
                      }}>
                        {team.total}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '1rem',
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            border: `3px solid ${branding.primaryColor}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <Award size={40} style={{ color: branding.primaryColor }} />
              <h2 style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 900,
                fontFamily: branding.headerFont,
                color: branding.primaryColor
              }}>
                Top 10 Individueel
              </h2>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {topIndividual.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: '#9ca3af'
                }}>
                  <Star size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>
                    Geen individuele scores beschikbaar
                  </p>
                </div>
              ) : (
                topIndividual.map((submission, index) => {
                  const team = config.teams.find(t => t.id === submission.teamId);
                  const isTop3 = index < 3;

                  return (
                    <div
                      key={index}
                      style={{
                        backgroundColor: isTop3 ? 'rgba(251, 191, 36, 0.1)' : '#374151',
                        borderRadius: '0.5rem',
                        padding: 'clamp(0.75rem, 2.5vw, 1rem)',
                        border: isTop3 ? `2px solid ${branding.primaryColor}` : 'none'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          flex: 1,
                          minWidth: 0
                        }}>
                          <span style={{
                            fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                            fontWeight: 900,
                            fontFamily: branding.headerFont,
                            color: branding.primaryColor,
                            width: 'clamp(1.5rem, 4vw, 2rem)',
                            textAlign: 'center'
                          }}>
                            {index + 1}.
                          </span>
                          {team && (
                            <div
                              style={{
                                width: 'clamp(0.75rem, 2.5vw, 1rem)',
                                height: 'clamp(0.75rem, 2.5vw, 1rem)',
                                borderRadius: '50%',
                                backgroundColor: team.color,
                                flexShrink: 0
                              }}
                            />
                          )}
                          <span style={{
                            fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                            fontWeight: isTop3 ? 'bold' : 'normal',
                            color: '#fff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {submission.playerName}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                          fontWeight: 900,
                          fontFamily: branding.headerFont,
                          color: branding.primaryColor,
                          flexShrink: 0
                        }}>
                          {submission.score}pt
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: '1rem',
          padding: 'clamp(1.5rem, 4vw, 2rem)',
          textAlign: 'center',
          border: `3px solid ${branding.primaryColor}`
        }}>
          <Trophy size={64} style={{ color: branding.primaryColor, margin: '0 auto 1rem' }} />
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 900,
            fontFamily: branding.headerFont,
            color: branding.primaryColor,
            marginBottom: '1rem'
          }}>
            Gefeliciteerd!
          </h2>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: '#d1d5db',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Bedankt voor het spelen van {config.gameName}!
          </p>
          {branding.companyName && (
            <p style={{
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              color: '#9ca3af',
              marginTop: '1rem'
            }}>
              Mogelijk gemaakt door {branding.companyName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
