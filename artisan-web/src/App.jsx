import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import AuthModal from './components/AuthModal.jsx';

import DevOrderSimulator from './components/DevOrderSimulator.jsx';
import DashboardLayout from './DashboardLayout.jsx';
import Auth from './pages/Auth.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Orders from './pages/Orders.jsx';
import Capture from './pages/Capture.jsx';
import Review from './pages/Review.jsx';
import Success from './pages/Success.jsx';
import Details from './pages/Details.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Support from './pages/Support.jsx';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        {/* Dev-only floating order simulator — stripped in production build */}
        <DevOrderSimulator />
        <BrowserRouter>
        <AuthModal />
        <Routes>
          {/* Fullscreen Root Flow */}
          <Route path="/" element={<Auth />} />
          <Route path="/login" element={<Login />} />
          <Route path="/capture" element={<Capture />} />
          <Route path="/review" element={<Review />} />
          <Route path="/success" element={<Success />} />

          {/* Persistent Dashboard Layout Flow */}
          <Route element={<DashboardLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalogue" element={<Navigate to="/catalog" replace />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/details/:id" element={<Details />} />
            <Route path="/details" element={<Details />} />
            {/* Public buyer-facing PDP (shareable via WhatsApp) */}
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="/support" element={<Support />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </LanguageProvider>
  );
}
