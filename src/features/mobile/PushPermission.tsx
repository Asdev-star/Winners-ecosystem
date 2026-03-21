import React from 'react';
import { usePushNotifications } from './usePushNotifications';
import Card from '../../components/ui/Card';
import { Bell, BellOff } from 'lucide-react';

interface PushPermissionProps {
  vapidPublicKey: string;
}

export const PushPermission: React.FC<PushPermissionProps> = ({ vapidPublicKey }) => {
  const { permission, subscription, isSubscribing, requestPermission, subscribe, unsubscribe } = usePushNotifications();

  if (permission === 'denied') return null;

  return (
    <Card
      title="Push Notifications"
      subtitle="STAY UPDATED IN REAL-TIME"
      accent="blue"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-dim)' }}>
          Get instant alerts for revenue milestones, team activity, and AI insights.
        </p>
        
        {subscription ? (
          <button
            onClick={unsubscribe}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '8px 16px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <BellOff size={16} />
            Disable Notifications
          </button>
        ) : (
          <button
            onClick={async () => {
              const perm = await requestPermission();
              if (perm === 'granted') {
                await subscribe(vapidPublicKey);
              }
            }}
            disabled={isSubscribing}
            style={{
              background: 'var(--blue)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              opacity: isSubscribing ? 0.7 : 1,
            }}
          >
            <Bell size={16} />
            {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
          </button>
        )}
      </div>
    </Card>
  );
};