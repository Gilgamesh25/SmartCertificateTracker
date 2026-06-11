// client/src/components/AdminDashboard.jsx

// ... (bagian atas sama)

// Komponen Modal Buat Event
function CreateEventModal({ onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    // --------💡 TAMBAHKAN INI--------
    const [file, setFile] = useState(null); 
    // -------------------------------
    const [loading, setLoading] = useState(false);
  
    // --------💡 UPDATE HANDLESUBMIT--------
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('unique_code', code);
      if (file) formData.append('template', file);
  
      try {
        await axios.post('http://localhost:5000/api/admin/events', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        onSuccess();
        onClose();
      } catch (error) {
        alert('Gagal buat event');
      } finally {
        setLoading(false);
      }
    };
    // -------------------------------------
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-lg">Buat Event Baru</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* --------💡 FORM DENGAN ENCTYPE-------- */}
          <form onSubmit={handleSubmit} className="p-4" encType="multipart/form-data">
          {/* ---------------------------------- */}
            
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
  
            {/* --------💡 INPUT FILE-------- */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Template Sertifikat (Opsional)</label>
              <input 
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full border p-2 rounded text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">Format: JPG/PNG. Rekomendasi ukuran A4 Landscape</p>
            </div>
            {/* --------------------------------- */}
            
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
                {loading ? 'Menyimpan...' : 'Simpan Event'}
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