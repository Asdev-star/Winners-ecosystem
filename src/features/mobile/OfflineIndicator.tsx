import React from 'react';
import { useOfflineSync } from '../pwa/useOfflineSync';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = useOfflineSync();

  if (isOnline) return null;

  return (
    <div style={{
      background: 'var(--red)',
      color: 'white',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '12px',
      fontWeight: 600,
      position: 'sticky',
      top: 0,
      zIndex: 1100,
    }}>
      <WifiOff size={14} />
      <span>You are currently offline. Some features may be limited.</span>
    </div>
  );
};