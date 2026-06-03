import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kyc from './pages/Kyc';
import Users from './pages/Users';
import Support from './pages/Support';
import Settings from './pages/Settings';
import Tontines from './pages/Tontines';
import Transactions from './pages/Transactions';
import Notifications from './pages/Notifications';
import AuditLogs from './pages/AuditLogs';

// Protected Route Component to enforce authentication
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('nkap_admin_token');
  const userStr = localStorage.getItem('nkap_admin_user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }
  
  const user = JSON.parse(userStr);
  if (user.role === 'MEMBER') {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/kyc" 
          element={
            <ProtectedRoute>
              <Kyc />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/users" 
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/support" 
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tontines" 
          element={
            <ProtectedRoute>
              <Tontines />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/transactions" 
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/audit-logs" 
          element={
            <ProtectedRoute>
              <AuditLogs />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />

        {/* Fallback to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
