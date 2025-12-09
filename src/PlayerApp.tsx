export function PlayerApp() {
  return (
    <div style={{ 
      color: 'white', 
      padding: '2rem',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a'
    }}>
      <h1>PLAYER APP WORKS!</h1>
      <p>Path: {window.location.pathname}</p>
      <p>Code: {new URLSearchParams(window.location.search).get('code')}</p>
    </div>
  );
}