import { useState } from 'react';
import { X } from 'lucide-react';
import type { Branding } from '../types/game';

interface CreateGameModalProps {
  branding: Branding;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function CreateGameModal({ branding, onConfirm, onCancel }: CreateGameModalProps) {
  const [gameName, setGameName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameName.trim()) {
      onConfirm(gameName.trim());
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '1rem',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        border: `3px solid ${branding.primaryColor}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            fontFamily: branding.headerFont,
            color: branding.primaryColor
          }}>
            Nieuw Spel Aanmaken
          </h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{
            display: 'block',
            fontSize: '1rem',
            fontWeight: 'bold',
            color: '#d1d5db',
            marginBottom: '0.5rem'
          }}>
            Spel Naam
          </label>
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Bijv. Moord op de Maashorst"
            autoFocus
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              borderRadius: '0.5rem',
              border: '2px solid #374151',
              backgroundColor: '#374151',
              color: '#fff',
              marginBottom: '1.5rem'
            }}
          />

          <div style={{
            display: 'flex',
            gap: '1rem'
          }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '0.5rem',
                border: '2px solid #4B5563',
                backgroundColor: '#374151',
                color: '#9ca3af',
                cursor: 'pointer'
              }}
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={!gameName.trim()}
              style={{
                flex: 1,
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: gameName.trim() ? branding.primaryColor : '#4B5563',
                color: gameName.trim() ? branding.secondaryColor : '#9ca3af',
                cursor: gameName.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
