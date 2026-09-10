import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';

import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { FloatingChatbot } from './components/chatbot/FloatingChatbot';
import { OfflineBanner } from './components/common/OfflineBanner';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { WeatherPage } from './pages/WeatherPage';
import { CropAnalysisPage } from './pages/CropAnalysisPage';
import { AnalysisResultPage } from './pages/AnalysisResultPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-agro-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8fafc]">
      <OfflineBanner />
      <Navbar />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Authenticated Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/weather"
            element={
              <ProtectedRoute>
                <WeatherPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crop-analysis"
            element={
              <ProtectedRoute>
                <CropAnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis/:id"
            element={
              <ProtectedRoute>
                <AnalysisResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Floating AI Agronomist Chatbot - Only accessible when farmer is logged in */}
      {isAuthenticated && <FloatingChatbot />}

      <Footer />
    </div>
  );
};

import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ScrollToTop } from './components/common/ScrollToTop';

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <LanguageProvider>
          <NotificationProvider>
            <AuthProvider>
              <LocationProvider>
                <AppContent />
              </LocationProvider>
            </AuthProvider>
          </NotificationProvider>
        </LanguageProvider>
      </Router>
    </ErrorBoundary>
  );
}
