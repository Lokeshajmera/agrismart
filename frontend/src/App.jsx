import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import OfflineBanner from './components/OfflineBanner';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import FarmMap from './pages/FarmMap';
import SensorMonitoring from './pages/SensorMonitoring';
import AICropIntelligence from './pages/AICropIntelligence';
import IrrigationControl from './pages/IrrigationControl';
import Recommendations from './pages/Recommendations';
import AlertsNotifications from './pages/AlertsNotifications';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import GovernmentSchemes from './pages/GovernmentSchemes';
import AdminDashboard from './pages/AdminDashboard';
import ComplaintForm from './pages/ComplaintForm';
import SuggestionForm from './pages/SuggestionForm';
import ProtectedRoute from './components/ProtectedRoute';
import OwnerDashboard from './pages/OwnerDashboard';
import SimulationMode from './pages/SimulationMode';

function App() {
  return (
    <>
      <OfflineBanner />
      <BrowserRouter>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="map" element={<FarmMap />} />
            <Route path="sensors" element={<SensorMonitoring />} />
            <Route path="irrigation" element={<IrrigationControl />} />
            <Route path="insights" element={<AICropIntelligence />} />
            <Route path="recommendations" element={<Recommendations />} />
            <Route path="schemes" element={<GovernmentSchemes />} />
            <Route path="alerts" element={<AlertsNotifications />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="complaint" element={<ComplaintForm />} />
            <Route path="suggestion" element={<SuggestionForm />} />
            <Route path="simulation" element={<SimulationMode />} />
          </Route>
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Owner Target Route */}
        <Route path="/owner-dashboard" element={<OwnerDashboard />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
