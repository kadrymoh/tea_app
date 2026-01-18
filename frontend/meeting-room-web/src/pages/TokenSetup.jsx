import { useState } from 'react';
import { KeyIcon, ArrowRightIcon, AlertCircleIcon } from '../components/Icons';
import { getApiUrl } from '../config/api.config';

const TokenSetup = ({ onTokenSubmit }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token.trim()) {
      setError('Please enter a room token');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔑 Testing token:', token.trim());

      // Validate the token by calling room login endpoint
      const res = await fetch(getApiUrl('room/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomToken: token.trim()
        })
      });

      console.log('📡 Response status:', res.status);
      const data = await res.json();
      console.log('📦 Response data:', data);

      if (res.ok && data.success) {
        // Token is valid, call parent handler
        onTokenSubmit(token.trim());
      } else {
        setError(data.message || 'Invalid token. Please check and try again.');
      }
    } catch (err) {
      console.error('❌ Token validation error:', err);
      setError('Failed to validate token. Please check your connection and backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-blue-950 to-purple-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-purple-500/20 rounded-full mb-4">
            <KeyIcon className="w-16 h-16 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Meeting Room</h1>
          <p className="text-purple-300">Enter your room access token to continue</p>
        </div>

        {/* Token Input Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                Room Token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="room_xxxxxxxxxxxxxxxx..."
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                disabled={loading}
              />
              <p className="text-xs text-purple-300 mt-2">
                Get this token from your administrator
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                <AlertCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <span>Validating...</span>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-center text-white/60">
              This token will be saved on this device. <br />
              Contact your administrator to get a new token if needed.
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/20">
          <h3 className="text-white font-semibold mb-2">How to get your token?</h3>
          <ol className="text-sm text-blue-200 space-y-2">
            <li>1. Ask your administrator for the room token</li>
            <li>2. Copy the token (starts with "room_")</li>
            <li>3. Paste it in the field above</li>
            <li>4. Click Continue to access the menu</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TokenSetup;
