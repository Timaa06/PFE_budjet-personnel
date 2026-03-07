import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* PAGE D'ACCUEIL (Landing Page) */}
          <Route path="/" element={<LandingPage />} />
          
          {/* AUTHENTIFICATION */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* APPLICATION (Protégée) */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          
          {/* REDIRECTION PAR DÉFAUT */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;