import { useState } from 'react';
import { Save, Plus, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';
import type { Branding, GameConfig, Station, Team } from '../types/game';

interface SetupViewProps {
  branding: Branding;
  initialConfig: GameConfig | null;
  onBack: () => void;
  onSave: (config: GameConfig) => void;
  onNavigateToQuiz: () => void;
}

export function SetupView({ branding, initialConfig, onBack, onSave, onNavigateToQuiz }: SetupViewProps) {
  const [config, setConfig] = useState<GameConfig>(initialConfig || {
    gameName: '',
    numStations: 8,
    numTeams: 5,
    stationDuration: 15,
    pauseDuration: 15,
    pauseAfterRound: 4,
    stations: [],
    teams: [],
    routes: {},
    teamQuiz: [],
    individualQuiz: []
  });

  const generateStations = () => {
    const stations: Station[] = [];
    for (let i = 0; i < config.numStations; i++) {
      stations.push({
        id: `${i + 1}`,
        name: `Station ${i + 1}`,
        type: 'manned',
        taskAnswer: '',
        location: '',
        mapUrl: ''
      });
    }
    setConfig(prev => ({ 
      ...prev, 
      stations,
      pauseAfterRound: Math.floor(config.numStations / 2) // Auto-suggest halfway
    }));
  };

  const generateTeams = () => {
    const teams: Team[] = [];
    const routes: { [key: string]: string[] } = {};
    const colors = ['#FFB800', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#A8E6CF', '#FFD3B6', '#FFAAA5', '#FF8B94', '#C7CEEA'];

    for (let i = 0; i < config.numTeams; i++) {
      const teamId = `team${i + 1}`;
      teams.push({
        id: teamId,
        name: `Team ${i + 1}`,
        captain: '',
        members: [],
        color: colors[i % colors.length],
        score: 0
      });

      // Generate circular route
      const route: string[] = [];
      for (let j = 0; j < config.stations.length; j++) {
        route.push(config.stations[(i + j) % config.stations.length].id);
      }
      routes[teamId] = route;
    }

    setConfig(prev => ({ ...prev, teams, routes }));
  };

  const updateStation = (index: number, field: keyof Station, value: any) => {
    const updated = [...config.stations];
    updated[index] = { ...updated[index], [field]: value };
    setConfig(prev => ({ ...prev, stations: updated }));
  };

  const moveStation = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === config.stations.length - 1)
    ) return;

    const updated = [...config.stations];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    // Update IDs to match new positions
    updated.forEach((station, i) => {
      station.id = `${i + 1}`;
    });

    setConfig(prev => ({ ...prev, stations: updated }));
  };

  const deleteStation = (index: number) => {
    if (!confirm('Weet je zeker dat je dit station wilt verwijderen?')) return;
    
    const updated = config.stations.filter((_, i) => i !== index);
    // Update IDs
    updated.forEach((station, i) => {
      station.id = `${i + 1}`;
    });
    
    setConfig(prev => ({ 
      ...prev, 
      stations: updated,
      numStations: updated.length
    }));
  };

  const addStation = () => {
    const newStation: Station = {
      id: `${config.stations.length + 1}`,
      name: `Station ${config.stations.length + 1}`,
      type: 'manned',
      taskAnswer: '',
      location: '',
      mapUrl: ''
    };
    
    setConfig(prev => ({
      ...prev,
      stations: [...prev.stations, newStation],
      numStations: prev.stations.length + 1
    }));
  };

  const updateTeam = (index: number, field: keyof Team, value: any) => {
    const updated = [...config.teams];
    updated[index] = { ...updated[index], [field]: value };
    setConfig(prev => ({ ...prev, teams: updated }));
  };

  const handleMapUpload = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      updateStation(index, 'mapUrl', e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!config.gameName) {
      alert('Vul een spelnaam in!');
      return;
    }
    if (config.stations.length === 0) {
      alert('Genereer eerst stations!');
      return;
    }
    if (config.teams.length === 0) {
      alert('Genereer eerst teams!');
      return;
    }
    
    onSave(config);
    alert('✓ Spel opgeslagen!');
  };

  const getTeamRoute = (teamId: string): string[] => {
    const route = config.routes[teamId] || [];
    const pauseIndex = config.pauseAfterRound;
    
    if (pauseIndex && pauseIndex > 0 && pauseIndex <= route.length) {
      const routeWithPause = [...route];
      routeWithPause.splice(pauseIndex, 0, 'PAUZE');
      return routeWithPause;
    }
    
    return route;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)',
      color: '#fff',
      padding: 'clamp(1rem, 3vw, 2rem)',
      fontFamily: branding.bodyFont
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
          marginBottom: '1rem',
          padding: '0.5rem'
        }}
      >
        ← Terug
      </button>

      <h2 style={{
        fontSize: 'clamp(2rem, 6vw, 3rem)',
        fontWeight: 900,
        fontFamily: branding.headerFont,
        marginBottom: '1.5rem',
        color: branding.primaryColor
      }}>
        SPEL SETUP
      </h2>

      <div style={{ maxWidth: '1200px' }}>
        {/* Quiz Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <button
            onClick={onNavigateToQuiz}
            style={{
              backgroundColor: '#1f2937',
              borderRadius: '0.75rem',
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', fontWeight: 'bold', fontFamily: branding.headerFont, color: branding.primaryColor }}>
                👥 Team Quiz
              </h3>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                fontWeight: 'bold',
                backgroundColor: config.teamQuiz.length > 0 ? '#22c55e' : '#4B5563',
                color: '#fff'
              }}>
                {config.teamQuiz.length} vragen
              </span>
            </div>
            <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>
              Klik om te bewerken
            </p>
          </button>

          <button
            onClick={onNavigateToQuiz}
            style={{
              backgroundColor: '#1f2937',
              borderRadius: '0.75rem',
              padding: 'clamp(1rem, 3vw, 1.5rem)',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', fontWeight: 'bold', fontFamily: branding.headerFont, color: branding.primaryColor }}>
                👤 Individuele Quiz
              </h3>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                fontWeight: 'bold',
                backgroundColor: config.individualQuiz.length > 0 ? '#22c55e' : '#4B5563',
                color: '#fff'
              }}>
                {config.individualQuiz.length} vragen
              </span>
            </div>
            <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>
              Klik om te bewerken
            </p>
          </button>
        </div>

        {/* Basic Settings */}
        <div style={{ backgroundColor: '#1f2937', borderRadius: '0.75rem', padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 'bold', fontFamily: branding.headerFont, marginBottom: '1rem' }}>
            Basis Instellingen
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'clamp(0.875rem, 2vw, 1rem)', fontFamily: branding.headerFont, color: branding.primaryColor }}>
                Spel Naam *
              </label>
              <input
                type="text"
                value={config.gameName}
                onChange={(e) => setConfig(prev => ({ ...prev, gameName: e.target.value }))}
                style={{
                  width: '100%',
                  backgroundColor: '#374151',
                  color: '#fff',
                  padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                  borderRadius: '0.5rem',
                  border: '2px solid #4B5563',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                }}
                placeholder="Bijv. Moord op de Maashorst"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'clamp(0.875rem, 2vw, 1rem)', fontFamily: branding.headerFont, color: branding.primaryColor }}>
                Aantal Stations
              </label>
              <input
                type="number"
                value={config.numStations}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  numStations: parseInt(e.target.value) || 1,
                  pauseAfterRound: Math.floor((parseInt(e.target.value) || 1) / 2)
                }))}
                style={{
                  width: '100%',
                  backgroundColor: '#374151',
                  color: '#fff',
                  padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                  borderRadius: '0.5rem',
                  border: '2px solid #4B5563',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                }}
                min="1"
                max="20"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'clamp(0.875rem, 2vw, 1rem)', fontFamily: branding.headerFont, color: branding.primaryColor }}>
                Aantal Teams
              </label>
              <input
                type="number"
                value={config.numTeams}
                onChange={(e) => setConfig(prev => ({ ...prev, numTeams: parseInt(e.target.value) || 1 }))}
                style={{
                  width: '100%',
                  backgroundColor: '#374151',
                  color: '#fff',
                  padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                  borderRadius: '0.5rem',
                  border: '2px solid #4B5563',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                }}
                min="1"
                max="10"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'clamp(0.875rem, 2vw, 1rem)', fontFamily: branding.headerFont, color: branding.primaryColor }}>
                Tijd/Station (min)
              </label>
              <input
                type="number"
                value={config.stationDuration}
                onChange={(e) => setConfig(prev => ({ ...prev, stationDuration: parseInt(e.target.value) || 1 }))}
                style={{
                  width: '100%',
                  backgroundColor: '#374151',
                  color: '#fff',
                  padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                  borderRadius: '0.5rem',
                  border: '2px solid #4B5563',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                }}
                min="5"
                max="60"
              />
            </div>
          </div>

          {/* PAUZE CONFIGURATIE - NIEUW */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #374151' }}>
            <h4 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', fontWeight: 'bold', fontFamily: branding.headerFont, color: branding.primaryColor, marginBottom: '1rem' }}>
              ☕ Pauze Instellingen
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'clamp(0.875rem, 2vw, 1rem)', fontFamily: branding.headerFont, color: branding.primaryColor }}>
                  Pauze na ronde
                </label>
                <input
                  type="number"
                  value={config.pauseAfterRound}
                  onChange={(e) => setConfig(prev => ({ ...prev, pauseAfterRound: parseInt(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    backgroundColor: '#374151',
                    color: '#fff',
                    padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                    borderRadius: '0.5rem',
                    border: '2px solid #4B5563',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                  }}
                  min="0"
                  max={config.numStations}
                />
                <p style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)', color: '#9ca3af', marginTop: '0.25rem' }}>
                  {config.pauseAfterRound === 0 ? 'Geen pauze' : `Pauze na station ${config.pauseAfterRound}`}
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'clamp(0.875rem, 2vw, 1rem)', fontFamily: branding.headerFont, color: branding.primaryColor }}>
                  Pauze duur (min)
                </label>
                <input
                  type="number"
                  value={config.pauseDuration}
                  onChange={(e) => setConfig(prev => ({ ...prev, pauseDuration: parseInt(e.target.value) || 1 }))}
                  style={{
                    width: '100%',
                    backgroundColor: '#374151',
                    color: '#fff',
                    padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                    borderRadius: '0.5rem',
                    border: '2px solid #4B5563',
                    fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                  }}
                  min="5"
                  max="60"
                  disabled={config.pauseAfterRound === 0}
                />
              </div>
            </div>
          </div>

          <button
            onClick={generateStations}
            style={{
              backgroundColor: branding.primaryColor,
              color: branding.secondaryColor,
              padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
              fontSize: 'clamp(0.875rem, 2vw, 1rem)',
              fontWeight: 'bold',
              fontFamily: branding.headerFont,
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              marginTop: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Genereer Stations
          </button>
        </div>

        {/* Stations Configuration */}
        {config.stations.length > 0 && (
          <div style={{ backgroundColor: '#1f2937', borderRadius: '0.75rem', padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 'bold', fontFamily: branding.headerFont }}>
                Stations ({config.stations.length})
              </h3>
              <button
                onClick={addStation}
                style={{
                  backgroundColor: '#22c55e',
                  color: '#fff',
                  padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                  fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                  fontWeight: 'bold',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Plus size={16} /> Station Toevoegen
              </button>
            </div>

            {config.stations.map((station, index) => (
              <div
                key={station.id}
                style={{
                  backgroundColor: '#374151',
                  borderRadius: '0.75rem',
                  padding: 'clamp(0.75rem, 2vw, 1rem)',
                  marginBottom: '1rem'
                }}
              >
                {/* Header met ID en Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, color: branding.primaryColor }}>
                      {station.id}
                    </span>
                    <input
                      type="text"
                      value={station.name}
                      onChange={(e) => updateStation(index, 'name', e.target.value)}
                      style={{
                        backgroundColor: '#1f2937',
                        color: '#fff',
                        padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                        borderRadius: '0.5rem',
                        border: '2px solid #4B5563',
                        fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                        fontWeight: 'bold',
                        flex: 1,
                        minWidth: 0
                      }}
                    />
                  </div>

                  {/* Up/Down/Delete Controls */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => moveStation(index, 'up')}
                      disabled={index === 0}
                      style={{
                        backgroundColor: index === 0 ? '#4B5563' : '#6366f1',
                        color: '#fff',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: index === 0 ? 0.5 : 1
                      }}
                      title="Omhoog"
                    >
                      <ChevronUp size={20} />
                    </button>

                    <button
                      onClick={() => moveStation(index, 'down')}
                      disabled={index === config.stations.length - 1}
                      style={{
                        backgroundColor: index === config.stations.length - 1 ? '#4B5563' : '#6366f1',
                        color: '#fff',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: index === config.stations.length - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: index === config.stations.length - 1 ? 0.5 : 1
                      }}
                      title="Omlaag"
                    >
                      <ChevronDown size={20} />
                    </button>

                    <button
                      onClick={() => deleteStation(index)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Verwijder"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {/* Type Selector */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>
                    Type
                  </label>
                  <select
                    value={station.type}
                    onChange={(e) => updateStation(index, 'type', e.target.value as 'manned' | 'task')}
                    style={{
                      width: '100%',
                      backgroundColor: '#1f2937',
                      color: '#fff',
                      padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                      borderRadius: '0.5rem',
                      border: '2px solid #4B5563',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="manned">🎭 Bemand (met acteur)</option>
                    <option value="task">✍️ Opdracht (met antwoord)</option>
                  </select>
                </div>

                {/* Location and Answer Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: station.type === 'task' ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>
                      📍 Locatie/Plek
                    </label>
                    <input
                      type="text"
                      value={station.location || ''}
                      onChange={(e) => updateStation(index, 'location', e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1f2937',
                        color: '#fff',
                        padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                        borderRadius: '0.5rem',
                        border: '2px solid #4B5563',
                        fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                      }}
                      placeholder="Bijv. Grote tent, achter het huis"
                    />
                  </div>

                  {station.type === 'task' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>
                        ✍️ Correct Antwoord
                      </label>
                      <input
                        type="text"
                        value={station.taskAnswer || ''}
                        onChange={(e) => updateStation(index, 'taskAnswer', e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#1f2937',
                          color: '#fff',
                          padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                          borderRadius: '0.5rem',
                          border: '2px solid #4B5563',
                          fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                        }}
                        placeholder="Het juiste antwoord"
                      />
                    </div>
                  )}
                </div>

                {/* Map Upload */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>
                    🗺️ Kaart/Foto
                  </label>
                  {station.mapUrl ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={station.mapUrl}
                        alt="Kaart"
                        style={{
                          width: '100%',
                          maxHeight: '12rem',
                          objectFit: 'contain',
                          borderRadius: '0.5rem',
                          backgroundColor: '#1f2937'
                        }}
                      />
                      <button
                        onClick={() => updateStation(index, 'mapUrl', '')}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          padding: '0.5rem',
                          borderRadius: '0.25rem',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <X size={16} /> Verwijder
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleMapUpload(index, e.target.files[0])}
                        style={{ display: 'none' }}
                        id={`map-upload-${index}`}
                      />
                      <label
                        htmlFor={`map-upload-${index}`}
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#4B5563',
                          color: '#fff',
                          padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)',
                          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                          fontWeight: 'bold',
                          borderRadius: '0.5rem',
                          cursor: 'pointer'
                        }}
                      >
                        📷 Upload Kaart
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={generateTeams}
              style={{
                backgroundColor: branding.primaryColor,
                color: branding.secondaryColor,
                padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem)',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                fontWeight: 'bold',
                fontFamily: branding.headerFont,
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                marginTop: '0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Genereer Teams & Routes
            </button>
          </div>
        )}

        {/* Teams Configuration with Route Preview */}
        {config.teams.length > 0 && (
          <div style={{ backgroundColor: '#1f2937', borderRadius: '0.75rem', padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 'bold', fontFamily: branding.headerFont, marginBottom: '1rem' }}>
              Teams & Routes ({config.teams.length})
            </h3>

            {config.teams.map((team, index) => (
              <div
                key={team.id}
                style={{
                  backgroundColor: '#374151',
                  borderRadius: '0.75rem',
                  padding: 'clamp(0.75rem, 2vw, 1rem)',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: 'clamp(2rem, 5vw, 2.5rem)',
                      height: 'clamp(2rem, 5vw, 2.5rem)',
                      borderRadius: '50%',
                      backgroundColor: team.color
                    }}
                  />
                  <input
                    type="text"
                    value={team.name}
                    onChange={(e) => updateTeam(index, 'name', e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: '#1f2937',
                      color: '#fff',
                      padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                      borderRadius: '0.5rem',
                      border: '2px solid #4B5563',
                      fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                      fontWeight: 'bold'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>
                      👤 Captain
                    </label>
                    <input
                      type="text"
                      value={team.captain || ''}
                      onChange={(e) => updateTeam(index, 'captain', e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#1f2937',
                        color: '#fff',
                        padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                        borderRadius: '0.5rem',
                        border: '2px solid #4B5563',
                        fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                      }}
                      placeholder="Naam"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', color: '#9ca3af' }}>
                      👥 Aantal Leden
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      placeholder="Bijv. 6"
                      style={{
                        width: '100%',
                        backgroundColor: '#1f2937',
                        color: '#fff',
                        padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                        borderRadius: '0.5rem',
                        border: '2px solid #4B5563',
                        fontSize: 'clamp(0.875rem, 2vw, 1rem)'
                      }}
                    />
                  </div>
                </div>

                {/* Route Preview */}
                <div style={{ backgroundColor: '#1f2937', borderRadius: '0.5rem', padding: 'clamp(0.75rem, 2vw, 1rem)' }}>
                  <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', fontWeight: 'bold', color: branding.primaryColor, marginBottom: '0.5rem' }}>
                    🗺️ Route:
                  </div>
                  <div style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: '#d1d5db', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    {getTeamRoute(team.id).map((stationId, i) => (
                      <span key={i}>
                        {stationId === 'PAUZE' ? (
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            backgroundColor: '#fbbf24', 
                            color: '#000', 
                            borderRadius: '0.25rem', 
                            fontWeight: 'bold',
                            fontSize: 'clamp(0.75rem, 2vw, 0.875rem)'
                          }}>
                            ☕ PAUZE
                          </span>
                        ) : (
                          <span style={{ fontWeight: 'bold', color: branding.primaryColor }}>
                            {stationId}
                          </span>
                        )}
                        {i < getTeamRoute(team.id).length - 1 && ' → '}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        {config.stations.length > 0 && config.teams.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              onClick={handleSave}
              style={{
                backgroundColor: branding.primaryColor,
                color: branding.secondaryColor,
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                fontWeight: 'bold',
                fontFamily: branding.headerFont,
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}
            >
              <Save size={24} /> OPSLAAN & NAAR HOME
            </button>
          </div>
        )}
      </div>
    </div>
  );
}