import { Save, X } from 'lucide-react';
import { useState } from 'react';
import type { Branding } from '../types/game';

interface BrandingViewProps {
  initialBranding: Branding;
  onBack: () => void;
  onSave: (branding: Branding) => void;
}

export function BrandingView({ initialBranding, onBack, onSave }: BrandingViewProps) {
  const [branding, setBranding] = useState(initialBranding);

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setBranding({ ...branding, logoUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleFontUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
      setBranding({
        ...branding,
        customFontUrl: e.target?.result as string,
        customFontName: fontName,
        headerFont: fontName
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={container(branding)}>
      {branding.customFontUrl && (
        <style>{`@font-face { font-family: '${branding.customFontName}'; src: url('${branding.customFontUrl}'); }`}</style>
      )}

      <button onClick={onBack} style={backBtn(branding)}>← Terug</button>

      <h2 style={title(branding)}>BRANDING</h2>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={card()}>
          <label style={label(branding)}>Logo</label>
          <div style={uploadBox()}>
            {branding.logoUrl ? (
              <div>
                <img
                  src={branding.logoUrl}
                  alt="Logo"
                  style={{ maxHeight: '12rem', margin: '0 auto 1rem', objectFit: 'contain', display: 'block' }}
                />
                <button
                  onClick={() => setBranding({ ...branding, logoUrl: '' })}
                  style={deleteBtn()}
                >
                  <X size={16} /> Verwijder
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📷</div>
                <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>Upload logo</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              style={{ display: 'none' }}
              id="logo-upload"
            />
            <label htmlFor="logo-upload" style={uploadLabel(branding)}>
              Upload Logo
            </label>
          </div>
        </div>

        <div style={card()}>
          <label style={label(branding)}>Bedrijfsnaam</label>
          <input
            type="text"
            value={branding.companyName}
            onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
            style={input()}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={card()}>
            <label style={label(branding)}>Primaire Kleur</label>
            <input
              type="color"
              value={branding.primaryColor}
              onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
              style={colorInput()}
            />
          </div>
          <div style={card()}>
            <label style={label(branding)}>Secundaire Kleur</label>
            <input
              type="color"
              value={branding.secondaryColor}
              onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
              style={colorInput()}
            />
          </div>
        </div>

        <div style={card()}>
          <label style={label(branding)}>Custom Font (.ttf, .otf, .woff)</label>
          <div style={uploadBox()}>
            {branding.customFontUrl ? (
              <div>
                <p style={{ color: '#22c55e', marginBottom: '0.5rem' }}>✓ {branding.customFontName}</p>
                <button
                  onClick={() =>
                    setBranding({
                      ...branding,
                      customFontUrl: '',
                      customFontName: '',
                      headerFont: 'system-ui'
                    })
                  }
                  style={deleteBtn()}
                >
                  <X size={16} /> Verwijder
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', fontSize: '3rem', marginBottom: '0.5rem' }}>🔤</div>
            )}
            <input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              onChange={(e) => e.target.files?.[0] && handleFontUpload(e.target.files[0])}
              style={{ display: 'none' }}
              id="font-upload"
            />
            <label htmlFor="font-upload" style={uploadLabel(branding)}>
              Upload Font
            </label>
          </div>
        </div>

        <button onClick={() => onSave(branding)} style={btn(branding)}>
          <Save size={20} /> OPSLAAN
        </button>
      </div>
    </div>
  );
}

const container = (branding: Branding) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
  color: '#fff',
  padding: '1rem',
  fontFamily: branding.bodyFont
});

const backBtn = (branding: Branding) => ({
  background: 'none',
  border: 'none',
  color: branding.primaryColor,
  fontSize: 'clamp(1rem, 3vw, 1.25rem)',
  fontFamily: branding.headerFont,
  cursor: 'pointer',
  marginBottom: '1rem',
  padding: '0.5rem'
});

const title = (branding: Branding) => ({
  fontSize: 'clamp(2rem, 6vw, 3rem)',
  fontWeight: 900,
  fontFamily: branding.headerFont,
  marginBottom: '1.5rem',
  color: branding.primaryColor
});

const card = () => ({
  backgroundColor: '#1f2937',
  borderRadius: '0.75rem',
  padding: 'clamp(1rem, 3vw, 1.5rem)',
  marginBottom: '1rem'
});

const label = (branding: Branding) => ({
  display: 'block',
  marginBottom: '0.75rem',
  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
  fontWeight: 'bold',
  fontFamily: branding.headerFont,
  color: branding.primaryColor
});

const uploadBox = () => ({
  border: '2px dashed #4B5563',
  borderRadius: '0.5rem',
  padding: 'clamp(1.5rem, 4vw, 2rem)',
  textAlign: 'center' as const
});

const deleteBtn = () => ({
  background: 'none',
  border: 'none',
  color: '#ef4444',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  margin: '0 auto',
  fontSize: 'clamp(0.875rem, 2vw, 1rem)'
});

const uploadLabel = (branding: Branding) => ({
  backgroundColor: branding.primaryColor,
  color: branding.secondaryColor,
  padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
  fontWeight: 'bold',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  display: 'inline-block',
  marginTop: '0.5rem'
});

const input = () => ({
  width: '100%',
  backgroundColor: '#374151',
  color: '#fff',
  padding: 'clamp(0.75rem, 2vw, 1rem)',
  borderRadius: '0.5rem',
  border: '2px solid #4B5563',
  fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
  fontWeight: 'bold'
});

const colorInput = () => ({
  width: '100%',
  height: 'clamp(4rem, 12vw, 5rem)',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  border: 'none'
});

const btn = (branding: Branding) => ({
  backgroundColor: branding.primaryColor,
  color: branding.secondaryColor,
  padding: 'clamp(1rem, 3vw, 1.5rem)',
  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
  fontWeight: 'bold' as const,
  borderRadius: '0.75rem',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  width: '100%',
  transition: 'all 0.3s'
});
