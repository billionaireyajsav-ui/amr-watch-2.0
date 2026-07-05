import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Hospitals from '@/pages/Hospitals';
import HospitalProfile from '@/pages/HospitalProfile';
import Patients from '@/pages/Patients';
import Search from '@/pages/Search';
import PatientReport from '@/pages/PatientReport';
import CityMap from '@/pages/CityMap';
import AIAssistant from '@/pages/AIAssistant';
import Alerts from '@/pages/Alerts';
import Reports from '@/pages/Reports';
import SettingsPage from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/hospitals"
                  element={<ProtectedRoute roles={['administrator', 'health_authority']}><Hospitals /></ProtectedRoute>}
                />
                <Route path="/hospitals/:id" element={<HospitalProfile />} />
                <Route
                  path="/patients"
                  element={<ProtectedRoute roles={['administrator', 'hospital']}><Patients /></ProtectedRoute>}
                />
                <Route path="/patients/:id/report" element={<PatientReport />} />
                <Route path="/search" element={<Search />} />
                <Route path="/map" element={<CityMap />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
