import React, { useState, useEffect } from 'react';
import { Bell, Play, Users, Settings, Clock, Save, Map, Plus, Trash2, X } from 'lucide-react';

const FLDGameMaster = () => {
  const [view, setView] = useState('home');
  const [branding, setBranding] = useState(() => {
    const saved = localStorage.getItem('fld-branding');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {
      logoUrl: '', companyName: 'FUN LOVING DETECTIVES',
      primaryColor: '#FFB800', secondaryColor: '#000000',
      fontFamily: 'system-ui', customFontUrl: '', customFontName: ''
    };
  });
  
  const [gameConfig, setGameConfig] = useState({
    gameName: '', numStations: 8, numTeams: 5,
    stationDuration: 15, pauseDuration: 15, pauseAfterRound: 4,
    stations: [], teams: [], routes: {},
    teamQuiz: [], individualQuiz: []
  });
  
  const [gameState, setGameState] = useState({
    isRunning: false, currentRound: 0, isPaused: false, timeRemaining: 0,
    teamQuizUnlocked: false, personalQuizUnlocked: false, scoresRevealed: false,
    teamQuizSubmissions: {}, individualQuizSubmissions: []
  });
  
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [savedGames, setSavedGames] = useState([]);
  const [gameId] = useState(() => Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    const saved = localStorage.getItem('fld-saved-games');
    if (saved) { try { setSavedGames(JSON.parse(saved)); } catch (e) { } }
  }, []);

  const saveGame = (name) => {
    const game = { ...gameConfig, branding, gameName: name || gameConfig.gameName || 'Naamloos', savedAt: new Date().toISOString() };
    const updated = [...savedGames.filter(g => g.gameName !== game.gameName), game];
    setSavedGames(updated);
    localStorage.setItem('fld-saved-games', JSON.stringify(updated));
    alert(`✓ "${game.gameName}" opgeslagen!`);
  };

  const loadGame = (game) => {
    setGameConfig(game);
    if (game.branding) {
      setBranding(game.branding);
      localStorage.setItem('fld-branding', JSON.stringify(game.branding));
    }
    alert(`✓ "${game.gameName}" geladen!`);
  };

  const deleteGame = (name) => {
    if (confirm(`Verwijder "${name}"?`)) {
      const updated = savedGames.filter(g => g.gameName !== name);
      setSavedGames(updated);
      localStorage.setItem('fld-saved-games', JSON.stringify(updated));
    }
  };

  const exportGame = () => {
    const data = JSON.stringify({ branding, gameConfig, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${gameConfig.gameName || 'fld-game'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importGame = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.branding) { setBranding(data.branding); localStorage.setItem('fld-branding', JSON.stringify(data.branding)); }
          if (data.gameConfig) setGameConfig(data.gameConfig);
          alert('✓ Geïmporteerd!');
        } catch { alert('❌ Fout bij importeren'); }
      };
      reader.readAsText(file);
    }
  };

  const startGame = () => {
    const subs = {};
    gameConfig.teams.forEach(t => { subs[t.id] = { answers: new Array(gameConfig.teamQuiz.length).fill(''), score: 0, submitted: false }; });
    setGameState({
      isRunning: true, currentRound: 0, isPaused: false, timeRemaining: gameConfig.stationDuration * 60,
      teamQuizUnlocked: false, personalQuizUnlocked: false, scoresRevealed: false,
      teamQuizSubmissions: subs, individualQuizSubmissions: []
    });
    setView('control');
  };

  const nextRound = () => {
    const next = gameState.currentRound + 1;
    const pauseIdx = gameConfig.pauseAfterRound || Math.floor(gameConfig.stations.length / 2);
    const isPause = next === pauseIdx;
    setGameState(p => ({ ...p, currentRound: next, timeRemaining: (isPause ? gameConfig.pauseDuration : gameConfig.stationDuration) * 60, isPaused: isPause }));
  };

  // Styles
  const s = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a1a, #000, #1a1a1a)', color: '#fff', padding: '2rem', fontFamily: branding.fontFamily },
    btn: (primary, small) => ({
      backgroundColor: primary ? branding.primaryColor : '#374151', color: primary ? branding.secondaryColor : '#fff',
      padding: small ? '0.75rem 1.5rem' : (primary ? '2rem 3rem' : '1.5rem 2rem'),
      fontSize: small ? '1rem' : (primary ? '1.5rem' : '1.25rem'), fontWeight: 'bold',
      borderRadius: small ? '0.5rem' : '1rem', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
      width: '100%', transition: 'all 0.3s', marginBottom: small ? '0.5rem' : '1.5rem'
    }),
    input: { width: '100%', backgroundColor: '#374151', color: '#fff', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #4B5563', fontSize: '1rem' },
    card: { backgroundColor: '#1f2937', borderRadius: '1rem', padding: '2rem', marginBottom: '1.5rem' }
  };

  const HomeView = () => (
    <div style={s.container}>
      {branding.customFontUrl && <style>{`@font-face { font-family: '${branding.customFontName}'; src: url('${branding.customFontUrl}'); }`}</style>}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" style={{ maxHeight: '12rem', margin: '0 auto 1.5rem', display: 'block', objectFit: 'contain' }} />}
        <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '0.5rem', fontStyle: 'italic', color: branding.primaryColor, letterSpacing: '2px' }}>{branding.companyName}</h1>
        <p style={{ fontSize: '1.5rem', color: branding.primaryColor, fontWeight: 600 }}>Game Master Control</p>
      </div>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button onClick={() => setView('branding')} style={s.btn()}><Settings size={24} /> BRANDING AANPASSEN</button>
        <button onClick={() => setView('setup')} style={s.btn(true)}><Settings size={32} /> NIEUW SPEL INSTELLEN</button>
        {savedGames.length > 0 && <button onClick={() => setView('load')} style={{ ...s.btn(), backgroundColor: '#2563eb' }}>📁 LAAD SPEL ({savedGames.length})</button>}
        {gameConfig.stations.length > 0 && (
          <>
            <button onClick={startGame} style={{ ...s.btn(), backgroundColor: '#22c55e' }}><Play size={32} /> START SPEL</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <button onClick={exportGame} style={{ ...s.btn(false, true), backgroundColor: '#7c3aed', marginBottom: 0 }}>💾 EXPORT</button>
              <label style={{ ...s.btn(false, true), backgroundColor: '#7c3aed', marginBottom: 0 }}>📂 IMPORT<input type="file" accept=".json" onChange={importGame} style={{ display: 'none' }} /></label>
            </div>
          </>
        )}
        <button onClick={() => setView('team')} style={s.btn()}><Users size={24} /> TEAM WEERGAVE</button>
      </div>
    </div>
  );

  const BrandingView = () => {
    const [local, setLocal] = useState(branding);
    const save = () => { setBranding(local); localStorage.setItem('fld-branding', JSON.stringify(local)); alert('✓ Opgeslagen!'); setView('home'); };
    
    return (
      <div style={s.container}>
        <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', color: branding.primaryColor, fontSize: '1.25rem', cursor: 'pointer', marginBottom: '1.5rem' }}>← Terug</button>
        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', color: branding.primaryColor }}>BRANDING</h2>
        <div style={{ maxWidth: '800px' }}>
          <div style={s.card}>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold', color: branding.primaryColor }}>Logo</label>
            <div style={{ border: '2px dashed #4B5563', borderRadius: '0.5rem', padding: '2rem', textAlign: 'center' }}>
              {local.logoUrl ? (
                <div><img src={local.logoUrl} alt="Logo" style={{ maxHeight: '12rem', margin: '0 auto 1rem', objectFit: 'contain' }} />
                <button onClick={() => setLocal(p => ({ ...p, logoUrl: '' }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Verwijder</button></div>
              ) : <div><div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📷</div><p style={{ color: '#9ca3af', marginBottom: '1rem' }}>Upload logo</p></div>}
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setLocal(p => ({ ...p, logoUrl: ev.target.result })); r.readAsDataURL(f); }}} style={{ display: 'none' }} id="logo-up" />
              <label htmlFor="logo-up" style={{ ...s.btn(true, true), width: 'auto', display: 'inline-flex' }}>Upload Logo</label>
            </div>
          </div>
          <div style={s.card}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: branding.primaryColor }}>Bedrijfsnaam</label>
            <input type="text" value={local.companyName} onChange={e => setLocal(p => ({ ...p, companyName: e.target.value }))} style={{ ...s.input, fontSize: '1.5rem', fontWeight: 'bold' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={s.card}><label style={{ display: 'block', marginBottom: '0.5rem', color: branding.primaryColor }}>Primaire Kleur</label>
            <input type="color" value={local.primaryColor} onChange={e => setLocal(p => ({ ...p, primaryColor: e.target.value }))} style={{ width: '100%', height: '5rem', borderRadius: '0.5rem', cursor: 'pointer', border: 'none' }} /></div>
            <div style={s.card}><label style={{ display: 'block', marginBottom: '0.5rem', color: branding.primaryColor }}>Secundaire Kleur</label>
            <input type="color" value={local.secondaryColor} onChange={e => setLocal(p => ({ ...p, secondaryColor: e.target.value }))} style={{ width: '100%', height: '5rem', borderRadius: '0.5rem', cursor: 'pointer', border: 'none' }} /></div>
          </div>
          <div style={s.card}>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold', color: branding.primaryColor }}>Font (.ttf, .otf, .woff)</label>
            <div style={{ border: '2px dashed #4B5563', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center' }}>
              {local.customFontUrl ? (
                <div><p style={{ color: '#22c55e', marginBottom: '0.5rem' }}>✓ {local.customFontName}</p>
                <button onClick={() => setLocal(p => ({ ...p, customFontUrl: '', customFontName: '', fontFamily: 'system-ui' }))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Verwijder</button></div>
              ) : <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔤</div>}
              <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={(e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => { const n = f.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, ''); setLocal(p => ({ ...p, customFontUrl: ev.target.result, customFontName: n, fontFamily: n })); }; r.readAsDataURL(f); }}} style={{ display: 'none' }} id="font-up" />
              <label htmlFor="font-up" style={{ ...s.btn(true, true), display: 'inline-flex', width: 'auto', marginTop: '1rem' }}>Upload Font</label>
            </div>
          </div>
          <button onClick={save} style={s.btn(true)}><Save size={28} /> OPSLAAN</button>
        </div>
      </div>
    );
  };

  const QuizView = () => {
    const [type, setType] = useState('team');
    const [quiz, setQuiz] = useState(type === 'team' ? gameConfig.teamQuiz : gameConfig.individualQuiz);
    
    useEffect(() => { setQuiz(type === 'team' ? gameConfig.teamQuiz : gameConfig.individualQuiz); }, [type]);
    
    const add = () => setQuiz([...quiz, { question: '', type: 'open', correctAnswer: '', options: ['','','',''], imageUrl: '', points: 10 }]);
    const remove = i => setQuiz(quiz.filter((_, idx) => idx !== i));
    const update = (i, field, val) => { const u = [...quiz]; u[i][field] = val; setQuiz(u); };
    const uploadImg = (i, file) => { if (file) { const r = new FileReader(); r.onload = e => update(i, 'imageUrl', e.target.result); r.readAsDataURL(file); }};
    const save = () => {
      if (type === 'team') setGameConfig(p => ({ ...p, teamQuiz: quiz }));
      else setGameConfig(p => ({ ...p, individualQuiz: quiz }));
      alert(`✓ ${type === 'team' ? 'Team' : 'Individuele'} quiz opgeslagen (${quiz.length} vragen)`);
      setView('setup');
    };

    return (
      <div style={s.container}>
        <button onClick={() => setView('setup')} style={{ background: 'none', border: 'none', color: branding.primaryColor, fontSize: '1.25rem', cursor: 'pointer', marginBottom: '1.5rem' }}>← Setup</button>
        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', color: branding.primaryColor }}>QUIZ MAKER</h2>
        <div style={{ maxWidth: '1000px' }}>
          <div style={s.card}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button onClick={() => setType('team')} style={{ ...s.btn(type === 'team', true), flex: 1, marginBottom: 0 }}>👥 TEAM QUIZ</button>
              <button onClick={() => setType('individual')} style={{ ...s.btn(type === 'individual', true), flex: 1, marginBottom: 0 }}>👤 INDIVIDUEEL</button>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
              {type === 'team' ? '👥 Captain vult in (telt mee voor teamscore)' : '👤 Via QR, per persoon (staat los van teamscore)'}
            </p>
            {quiz.map((q, i) => (
              <div key={i} style={{ ...s.card, backgroundColor: '#374151' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: branding.primaryColor }}>Vraag {i + 1}</h4>
                  <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Trash2 size={20} /> Verwijder</button>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>Type</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => update(i, 'type', 'open')} style={{ ...s.btn(q.type === 'open', true), flex: 1, marginBottom: 0 }}>✍️ Open</button>
                    <button onClick={() => update(i, 'type', 'multiple')} style={{ ...s.btn(q.type === 'multiple', true), flex: 1, marginBottom: 0 }}>☑️ Multiple Choice</button>
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>🖼️ Afbeelding (optioneel)</label>
                  {q.imageUrl ? (
                    <div style={{ position: 'relative' }}>
                      <img src={q.imageUrl} alt="Quiz" style={{ width: '100%', maxHeight: '15rem', objectFit: 'contain', borderRadius: '0.5rem', backgroundColor: '#1f2937' }} />
                      <button onClick={() => update(i, 'imageUrl', '')} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.25rem', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><X size={16} /> Verwijder</button>
                    </div>
                  ) : (
                    <div><input type="file" accept="image/*" onChange={e => uploadImg(i, e.target.files[0])} style={{ display: 'none' }} id={`img-${i}`} />
                    <label htmlFor={`img-${i}`} style={{ ...s.btn(false, true), width: 'auto', display: 'inline-flex', marginBottom: 0 }}>📷 Upload</label></div>
                  )}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>Vraag</label>
                  <textarea value={q.question} onChange={e => update(i, 'question', e.target.value)} style={{ ...s.input, minHeight: '4rem', resize: 'vertical' }} placeholder="Typ de vraag..." />
                </div>
                {q.type === 'open' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div><label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>Antwoord</label>
                    <input type="text" value={q.correctAnswer} onChange={e => update(i, 'correctAnswer', e.target.value)} style={s.input} placeholder="Juiste antwoord" /></div>
                    <div><label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>Punten</label>
                    <input type="number" value={q.points} onChange={e => update(i, 'points', parseInt(e.target.value) || 10)} style={s.input} min="1" max="100" /></div>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.75rem', color: '#9ca3af' }}>Opties</label>
                    {[0,1,2,3].map(j => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.125rem', fontWeight: 'bold', width: '2rem' }}>{String.fromCharCode(65 + j)}.</span>
                        <input type="text" value={q.options?.[j] || ''} onChange={e => { const o = [...(q.options || ['','','',''])]; o[j] = e.target.value; update(i, 'options', o); }} style={{ ...s.input, flex: 1 }} placeholder={`Optie ${String.fromCharCode(65 + j)}`} />
                        <input type="radio" name={`c-${i}`} checked={q.correctAnswer === String.fromCharCode(65 + j)} onChange={() => update(i, 'correctAnswer', String.fromCharCode(65 + j))} style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
                        <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Correct</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '1rem' }}><label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>Punten</label>
                    <input type="number" value={q.points} onChange={e => update(i, 'points', parseInt(e.target.value) || 10)} style={{ ...s.input, width: '8rem' }} min="1" max="100" /></div>
                  </div>
                )}
              </div>
            ))}
            <button onClick={add} style={{ ...s.btn(), backgroundColor: '#374151' }}><Plus size={24} /> VOEG VRAAG TOE</button>
            <button onClick={save} style={s.btn(true)}><Save size={28} /> OPSLAAN ({quiz.length} vragen)</button>
          </div>
        </div>
      </div>
    );
  };

  const SetupView = () => {
    const [local, setLocal] = useState(gameConfig);
    const initStations = () => {
      const st = [];
      for (let i = 0; i < local.numStations; i++) st.push({ id: `${i+1}`, name: `Station ${i+1}`, type: 'manned', taskAnswer: '', location: '', mapUrl: '' });
      setLocal(p => ({ ...p, stations: st }));
    };
    const initTeams = () => {
      const tm = [], rt = {};
      for (let i = 0; i < local.numTeams; i++) {
        tm.push({ id: `team${i+1}`, name: `Team ${i+1}`, captain: '', members: [], color: ['#FFB800','#FF6B6B','#4ECDC4','#95E1D3','#F38181'][i % 5], score: 0 });
        const route = [];
        const ids = local.stations.map(s => s.id);
        for (let j = 0; j < ids.length; j++) route.push(ids[(i + j) % ids.length]);
        rt[`team${i+1}`] = route;
      }
      setLocal(p => ({ ...p, teams: tm, routes: rt }));
    };
    const save = () => { setGameConfig(local); setView('home'); };

    return (
      <div style={s.container}>
        <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', color: branding.primaryColor, fontSize: '1.25rem', cursor: 'pointer', marginBottom: '1.5rem' }}>← Terug</button>
        <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', color: branding.primaryColor }}>SETUP</h2>
        <div style={{ maxWidth: '1200px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <button onClick={() => setView('quizmaker')} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: branding.primaryColor }}>👥 Team Quiz</h3>
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 'bold', backgroundColor: gameConfig.teamQuiz.length > 0 ? '#22c55e' : '#4B5563', color: '#fff' }}>{gameConfig.teamQuiz.length} vragen</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Klik om te maken/bewerken</p>
            </button>
            <button onClick={() => setView('quizmaker')} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: branding.primaryColor }}>👤 Individuele Quiz</h3>
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 'bold', backgroundColor: gameConfig.individualQuiz.length > 0 ? '#22c55e' : '#4B5563', color: '#fff' }}>{gameConfig.individualQuiz.length} vragen</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Klik om te maken/bewerken</p>
            </button>
          </div>
          <div style={s.card}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Basis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div><label style={{ display: 'block', marginBottom: '0.5rem', color: branding.primaryColor }}>Spel Naam</label>
              <input type="text" value={local.gameName} onChange={e => setLocal(p => ({ ...p, gameName: e.target.value }))} style={s.input} placeholder="Bijv. Moord op de Maashorst" /></div>
              <div><label style={{ display: 'block', marginBottom: '0.5rem', color: branding.primaryColor }}>Stations</label>
              <input type="number" value={local.numStations} onChange={e => setLocal(p => ({ ...p, numStations: parseInt(e.target.value) || 8, pauseAfterRound: Math.floor((parseInt(e.target.value) || 8) / 2), stations: [] }))} style={s.input} min="2" max="20" /></div>
              <div><label style={{ display: 'block', marginBottom: '0.5rem', color: branding.primaryColor }}>Teams</label>
              <input type="number" value={local.numTeams} onChange={e => setLocal(p => ({ ...p, numTeams: parseInt(e.target.value) || 5 }))} style={s.input} min="2" max="10" /></div>
              <div><label style={{ display: 'block', marginBottom: '0.5rem', color: branding.primaryColor }}>Tijd/Station (min)</label>
              <input type="number" value={local.stationDuration} onChange={e => setLocal(p => ({ ...p, stationDuration: parseInt(e.target.value) || 15 }))} style={s.input} min="5" max="60" /></div>
            </div>
            <button onClick={initStations} style={{ ...s.btn(true, true), marginTop: '1.5rem', width: 'auto' }}>Genereer Stations</button>
          </div>
          {local.stations.length > 0 && (
            <div style={s.card}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Stations</h3>
              {local.stations.map((st, i) => (
                <div key={st.id} style={{ ...s.card, backgroundColor: '#374151', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: branding.primaryColor }}>{st.id}</span>
                    <input type="text" value={st.name} onChange={e => { const u = [...local.stations]; u[i].name = e.target.value; setLocal(p => ({ ...p, stations: u })); }} style={{ ...s.input, flex: 1, fontWeight: 'bold' }} />
                    <select value={st.type} onChange={e => { const u = [...local.stations]; u[i].type = e.target.value; setLocal(p => ({ ...p, stations: u })); }} style={{ ...s.input, width: 'auto' }}>
                      <option value="manned">🎭 Bemand</option>
                      <option value="task">✍️ Opdracht</option>
                    </select>
                  </div>
                  {st.type === 'task' && (
                    <div style={{ marginBottom: '0.75rem' }}><label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#9ca3af' }}>Antwoord</label>
                    <input type="text" value={st.taskAnswer || ''} onChange={e => { const u = [...local.stations]; u[i].taskAnswer = e.target.value; setLocal(p => ({ ...p, stations: u })); }} style={s.input} placeholder="Correct antwoord" /></div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div><label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#9ca3af' }}>📍 Locatie</label>
                    <input type="text" value={st.location || ''} onChange={e => { const u = [...local.stations]; u[i].location = e.target.value; setLocal(p => ({ ...p, stations: u })); }} style={s.input} placeholder="Bijv. Grote tent" /></div>
                    <div><label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#9ca3af' }}>🗺️ Kaart</label>
                    {st.mapUrl ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button onClick={() => { const u = [...local.stations]; u[i].mapUrl = ''; setLocal(p => ({ ...p, stations: u })); }} style={{ fontSize: '0.875rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>❌ Verwijder</button>
                        <span style={{ fontSize: '0.875rem', color: '#22c55e' }}>✓ Kaart</span>
                      </div>
                    ) : (
                      <div><input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => { const u = [...local.stations]; u[i].mapUrl = ev.target.result; setLocal(p => ({ ...p, stations: u })); }; r.readAsDataURL(f); }}} style={{ display: 'none' }} id={`map-${i}`} />
                      <label htmlFor={`map-${i}`} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '0.25rem', backgroundColor: branding.primaryColor, color: branding.secondaryColor, cursor: 'pointer', display: 'inline-block' }}>Upload</label></div>
                    )}</div>
                  </div>
                  {st.mapUrl && <img src={st.mapUrl} alt="Kaart" style={{ width: '100%', maxHeight: '12rem', objectFit: 'contain', borderRadius: '0.5rem', backgroundColor: '#1f2937', marginTop: '0.75rem' }} />}
                </div>
              ))}
              <button onClick={initTeams} style={{ ...s.btn(true, true), width: 'auto' }}>Genereer Teams</button>
            </div>
          )}
          {local.teams.length > 0 && (
            <div style={s.card}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Teams</h3>
              {local.teams.map((tm, i) => (
                <div key={tm.id} style={{ ...s.card, backgroundColor: '#374151' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: tm.color }} />
                    <input type="text" value={tm.name} onChange={e => { const u = [...local.teams]; u[i].name = e.target.value; setLocal(p => ({ ...p, teams: u })); }} style={{ ...s.input, flex: 1, fontWeight: 'bold', fontSize: '1.25rem' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div><label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#9ca3af' }}>👤 Captain</label>
                    <input type="text" value={tm.captain || ''} onChange={e => { const u = [...local.teams]; u[i].captain = e.target.value; setLocal(p => ({ ...p, teams: u })); }} style={s.input} placeholder="Naam" /></div>
                    <div><label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#9ca3af' }}>👥 Leden</label>
                    <input type="number" min="1" max="20" placeholder="Aantal" style={s.input} /></div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.75rem' }}>Route: {local.routes[tm.id]?.join(' → ')}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button onClick={save} style={s.btn(true)}><Save size={24} /> OPSLAAN</button>
            {local.gameName && <button onClick={() => { setGameConfig(local); saveGame(local.gameName); }} style={{ ...s.btn(), backgroundColor: '#2563eb' }}>💾 BEWAAR SPEL</button>}
          </div>
        </div>
      </div>
    );
  };

  const LoadView = () => (
    <div style={s.container}>
      <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', color: branding.primaryColor, fontSize: '1.25rem', cursor: 'pointer', marginBottom: '1.5rem' }}>← Terug</button>
      <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', color: branding.primaryColor }}>OPGESLAGEN SPELLEN</h2>
      <div style={{ maxWidth: '800px' }}>
        {savedGames.map(g => (
          <div key={g.gameName} style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div><h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{g.gameName}</h3>
              <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{g.numStations} stations • {g.numTeams} teams • {new Date(g.savedAt).toLocaleDateString('nl-NL')}</div></div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => { loadGame(g); setView('setup'); }} style={{ ...s.btn(true, true), width: 'auto', marginBottom: 0 }}>📂 LAAD</button>
                <button onClick={() => deleteGame(g.gameName)} style={{ ...s.btn(false, true), width: 'auto', marginBottom: 0, backgroundColor: '#ef4444' }}>🗑️</button>
              </div>
            </div>
            {g.stations.length > 0 && <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Stations: {g.stations.map(s => s.id).join(', ')}</div>}
          </div>
        ))}
      </div>
    </div>
  );

  const ControlView = () => {
    const pauseIdx = gameConfig.pauseAfterRound || Math.floor(gameConfig.stations.length / 2);
    const isPause = gameState.currentRound === pauseIdx;
    const totalRounds = gameConfig.stations.length + 1;
    
    useEffect(() => {
      if (gameState.isRunning && gameState.timeRemaining > 0) {
        const t = setInterval(() => setGameState(p => ({ ...p, timeRemaining: Math.max(0, p.timeRemaining - 1) })), 1000);
        return () => clearInterval(t);
      }
    }, [gameState.isRunning, gameState.timeRemaining]);

    const min = Math.floor(gameState.timeRemaining / 60);
    const sec = gameState.timeRemaining % 60;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/individual-quiz/' + gameId)}`;

    return (
      <div style={s.container}>
        <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', color: branding.primaryColor, fontSize: '1.25rem', cursor: 'pointer', marginBottom: '1.5rem' }}>← Home</button>
        <div style={s.card}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900 }}>{gameConfig.gameName}</h2>
          <div style={{ fontSize: '1.125rem' }}>Ronde {gameState.currentRound + 1} / {totalRounds}{isPause && <span style={{ marginLeft: '1rem', color: '#fbbf24' }}>☕ PAUZE</span>}</div>
        </div>
        <div style={{ ...s.card, textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', fontWeight: 900, color: branding.primaryColor }}>{String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <button onClick={nextRound} disabled={gameState.currentRound >= totalRounds - 1} style={{ ...s.btn(), backgroundColor: '#22c55e', opacity: gameState.currentRound >= totalRounds - 1 ? 0.5 : 1, cursor: gameState.currentRound >= totalRounds - 1 ? 'not-allowed' : 'pointer' }}><Bell size={24} /> VOLGENDE</button>
          <button onClick={() => setGameState(p => ({ ...p, timeRemaining: p.timeRemaining + 300 }))} style={s.btn(true)}><Clock size={24} /> +5 MIN</button>
        </div>
        <div style={s.card}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>🎯 Quiz Controle</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ ...s.card, backgroundColor: '#374151' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div><h4 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Team Quiz</h4>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Captain ({gameConfig.teamQuiz.length} vragen)</p></div>
                <button onClick={() => setGameState(p => ({ ...p, teamQuizUnlocked: !p.teamQuizUnlocked }))} style={{ ...s.btn(false, true), width: 'auto', marginBottom: 0, backgroundColor: gameState.teamQuizUnlocked ? '#22c55e' : '#ef4444' }}>
                  {gameState.teamQuizUnlocked ? '✅ UNLOCKED' : '🔒 LOCKED'}
                </button>
              </div>
              {gameState.teamQuizUnlocked && (
                <div style={{ fontSize: '0.875rem' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Inzendingen:</div>
                  {Object.entries(gameState.teamQuizSubmissions).map(([id, sub]) => {
                    const t = gameConfig.teams.find(tm => tm.id === id);
                    return <div key={id} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem' }}><span>{t.name}</span><span style={{ color: sub.submitted ? '#22c55e' : '#9ca3af' }}>{sub.submitted ? `✅ ${sub.score}pt` : '⏳ Bezig'}</span></div>;
                  })}
                </div>
              )}
            </div>
            <div style={{ ...s.card, backgroundColor: '#374151' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div><h4 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Persoonlijk</h4>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Via QR ({gameConfig.individualQuiz.length} vragen)</p></div>
                <button onClick={() => setGameState(p => ({ ...p, personalQuizUnlocked: !p.personalQuizUnlocked }))} style={{ ...s.btn(false, true), width: 'auto', marginBottom: 0, backgroundColor: gameState.personalQuizUnlocked ? '#22c55e' : '#ef4444' }}>
                  {gameState.personalQuizUnlocked ? '✅ UNLOCKED' : '🔒 LOCKED'}
                </button>
              </div>
              {gameState.personalQuizUnlocked && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '0.5rem', marginBottom: '0.75rem' }}><img src={qr} alt="QR" style={{ width: '100%' }} /></div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>Scan om quiz te starten</div>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.75rem' }}><div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Inzendingen: {gameState.individualQuizSubmissions.length}</div>
                  <div style={{ maxHeight: '8rem', overflowY: 'auto' }}>
                    {gameState.individualQuizSubmissions.map((sub, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', paddingTop: '0.25rem' }}><span>{sub.name}</span><span style={{ color: '#22c55e' }}>{sub.score}pt</span></div>
                    ))}
                  </div></div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>📊 Scoreboard</h3>
            <button onClick={() => setGameState(p => ({ ...p, scoresRevealed: !p.scoresRevealed }))} style={{ padding: '1rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '1.125rem', background: 'linear-gradient(to right, #fbbf24, #f97316)', color: '#000', border: 'none', cursor: 'pointer' }}>
              {gameState.scoresRevealed ? '✅ SCORES GETOOND' : '🏆 ONTHUL SCORES'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div><h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem', color: branding.primaryColor }}>Team Scores</h4>
            {[...gameConfig.teams].map(t => ({ ...t, total: t.score + (gameState.teamQuizSubmissions[t.id]?.score || 0) })).sort((a, b) => b.total - a.total).map((t, i) => (
              <div key={t.id} style={{ ...s.card, backgroundColor: '#374151', padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><span style={{ fontSize: '1.25rem', fontWeight: 900 }}>{i + 1}.</span><div style={{ width: '1rem', height: '1rem', borderRadius: '50%', backgroundColor: t.color }} /><span style={{ fontWeight: 'bold' }}>{t.name}</span></div>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: branding.primaryColor }}>{t.total}pt</span>
              </div>
            ))}</div>
            <div><h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem', color: branding.primaryColor }}>Top 10 Individueel ({gameState.individualQuizSubmissions.length})</h4>
            <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
              {[...gameState.individualQuizSubmissions].sort((a, b) => b.score - a.score).slice(0, 10).map((sub, i) => {
                const t = gameConfig.teams.find(tm => tm.id === sub.teamId);
                return (
                  <div key={i} style={{ ...s.card, backgroundColor: '#374151', padding: '0.5rem', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontWeight: 900 }}>{i + 1}.</span>{t && <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: t.color }} />}<span>{sub.name}</span></div>
                    <span style={{ fontWeight: 900, color: branding.primaryColor }}>{sub.score}pt</span>
                  </div>
                );
              })}
              {gameState.individualQuizSubmissions.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Nog geen scores</div>}
            </div></div>
          </div>
        </div>
        <div style={s.card}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}><Map className="inline" style={{ marginRight: '0.5rem', color: branding.primaryColor }} />Team Posities</h3>
          {isPause ? (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#78350f', backgroundOpacity: 0.3, borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>☕</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>ALLE TEAMS IN PAUZE</div>
              <div style={{ color: '#9ca3af', marginTop: '0.5rem' }}>Quiz beschikbaar</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              {gameConfig.teams.map(t => {
                const adj = gameState.currentRound > pauseIdx ? gameState.currentRound - 1 : gameState.currentRound;
                const stId = gameConfig.routes[t.id]?.[adj];
                return (
                  <div key={t.id} style={{ ...s.card, backgroundColor: '#374151', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><div style={{ width: '1rem', height: '1rem', borderRadius: '50%', backgroundColor: t.color }} /><span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{t.name}</span></div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: branding.primaryColor }}>{stId}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TeamView = () => {
    const [quizAnswers, setQuizAnswers] = useState(new Array(gameConfig.teamQuiz.length).fill(''));
    
    useEffect(() => {
      if (gameState.isRunning && gameState.timeRemaining > 0) {
        const t = setInterval(() => setGameState(p => ({ ...p, timeRemaining: Math.max(0, p.timeRemaining - 1) })), 1000);
        return () => clearInterval(t);
      }
    }, [gameState.isRunning, gameState.timeRemaining]);

    if (!selectedTeam) {
      return (
        <div style={s.container}>
          <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', color: branding.primaryColor, fontSize: '1.25rem', cursor: 'pointer', marginBottom: '1.5rem' }}>← Home</button>
          <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', color: branding.primaryColor }}>SELECTEER TEAM</h2>
          <div style={{ maxWidth: '800px', display: 'grid', gap: '1rem' }}>
            {gameConfig.teams.map(t => (
              <button key={t.id} onClick={() => setSelectedTeam(t.id)} style={{ ...s.card, cursor: 'pointer', border: 'none', textAlign: 'left', transition: 'all 0.3s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: t.color }} />
                  <div style={{ fontSize: '2rem', fontWeight: 900 }}>{t.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    const team = gameConfig.teams.find(t => t.id === selectedTeam);
    const stId = gameConfig.routes[team.id]?.[gameState.currentRound];
    const st = gameConfig.stations.find(s => s.id === stId);
    const sub = gameState.teamQuizSubmissions[selectedTeam];
    const min = Math.floor(gameState.timeRemaining / 60);
    const sec = gameState.timeRemaining % 60;
    const pauseIdx = gameConfig.pauseAfterRound || Math.floor(gameConfig.stations.length / 2);
    const isPause = gameState.currentRound === pauseIdx;
    const totalRounds = gameConfig.stations.length + 1;

    const submitQuiz = () => {
      let score = 0;
      quizAnswers.forEach((ans, i) => {
        const q = gameConfig.teamQuiz[i];
        if (q.type === 'open') {
          if (ans.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) score += q.points;
        } else {
          if (ans === q.correctAnswer) score += q.points;
        }
      });
      setGameState(p => ({
        ...p,
        teamQuizSubmissions: {
          ...p.teamQuizSubmissions,
          [selectedTeam]: { answers: quizAnswers, score, submitted: true }
        }
      }));
      alert(`Quiz ingediend! Score: ${score} punten`);
    };

    return (
      <div style={s.container}>
        <button onClick={() => setSelectedTeam(null)} style={{ background: 'none', border: 'none', color: branding.primaryColor, fontSize: '1.25rem', cursor: 'pointer', marginBottom: '1.5rem' }}>← Terug</button>
        {gameState.isRunning && (
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>Ronde {gameState.currentRound + 1} / {totalRounds}{isPause && <span style={{ marginLeft: '0.5rem', color: '#fbbf24' }}>☕ PAUZE</span>}</div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: branding.primaryColor }}>{String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}</div>
              </div>
              <button onClick={nextRound} disabled={gameState.currentRound >= totalRounds - 1} style={{ ...s.btn(), backgroundColor: '#22c55e', width: 'auto', opacity: gameState.currentRound >= totalRounds - 1 ? 0.5 : 1, cursor: gameState.currentRound >= totalRounds - 1 ? 'not-allowed' : 'pointer' }}>
                <Bell size={24} /> KLAAR, VOLGENDE!
              </button>
            </div>
            {gameState.timeRemaining === 0 && (
              <div style={{ marginTop: '1rem', textAlign: 'center', color: '#fbbf24', fontSize: '1.25rem', fontWeight: 'bold' }} className="animate-pulse">⏰ TIJD IS OM! Klik "VOLGENDE"</div>
            )}
          </div>
        )}
        <div style={{ ...s.card, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', backgroundColor: team.color }} />
          <div>
            <h2 style={{ fontSize: '3rem', fontWeight: 900 }}>{team.name}</h2>
            <div style={{ color: branding.primaryColor }}>Score: {team.score + (sub?.score || 0)}pt</div>
          </div>
        </div>
        {gameState.isRunning && st && (
          <div style={s.card}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '4rem', fontWeight: 900, color: branding.primaryColor }}>{stId}</div>
              <h3 style={{ fontSize: '2rem', fontWeight: 'bold' }}>{st.name}</h3>
            </div>
            {st.type === 'manned' && (
              <div style={{ ...s.card, backgroundColor: '#374151', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎭</div>
                <div style={{ fontSize: '1.25rem' }}>Bemand station - volg instructies</div>
              </div>
            )}
            {st.type === 'task' && (
              <div style={{ ...s.card, backgroundColor: '#374151' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: branding.primaryColor }}>OPDRACHT</h4>
                <input type="text" placeholder="Antwoord..." style={{ ...s.input, marginBottom: '1rem' }} onKeyPress={e => {
                  if (e.key === 'Enter') {
                    if (e.target.value.toLowerCase().trim() === st.taskAnswer.toLowerCase().trim()) {
                      alert('✅ Correct!');
                      e.target.value = '';
                    } else {
                      alert('❌ Helaas, probeer opnieuw');
                    }
                  }
                }} />
                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>Druk Enter om te controleren</div>
              </div>
            )}
          </div>
        )}
        {gameState.teamQuizUnlocked && gameConfig.teamQuiz.length > 0 && (
          <div style={s.card}>
            <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem', color: branding.primaryColor }}>👥 TEAM QUIZ</h3>
            {sub?.submitted ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Voltooid!</div>
                <div style={{ fontSize: '1.5rem', color: branding.primaryColor }}>Score: {sub.score} punten</div>
              </div>
            ) : (
              <div>
                {gameConfig.teamQuiz.map((q, i) => (
                  <div key={i} style={{ ...s.card, backgroundColor: '#374151' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.75rem', fontSize: '1.125rem' }}>Vraag {i + 1} ({q.points} punten) {q.type === 'multiple' ? '☑️' : '✍️'}</div>
                    {q.imageUrl && <img src={q.imageUrl} alt="Quiz" style={{ width: '100%', maxHeight: '20rem', objectFit: 'contain', borderRadius: '0.5rem', backgroundColor: '#1f2937', marginBottom: '1rem' }} />}
                    <div style={{ marginBottom: '1rem' }}>{q.question}</div>
                    {q.type === 'open' ? (
                      <input type="text" value={quizAnswers[i]} onChange={e => { const u = [...quizAnswers]; u[i] = e.target.value; setQuizAnswers(u); }} style={s.input} placeholder="Jouw antwoord..." />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.options?.map((opt, j) => (
                          <button key={j} onClick={() => { const u = [...quizAnswers]; u[i] = String.fromCharCode(65 + j); setQuizAnswers(u); }} style={{ ...s.btn(quizAnswers[i] === String.fromCharCode(65 + j), true), textAlign: 'left', marginBottom: 0 }}>
                            {String.fromCharCode(65 + j)}. {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <button onClick={submitQuiz} style={s.btn(true)}><Save size={28} /> DIEN IN</button>
              </div>
            )}
          </div>
        )}
        {gameState.personalQuizUnlocked && gameConfig.individualQuiz.length > 0 && (
          <div style={s.card}>
            <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem', color: branding.primaryColor }}>👤 INDIVIDUELE QUIZ</h3>
            <div style={{ textAlign: 'center' }}>
              <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '0.5rem', display: 'inline-block', marginBottom: '1rem' }}>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/individual-quiz/' + gameId + '/' + selectedTeam)}`} alt="QR" style={{ width: '16rem', height: '16rem' }} />
              </div>
              <div style={{ fontSize: '1.25rem' }}>Scan met je telefoon</div>
              <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem' }}>Elke persoon maakt apart de quiz</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      {view === 'home' && <HomeView />}
      {view === 'branding' && <BrandingView />}
      {view === 'quizmaker' && <QuizView />}
      {view === 'setup' && <SetupView />}
      {view === 'load' && <LoadView />}
      {view === 'control' && <ControlView />}
      {view === 'team' && <TeamView />}
    </div>
  );
};

export default FLDGameMaster;
