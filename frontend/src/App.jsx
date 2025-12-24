// src/App.jsx
import { useState, useEffect } from 'react';
import api from './services/api';

function App() {
  const [status, setStatus] = useState('Checking connection...');
  const [systemData, setSystemData] = useState(null);

  useEffect(() => {
    // ฟังก์ชันยิงไปหา Backend
    const checkBackend = async () => {
      try {
        const response = await api.get('/'); // ยิงไปที่ Route '/'
        setSystemData(response.data);
        setStatus('🟢 ONLINE: Connected to Z-MOS Kernel');
      } catch (error) {
        console.error('Connection Error:', error);
        setStatus('🔴 OFFLINE: Cannot reach Backend (Check Port 5001)');
      }
    };

    checkBackend();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🚀 Z-MOS v5.0 System Dashboard</h1>
      <hr />
      <h2>System Status: {status}</h2>
      
      {systemData && (
        <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
          <h3>💾 Kernel Response:</h3>
          <pre>{JSON.stringify(systemData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;