// client/src/components/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Users, Trash2, Edit, X, LogOut } from 'lucide-react';

// ========== MAIN COMPONENT ==========
export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null); // <-- DATA UNTUK EDIT
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Silakan login!');
      navigate('/admin-login');
      return;
    }
    fetchEvents();
    // eslint-disable-next-line
  }, []);

  const fetchEvents = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.get('http://localhost:5000/api/admin/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(res.data);
      setLoading(false);
    } catch (error) {
      alert('Gagal load data. Silakan login ulang.');
      navigate('/admin-login');
    }
  };

  const fetchParticipants = async (eventId) => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/events/${eventId}/participants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParticipants(res.data);
      setSelectedEvent(eventId);
    } catch (error) {
      console.error('Error fetch participants', error);
    }
  };

  const deleteEvent = async (id) => {
    if (!confirm('Yakin hapus event ini?')) return;
    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`http://localhost:5000/api/admin/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents();
    } catch (error) {
      alert('Gagal hapus event');
    }
  };

  // ========== FUNGSI BUKA MODAL EDIT ==========
  const handleEditClick = (event) => {
    setEditData(event); // Simpan data event yang mau diedit
    setShowModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin-login');
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Selamat datang, {localStorage.getItem('adminUser')}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setEditData(null); // Reset edit data
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" /> Buat Event Baru
            </button>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-gray-500 text-sm">Total Event</div>
            <div className="text-3xl font-bold text-blue-600">{events.length}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-gray-500 text-sm">Total Peserta</div>
            <div className="text-3xl font-bold text-green-600">
              {events.reduce((acc, e) => acc + (e.total_peserta || 0), 0)}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-gray-500 text-sm">Rata-rata Rating</div>
            <div className="text-3xl font-bold text-yellow-600">
              {(events.reduce((acc, e) => acc + (e.avg_rating || 0), 0) / (events.length || 1)).toFixed(1)}
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Daftar Event</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Nama Event</th>
                <th className="p-4 text-left">Kode</th>
                <th className="p-4 text-center">Peserta</th>
                <th className="p-4 text-center">Rating</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">{event.name}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{event.unique_code}</span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => fetchParticipants(event.id)}
                      className="text-blue-600 hover:underline"
                    >
                      {event.total_peserta || 0}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-sm ${(event.avg_rating || 0) >= 4 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {event.avg_rating ? Number(event.avg_rating).toFixed(1) : '-'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      {/* ===== TOMBOL EDIT ===== */}
                      <button 
                        onClick={() => handleEditClick(event)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteEvent(event.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Belum ada event. Buat event baru!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Participants Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg">Daftar Peserta</h3>
                <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-gray-200 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[60vh]">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">Nama</th>
                      <th className="p-2 text-left">Email</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">{p.name}</td>
                        <td className="p-2 text-gray-600">{p.email}</td>
                        <td className="p-2 text-center">
                          {p.has_evaluated ? (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">Selesai</span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-sm">Belum</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {participants.length === 0 && (
                      <tr>
                        <td colSpan="3" className="p-4 text-center text-gray-500">Belum ada peserta</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit Event Modal */}
        {showModal && (
          <EventModal 
            onClose={() => {
              setShowModal(false);
              setEditData(null);
            }} 
            onSuccess={fetchEvents} 
            editData={editData}
          />
        )}
      </div>
    </div>
  );
}

// ========== MODAL (CREATE + EDIT) ==========
function EventModal({ onClose, onSuccess, editData }) {
  const [name, setName] = useState(editData?.name || '');
  const [code, setCode] = useState(editData?.unique_code || '');
  const [textX, setTextX] = useState(editData?.text_x || 200);
  const [textY, setTextY] = useState(editData?.text_y || 300);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const isEdit = !!editData; // Cek mode edit atau create

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('name', name);
    formData.append('unique_code', code);
    formData.append('text_x', textX);
    formData.append('text_y', textY);
    if (file) formData.append('template', file);

    try {
      if (isEdit) {
        // UPDATE
        await axios.put(`http://localhost:5000/api/admin/events/${editData.id}`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // CREATE
        await axios.post('http://localhost:5000/api/admin/events', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      alert('Gagal: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg">{isEdit ? 'Edit Event' : 'Buat Event Baru'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nama Event</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2 rounded"
              required 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Kode Unik</label>
            <input 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full border p-2 rounded font-mono"
              placeholder="DIGITAL2026"
              required 
            />
          </div>

          {/* Koordinat Input (Hanya di Mode Edit) */}
          {isEdit && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Posisi X Nama</label>
                <input 
                  type="number"
                  value={textX}
                  onChange={(e) => setTextX(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Posisi Y Nama</label>
                <input 
                  type="number"
                  value={textY}
                  onChange={(e) => setTextY(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Template Sertifikat {isEdit && '(Opsional - kosongkan jika tidak diubah)'}
            </label>
            <input 
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full border p-2 rounded text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan Event')}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}