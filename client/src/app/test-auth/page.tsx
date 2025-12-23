'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';

export default function TestAuthPage() {
  const [status, setStatus] = useState<string>('Checking...');
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    try {
      // Check Firebase config
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      };

      setConfig(firebaseConfig);

      // Check if Firebase is initialized
      if (auth && db) {
        setStatus('✅ Firebase is initialized correctly!');
      } else {
        setStatus('❌ Firebase initialization failed');
      }
    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Firebase Configuration Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Status:</h2>
        <p className="text-lg">{status}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Environment Variables:</h2>
        <div className="bg-dark-secondary p-6 rounded-lg border border-dark-accent">
          {Object.entries(config).map(([key, value]) => (
            <div key={key} className="mb-2">
              <span className="text-yellow-500">{key}:</span>{' '}
              <span className={value ? 'text-green-500' : 'text-red-500'}>
                {value ? '✅ Set' : '❌ Missing'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Next Steps:</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>If all variables are ✅ Set, Firebase is configured correctly</li>
          <li>If any are ❌ Missing, check your .env.local file</li>
          <li>Make sure Firebase Authentication is enabled in Firebase Console</li>
          <li>Enable Email/Password and Google sign-in methods</li>
        </ol>
      </div>
    </div>
  );
}

