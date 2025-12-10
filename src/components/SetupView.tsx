import { Save, Play, Edit, ArrowLeft } from 'lucide-react';
import type { Branding, GameConfig } from '../types/game';
import { TeamSetup } from './TeamSetup';
import { StationSetup } from './StationSetup';
import { RouteSetup } from './RouteSetup';

interface SetupViewProps {
  config: GameConfig;
  branding: Branding;
  onConfigChange: (config: GameConfig) => void;
  onSave: () => void;
  onStartGame: () => void;
  onEditTeamQuiz: () => void;
  onEditIndividualQuiz: () => void;
  onBack: () => void;
}

export function SetupView({
  config,
  branding,
  onConfigChange,
  onSave,
  onStartGame,
  onEditTeamQuiz,
  onEditIndividualQuiz,
  onBack
}: SetupViewProps) {
  const isValid = config.teams.length >= 2 && config.stations.length >= 1;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      padding: 'clamp(1rem, 3vw, 2rem)',
      paddingTop: '6rem', // Space for sticky header
      fontFamily: branding.bodyFont
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#374151',
              color: '#9ca3af',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            <ArrowLeft size={20} /> Terug
          </button>

          <button
            onClick={onSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: branding.primaryColor,
              color: branding.secondaryColor,
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              fontFamily: branding.headerFont
            }}
          >
            <Save size={20} /> OPSLAAN
          </button>

          <button
            onClick={onStartGame}
            disabled={!isValid}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: isValid ? '#10b981' : '#4B5563',
              color: isValid ? '#fff' : '#9ca3af',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isValid ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              fontWeight: 'bold',
              fontFamily: branding.headerFont,
              marginLeft: 'auto'
            }}
          >
            <Play size={20} /> START SPEL
          </button>
        </div>

        {/* Quiz Edit Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={onEditTeamQuiz}
            style={{
              padding: '1rem',
              backgroundColor: '#1f2937',
              color: '#fff',
              border: `2px solid ${branding.primaryColor}`,
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Edit size={20} /> Bewerk Team Quiz
          </button>

          <button
            onClick={onEditIndividualQuiz}
            style={{
              padding: '1rem',
              backgroundColor: '#1f2937',
              color: '#fff',
              border: `2px solid ${branding.primaryColor}`,
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Edit size={20} /> Bewerk Persoonlijke Quiz
          </button>
        </div>

        {/* Setup Components */}
        <div style={{
          display: 'grid',
          gap: '2rem'
        }}>
          <TeamSetup
            config={config}
            branding={branding}
            onConfigChange={onConfigChange}
          />

          <StationSetup
            config={config}
            branding={branding}
            onConfigChange={onConfigChange}
          />

          <RouteSetup
            config={config}
            branding={branding}
            onConfigChange={onConfigChange}
          />
        </div>
      </div>
    </div>
  );
}