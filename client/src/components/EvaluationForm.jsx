// client/src/components/EvaluationForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Download, Star, Send } from 'lucide-react';

export default function EvaluationForm() {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success
  const navigate = useNavigate();
  
  // Ambil ID dari localStorage
  const participantId = localStorage.getItem('participantId');

  //cegah akses ilegal
  useEffect(() => {
    if (!participantId) {
      alert('Silakan Login terlebih dahulu');
      navigate('/');
    }
  }, [navigate, participantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await axios.post('http://localhost:5000/api/evaluation', {
        participantId: Number(participantId),
        rating: rating,
        feedback: feedback
      });

      if (res.data.success) {
        setStatus('success');
      } else {
        alert(res.data.error || 'Gagal kirim');
        setStatus('idle');
      }
    } catch (error) {
      console.error('Error Submit:', error);
      alert('Terjadi kesalahan saat mengirim');
      setStatus('idle');
    }
  };

  const handleDownload = () => {
    window.open(`http://localhost:5000/api/certificate/${participantId}`, '_blank');
  };

  // ----------------------------------------------------
  // TAMPILAN KOMPONEN (JSX)
  // ----------------------------------------------------
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border-t-8 border-green-500">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Terima Kasih!</h2>
          <p className="text-gray-600 mb-8">Evaluasi Anda sudah terekam. Sertifikat Anda sekarang aktif.</p>
          
          <button 
            onClick={handleDownload}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105"
          >
            <Download className="w-6 h-6" />
            Unduh Sertifikat PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-6 text-white">
            <h2 className="text-2xl font-bold">Formulir Evaluasi Pelatihan</h2>
            <p className="text-blue-100 mt-1">Mohon isi dengan jujur ya!</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            
            {/* Rating Section */}
            <div className="mb-8">
              <label className="block text-gray-700 font-semibold mb-4 text-lg">
                Seberapapuaskah Anda dengan materi ini?
              </label>
              
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                <span className="text-sm text-gray-500">Sangat Buruk</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
                        rating === star 
                          ? 'bg-blue-600 text-white scale-110 shadow-md' 
                          : 'bg-white text-gray-600 hover:bg-blue-100'
                      }`}
                    >
                      {star}
                    </button>
                  ))}
                </div>
                <span className="text-sm text-gray-500">Sangat Bagus</span>
              </div>
              <p className="text-center mt-2 text-blue-600 font-medium">
                Rating: {rating} / 5
              </p>
            </div>

            {/* Feedback Section */}
            <div className="mb-8">
              <label className="block text-gray-700 font-semibold mb-2 text-lg">
                Saran & Masukan (Opsional)
              </label>
              <textarea 
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                rows="4"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tulis komentar atau masukan untuk materi berikut..."
              ></textarea>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-green-600 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 text-lg"
            >
              {status === 'submitting' ? (
                'Mengirim...'
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Kirim Evaluasi & Aktifkan Sertifikat
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tombol Batal (Kembali) */}
        <button 
          onClick={() => navigate('/')}
          className="block w-full text-center mt-6 text-gray-500 hover:text-gray-700"
        >
          ← Batal / Login dengan akun lain
        </button>
      </div>
    </div>
  );
}