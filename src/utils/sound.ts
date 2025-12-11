let audioContext: AudioContext | null = null;
let isMuted = false;

export function initAudio() {
  if (typeof window !== 'undefined' && !audioContext) {
    audioContext = new (window.AudioContext || (window as never)['webkitAudioContext'])();
  }
}

export function playRoundSound() {
  if (isMuted || !audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.5);
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 1);
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 1.5);
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 2);
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 2.5);
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 3);
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 3.5);
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 4);

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 5);
}

export function playTimeUpSound() {
  if (isMuted || !audioContext) return;

  // LOUD ALARM SOUND - 3 quick beeps
  for (let i = 0; i < 3; i++) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // High frequency beep
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + i * 0.3);
    oscillator.type = 'square'; // Harsher sound

    // Loud and quick
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + i * 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.3 + 0.2);

    oscillator.start(audioContext.currentTime + i * 0.3);
    oscillator.stop(audioContext.currentTime + i * 0.3 + 0.2);
  }
}

export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

export function isSoundMuted() {
  return isMuted;
}
