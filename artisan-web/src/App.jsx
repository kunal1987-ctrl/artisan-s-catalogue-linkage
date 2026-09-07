import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AuthModal from './components/AuthModal.jsx';

import DashboardLayout from './DashboardLayout.jsx';
import Auth from './pages/Auth.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Orders from './pages/Orders.jsx';
import Capture from './pages/Capture.jsx';
import Review from './pages/Review.jsx';
import Success from './pages/Success.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthModal />
        <Routes>
          {/* Fullscreen Root Flow */}
          <Route path="/" element={<Auth />} />
          <Route path="/capture" element={<Capture />} />
          <Route path="/review" element={<Review />} />
          <Route path="/success" element={<Success />} />
          <Route path="/details" element={<Navigate to="/success" replace />} />

          {/* Persistent Dashboard Layout Flow */}
          <Route element={<DashboardLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalogue" element={<Navigate to="/catalog" replace />} />
            <Route path="/orders" element={<Orders />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
