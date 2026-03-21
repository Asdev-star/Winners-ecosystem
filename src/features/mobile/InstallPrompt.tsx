import React from 'react';
import { useInstallPrompt } from '../pwa/useInstallPrompt';
import Card from '../../components/ui/Card';
import { Download } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const { isInstallable, showInstallPrompt } = useInstallPrompt();

  if (!isInstallable) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '24px',
      right: '24px',
      zIndex: 1000,
    }}>
      <Card
        title="Install Winners Ecosystem"
        subtitle="EXPERIENCE THE FULL POWER"
        accent="gold"
        hoverable
        onClick={showInstallPrompt}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--gold)',
            borderRadius: '50%',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Download size={20} color="var(--bg)" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
              Add to your home screen for faster access and offline support.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};