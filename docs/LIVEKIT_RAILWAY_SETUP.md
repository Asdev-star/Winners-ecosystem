# LiveKit Server Setup on Railway

This guide explains how to set up LiveKit for video conferencing and broadcasting on Railway.

## Overview

LiveKit is an open-source WebRTC infrastructure that powers real-time video and audio for the Winners Community Studio:

- **Video Rooms**: Zoom-style video conferencing with up to 50 participants
- **Broadcast Streams**: One-to-many live streaming with Super Chat and PPV

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Winners Ecosystem                         │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)                                               │
│  ├── VideoRoomPage (LiveKit components)                        │
│  └── BroadcastViewerPage                                        │
└───────────────────────┬─────────────────────────────────────────┘
                        │ LiveKit Tokens (JWT)
┌───────────────────────▼─────────────────────────────────────────┐
│  LiveKit Server (Railway)                                       │
│  ├── wss://winners-livekit.up.railway.app                       │
│  ├── API Server (port 7880)                                     │
│  └── Room Gateway (port 7882)                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Railway Setup Options

### Option 1: Deploy LiveKit Cloud (Easiest)

1. Sign up at [livekit.io](https://livekit.io)
2. Create a new project
3. Get your API Key and Secret
4. Add environment variables to Railway:

```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

### Option 2: Self-Hosted on Railway

Deploy LiveKit server directly on Railway using Docker:

1. Create a new Railway service using the LiveKit Docker image
2. Configure environment variables:

```bash
# LiveKit Configuration
LIVEKIT_KEYS=your_api_key:your_api_secret
LIVEKIT_PORT=7880
LIVEKIT_RTC_PORT=7882
LIVEKIT_MAX_PUBLISHERS=50
LIVEKIT_REDIS_URL=redis://redis:6379
LIVEKIT_CONFIG_FILE=/etc/livekit.yaml
```

3. Add the LiveKit configuration file:

```yaml
# livekit.yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
  tcp_port: 7881
  udp_port: 7882

keys:
  your_api_key: your_api_secret

room:
  auto_create: true
  empty_timeout: 300
  max_participants: 50

redis:
  # Add Redis for scaling across multiple instances
  address: redis:6379
```

### Option 3: Use TURN Server (Required for Production)

For reliable connectivity behind firewalls, configure a TURN server:

```bash
LIVEKIT_TURN_ENABLED=true
LIVEKIT_TURN_API_KEY=your_api_key
LIVEKIT_TURN_API_SECRET=your_api_secret
# Or use Twilio/Google Cloud TURN
LIVEKIT_TURN_URL=turn:your-turn-server.com:3478
LIVEKIT_TURN_USERNAME=username
LIVEKIT_TURN_PASSWORD=password
```

## Environment Variables

Add these to your Railway project:

| Variable | Description | Example |
|----------|-------------|---------|
| `LIVEKIT_URL` | WebSocket URL for LiveKit server | `wss://winners-livekit.up.railway.app` |
| `LIVEKIT_API_KEY` | API Key for token generation | `devkey` |
| `LIVEKIT_API_SECRET` | API Secret for token generation | `secret` |
| `LIVEKIT_TURN_URL` | TURN server URL (optional) | `turn:your-turn.com:3478` |
| `LIVEKIT_TURN_USERNAME` | TURN username (optional) | - |
| `LIVEKIT_TURN_PASSWORD` | TURN password (optional) | - |

## Frontend Integration

The frontend is already configured to use LiveKit. When users join video rooms or view broadcasts:

1. **Frontend calls API**: `POST /studio/rooms/:id/join`
2. **API generates token**: Using `generateLiveKitToken()` in `studioRoutes.ts`
3. **API returns**: `{ livekitToken, livekitUrl }`
4. **Frontend connects**: Using `@livekit/components-react`

### Example API Response

```json
{
  "participant": { "id": "...", "role": "host" },
  "livekitToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "livekitUrl": "wss://winners-livekit.up.railway.app"
}
```

### Frontend Code

```typescript
import { LiveKitRoom, VideoConference } from '@livekit/components-react';

function VideoRoomPage({ roomId }) {
  const { data } = useJoinRoom(roomId);
  
  if (!data) return <Loading />;
  
  return (
    <LiveKitRoom
      serverUrl={data.livekitUrl}
      token={data.livekitToken}
      connect={true}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
```

## Testing Locally

To test LiveKit locally:

1. Run LiveKit using Docker:
```bash
docker run -d --name livekit \
  -p 7880:7880 \
  -p 7881:7881 \
  -p 7882:7882/udp \
  -p 7888:7888 \
  -e LIVEKIT_KEYS="devkey:secret" \
  livekit/livekit-server:latest \
  --dev
```

2. Update environment:
```bash
LIVEKIT_URL=http://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

3. Start the frontend development server

## Monitoring

LiveKit provides Prometheus metrics at `/metrics`. Add to Railway:

```bash
LIVEKIT_PROMETHEUS_PORT=7889
```

Access metrics at: `http://your-livekit-service.railway.app:7889/metrics`

## Costs

- **Self-hosted**: Free (requires Railway compute)
- **LiveKit Cloud**: $25/month for 500 peak participants
- **TURN Server**: ~$10/month (Twilio or Metered.ca)

## Troubleshooting

### Connection Issues

1. Check TURN server configuration
2. Verify SSL certificates
3. Check Railway networking settings

### Token Errors

1. Verify API key/secret match
2. Check token expiration
3. Ensure room name matches

### Performance Issues

1. Enable Prometheus metrics
2. Add Redis for scaling
3. Adjust participant limits

## Next Steps

1. Deploy LiveKit (cloud or self-hosted)
2. Add environment variables to Railway
3. Test video rooms and broadcasts
4. Configure TURN server for production
5. Monitor with Prometheus
