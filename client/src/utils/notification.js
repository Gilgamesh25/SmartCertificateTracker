// client/src/utils/notification.js
export const showToast = (message, type = 'success') => {
    // Cara sederhana menggunakan alert
    // Nanti bisa diganti dengan library react-toastify
    const bg = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const el = document.createElement('div');
    el.className = `fixed bottom-4 right-4 ${bg} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    el.innerText = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };