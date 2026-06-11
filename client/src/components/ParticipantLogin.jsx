// client/src/components/ParticipantLogin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ParticipantLogin() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await axios.post('http://localhost:5000/api/checkin', { 
        email: email,
        eventCode: code
      });

      if (res.data.success) {
        // Simpan ID sebagai number/integer
        const pId = res.data.participant.id;
        localStorage.setItem('participantId', pId);
        
        // Jika sudah pernah evaluasi, langsung ke halaman download
        // Jika belum, ke halaman evaluasi
        if (res.data.participant.hasEvaluated) {
           alert('Anda sudah evaluasi. Silakan unduh sertifikat.');
           // Redirect ke halaman khusus download langsung (opsional)
        }
        
        navigate('/evaluation');
      }
    } catch (error) {
      console.error('Login Error:', error);
      const msg = error.response?.data?.error || 'Login Gagal';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Smart Certificate Login</h1>
        
        <div className="mb-4">
          <label className="block text-gray-600 text-sm mb-1">Email Peserta</label>
          <input 
            type="email"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="nama@email.com" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-600 text-sm mb-1">Kode Event</label>
          <input 
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            placeholder="Contoh: DIGITAL2026" 
            value={code}
            onChange={e => setCode(e.target.value)}
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Memproses...' : 'Masuk / Check-in'}
        </button>
      </form>
    </div>
  );
}