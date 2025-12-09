import { X, Copy, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import type { Branding } from '../types/game';

interface ShareGameModalProps {
  gameCode: string;
  branding: Branding;
  onClose: () => void;
}

export function ShareGameModal({ gameCode, branding, onClose }: ShareGameModalProps) {
  const [copied, setCopied] = useState(false);
  
  const baseUrl = window.location.origin;
  const playerUrl = `${baseUrl}/play?code=${gameCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(playerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#1f2937',
        borderRadius: '1rem',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        maxWidth: '500px',
        width: '100%',
        position: 'relative',
        border: `3px solid ${branding.primaryColor}`
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          <X size={24} />
        </button>

        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <Share2 
            size={48} 
            style={{ 
              color: branding.primaryColor,
              margin: '0 auto 1rem'
            }} 
          />
          <h2 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 900,
            fontFamily: branding.headerFont,
            color: branding.primaryColor,
            marginBottom: '0.5rem'
          }}>
            Deel Spel met Spelers
          </h2>
          <p style={{
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
            color: '#9ca3af'
          }}>
            Scan de QR code of deel de link
          </p>
        </div>

        {/* QR Code */}
        <div style={{
          backgroundColor: '#fff',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <QRCodeSVG 
            value={playerUrl} 
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Game Code */}
        <div style={{
          backgroundColor: '#374151',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
            color: '#9ca3af',
            marginBottom: '0.5rem'
          }}>
            Spelcode
          </p>
          <p style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 900,
            fontFamily: 'monospace',
            color: branding.primaryColor,
            letterSpacing: '0.1em'
          }}>
            {gameCode}
          </p>
        </div>

        {/* URL Copy */}
        <div style={{
          backgroundColor: '#374151',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
            color: '#9ca3af',
            marginBottom: '0.5rem'
          }}>
            Link voor spelers
          </p>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={playerUrl}
              readOnly
              style={{
                flex: 1,
                backgroundColor: '#4B5563',
                color: '#fff',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={copyToClipboard}
              style={{
                backgroundColor: copied ? '#22c55e' : branding.primaryColor,
                color: copied ? '#fff' : branding.secondaryColor,
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                fontWeight: 'bold',
                transition: 'all 0.3s'
              }}
            >
              <Copy size={16} />
              {copied ? '✓' : 'Kopieer'}
            </button>
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          borderRadius: '0.5rem',
          padding: '1rem',
          border: '1px solid rgba(251, 191, 36, 0.3)'
        }}>
          <p style={{
            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            color: '#fbbf24',
            lineHeight: 1.5
          }}>
            <strong>💡 Tip:</strong> Spelers kunnen de QR code scannen of de spelcode <strong>{gameCode}</strong> invoeren op hun telefoon
          </p>
        </div>
      </div>
    </div>
  );
}