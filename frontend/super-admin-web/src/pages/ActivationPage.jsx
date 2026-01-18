// frontend/super-admin-web/src/pages/ActivationPage.jsx
import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Loader } from 'lucide-react';
import { getApiUrl } from '../config/api.config';

const ActivationPage = () => {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const activateAccount = async () => {
      // Get token and userType from URL
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const userType = params.get('type') || 'super-admin'; // Default to super-admin

      if (!token) {
        setStatus('error');
        setMessage('No activation token provided');
        return;
      }

      try {
        // Try Super Admin first
        let response = await fetch(getApiUrl('activation/verify-email'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token,
            userType: 'super-admin'
          })
        });

        let data = await response.json();

        // If not super-admin, try regular user (admin/tea boy)
        if (!data.success) {
          response = await fetch(getApiUrl('activation/verify-email'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              token,
              userType: 'user'
            })
          });

          data = await response.json();
        }

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Your account has been activated successfully!');

          // Determine redirect URL based on user type from response or URL
          let redirectUrl = '/'; // Default: Super Admin login

          // Check if response includes user role
          if (data.user && data.user.role) {
            if (data.user.role === 'ADMIN') {
              redirectUrl = '/tenant/admin'; // Admin web app
            } else if (data.user.role === 'TEA_BOY' || data.user.role === 'MANAGER') {
              redirectUrl = '/tenant/tea-boy'; // Tea Boy app
            }
          }

          // Redirect after 3 seconds
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to activate account');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during activation');
        console.error(error);
      }
    };

    activateAccount();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border-2 border-slate-700/50">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Account Activation
          </h1>
        </div>

        {/* Status Display */}
        <div className="text-center">
          {status === 'loading' && (
            <div className="py-8">
              <Loader className="w-16 h-16 text-sky-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-300 text-lg">Activating your account...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8">
              <div className="inline-flex items-center justify-center p-4 bg-green-500/20 rounded-full mb-4">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Success!</h2>
              <p className="text-slate-300 mb-6">{message}</p>
              <p className="text-sm text-slate-400">Redirecting to login page...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8">
              <div className="inline-flex items-center justify-center p-4 bg-red-500/20 rounded-full mb-4">
                <XCircle className="w-16 h-16 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Activation Failed</h2>
              <p className="text-slate-300 mb-6">{message}</p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-semibold transition-all"
              >
                Go to Login
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs">
            🫖 Tea Management System v2.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivationPage;
