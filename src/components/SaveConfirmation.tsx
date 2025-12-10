import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SaveConfirmationProps {
  message: string;
  onClose: () => void;
}

export function SaveConfirmation({ message, onClose }: SaveConfirmationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      backgroundColor: '#065f46',
      color: '#fff',
      padding: '1rem 1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      zIndex: 9999,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s'
    }}>
      <CheckCircle size={24} />
      <span style={{ fontWeight: 'bold' }}>{message}</span>
    </div>
  );
}