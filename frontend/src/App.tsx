import { AuthProvider } from './store/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Report } from './pages/Report';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report/:scanId" element={<Report />} />
          <Route path="/shared/:slug" element={<Report />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
