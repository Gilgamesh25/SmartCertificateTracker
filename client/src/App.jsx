// client/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ParticipantLogin from './components/ParticipantLogin';
import EvaluationForm from './components/EvaluationForm';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ParticipantLogin />} />
        <Route path="/evaluation" element={<EvaluationForm />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;