import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import AuthModal from './components/AuthModal.jsx';
import AtmLanguageSelector from './components/AtmLanguageSelector.jsx';

import DevOrderSimulator from './components/DevOrderSimulator.jsx';
import DashboardLayout from './DashboardLayout.jsx';
import Auth from './pages/Auth.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Catalog from './pages/Catalog.jsx';
import Orders from './pages/Orders.jsx';
import Capture from './pages/Capture.jsx';
import AiStudio from './pages/AiStudio.jsx';
import Review from './pages/Review.jsx';
import Success from './pages/Success.jsx';
import Details from './pages/Details.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import PublicProduct from './pages/PublicProduct.jsx';
import Support from './pages/Support.jsx';
import Onboarding from './pages/Onboarding.jsx';
import AuthGuard from './components/AuthGuard.jsx';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        {/* Dev-only floating order simulator — stripped in production build */}
        <DevOrderSimulator />
        <BrowserRouter>
          <AuthModal />
          <AtmLanguageSelector mode="modal" />
          <Routes>
          {/* Fullscreen Root & Public Flows */}
          <Route path="/" element={<Auth />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/onboarding"
            element={
              <AuthGuard>
                <Onboarding />
              </AuthGuard>
            }
          />
          <Route
            path="/capture"
            element={
              <AuthGuard>
                <Capture />
              </AuthGuard>
            }
          />
          <Route
            path="/studio"
            element={
              <AuthGuard>
                <AiStudio />
              </AuthGuard>
            }
          />
          <Route
            path="/aistudio"
            element={
              <AuthGuard>
                <AiStudio />
              </AuthGuard>
            }
          />
          <Route
            path="/ai-studio"
            element={
              <AuthGuard>
                <AiStudio />
              </AuthGuard>
            }
          />
          <Route
            path="/review"
            element={
              <AuthGuard>
                <Review />
              </AuthGuard>
            }
          />
          <Route path="/success" element={<Success />} />
          {/* Public buyer-facing PDP (shareable via WhatsApp, accessible without auth) */}
          <Route path="/product/:id" element={<PublicProduct />} />
          <Route path="/p/:id" element={<PublicProduct />} />

          {/* Protected Dashboard Layout Flow */}
          <Route
            element={
              <AuthGuard>
                <DashboardLayout />
              </AuthGuard>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalogue" element={<Navigate to="/catalog" replace />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/details/:id" element={<Details />} />
            <Route path="/details" element={<Details />} />
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
