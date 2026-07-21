import { AuthProvider } from './store/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Home } from './pages/Home';
import { Report } from './pages/Report';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-center" toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            fontFamily: 'sans-serif'
          }
        }} />
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
