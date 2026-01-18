import { AlertCircleIcon, LockIcon } from '../components/Icons';

const InvalidAccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full"></div>
            <div className="relative bg-red-50 p-8 rounded-full border-2 border-red-200">
              <LockIcon className="w-20 h-20 text-red-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-slate-800 text-center mb-4">
          Invalid Access
        </h1>

        {/* Description */}
        <p className="text-slate-600 text-center text-lg mb-8">
          The room link you're trying to access is invalid or has expired.
        </p>

        {/* Warning Box */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircleIcon className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-yellow-700 font-semibold mb-2">Security Notice</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Each meeting room has a unique access link. Please make sure you're using the correct link provided by your organization.
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-slate-800 font-semibold mb-3">What to do:</h3>
          <ul className="space-y-2 text-slate-600 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-sky-500 mt-1">•</span>
              <span>Contact your meeting organizer for the correct room link</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 mt-1">•</span>
              <span>Make sure you copied the entire URL including the access token</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-500 mt-1">•</span>
              <span>Check if the link has been shared with you recently (links may expire)</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            Need help? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvalidAccess;
