import { useEffect } from 'react';

export function useTimer(
  isRunning: boolean,
  timeRemaining: number,
  onTick: (newTime: number) => void
) {
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      const newTime = Math.max(0, timeRemaining - 1);
      onTick(newTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, onTick]);
}
