import { useState, useEffect } from 'react';
import MeetingRoomInterface from './pages/MeetingRoomInterface';
import InvalidAccess from './pages/InvalidAccess';
import { getApiUrl } from './config/api.config';

function App() {
  const [view, setView] = useState('loading'); // 'loading', 'room', 'invalid'
  const [accessToken, setAccessToken] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);

  // Check URL on mount for direct access via /tenant/room/:token
  useEffect(() => {
    const path = window.location.pathname;
    // Match pattern: /tenant/room/{token}
    const match = path.match(/^\/tenant\/room\/(.+)$/);

    if (match) {
      const [, token] = match;
      validateToken(token);
    } else {
      // No valid token in URL
      setView('invalid');
    }
  }, []);

  const validateToken = async (token) => {
    try {
      const res = await fetch(getApiUrl('room/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomToken: token
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAccessToken(token);
        setRoomInfo(data.data.room);
        setView('room');
      } else {
        setView('invalid');
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setView('invalid');
    }
  };

  // Loading state
  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading room...</p>
        </div>
      </div>
    );
  }

  if (view === 'room' && roomInfo) {
    return <MeetingRoomInterface roomToken={accessToken} roomInfo={roomInfo} />;
  }

  // Invalid or no token
  return <InvalidAccess />;
}

export default App;
