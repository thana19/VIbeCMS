import React, { useState, useEffect } from 'react';
import { FirebaseConfig } from '../types';
import { initializeFirebase } from '../services/firebaseService';
import { Save, Database, AlertTriangle } from 'lucide-react';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [configStr, setConfigStr] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    const saved = localStorage.getItem('cms_firebase_config');
    if (saved) {
      try {
        // Prettify existing JSON for display
        const parsed = JSON.parse(saved);
        setConfigStr(JSON.stringify(parsed, null, 2));
      } catch (e) {
        setConfigStr(saved);
      }
    }
  }, []);

  const handleSave = () => {
    try {
      setError('');
      let config: FirebaseConfig;

      // 1. Try strict JSON parsing first
      try {
        config = JSON.parse(configStr);
      } catch (jsonError) {
        // 2. If JSON fails, try parsing as a JavaScript object literal.
        // This allows users to paste the config directly from Firebase Console (where keys aren't quoted).
        try {
          // eslint-disable-next-line no-new-func
          config = new Function(`return ${configStr}`)();
        } catch (jsError) {
          throw new Error('Invalid format');
        }
      }

      // Basic validation
      if (!config || !config.apiKey) {
        throw new Error('Invalid config: Missing apiKey');
      }

      const success = initializeFirebase(config);
      
      if (success) {
        // Save as normalized JSON string so it loads correctly next time
        localStorage.setItem('cms_firebase_config', JSON.stringify(config));
        setStatus('success');
        setTimeout(onClose, 1500);
      } else {
        setError('Initialization failed. Check console for details.');
      }
    } catch (e) {
      setError('Invalid format. You can paste the JS object from Firebase console directly, or use valid JSON.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
          <Database size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Database Configuration</h2>
          <p className="text-sm text-gray-500">Connect your Firebase Firestore database</p>
        </div>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-amber-700">
              Without configuration, the app uses <strong>LocalStorage</strong> (browser memory). 
              Data will not persist across devices or browsers.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Firebase Config
        </label>
        <div className="text-xs text-gray-500 mb-2">
          Paste the configuration object from your Firebase Project settings. 
          (Supports both JSON and JavaScript object formats)
        </div>
        <textarea
          value={configStr}
          onChange={(e) => setConfigStr(e.target.value)}
          rows={10}
          className="w-full p-4 font-mono text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          placeholder={`{
  apiKey: "AIza...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}`}
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded">{error}</p>
      )}

      {status === 'success' && (
        <p className="text-green-600 text-sm mb-4 bg-green-50 p-3 rounded">Connected successfully!</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Save size={18} />
          Save Configuration
        </button>
      </div>
    </div>
  );
};

export default Settings;