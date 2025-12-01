import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Login from './component/Login';
import Dashboard from './component/Dashboard';
import MeetingRoom from './component/MeetingRoom';
import StudentJoin from './component/StudentJoin';

// --- Wrapper Component for Room Logic ---
const RoomRoute = ({ user }) => {
  const { roomId } = useParams();
  const [guestName, setGuestName] = useState(null);

  // 1. Host Logic: If logged in, go straight to room
  if (user) {
    return (
      <MeetingRoom 
        classData={{ id: roomId, title: `Class ${roomId}` }} 
        user={user} 
        onLeave={() => window.location.href = '/dashboard'} 
      />
    );
  }

  // 2. Guest Logic: If no name yet, show Join Form
  if (!guestName) {
    return <StudentJoin roomId={roomId} onJoin={(name) => setGuestName(name)} />;
  }

  // 3. Guest Logic: Name entered, show Room
  const guestUser = { name: guestName, role: 'student' };
  
  return (
    <MeetingRoom 
      classData={{ id: roomId, title: `Class ${roomId}` }} 
      user={guestUser} 
      onLeave={() => window.location.href = '/'} 
    />
  );
};

// --- Main Application ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session from local storage on startup
  useEffect(() => {
    const savedUser = localStorage.getItem('vcv_user_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('vcv_user_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vcv_user_session');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Root: Redirect based on auth status */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        
        {/* 2. Login: Redirects to dashboard if already logged in */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <Login onLoginSuccess={handleLogin} />} 
        />

        {/* 3. Dashboard: Protected Route */}
        <Route 
          path="/dashboard" 
          element={
            user ? (
              <Dashboard user={user} onLogout={handleLogout} /> 
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* 4. Room: Handles both Hosts and Guests */}
        <Route path="/room/:roomId" element={<RoomRoute user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}