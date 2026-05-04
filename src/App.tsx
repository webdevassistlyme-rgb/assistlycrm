
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import type { ReactNode } from 'react'
import { getAuthUser } from './api/auth'
import Login from './pages/Login'
import Dashboard from './pages/dashboard'
import Leads from './pages/leads'
import Teams from './pages/teams'
import Sales from './pages/sales'
import Calendar from './pages/calendar'
import Profile from './pages/profile'
import Settings from './pages/settings'
import Messages from './pages/messages'
import AdminDashboard from './pages/admin/dashboard'
import AdminTeams from './pages/admin/teams'
import AdminEmployees from './pages/admin/employees'
import AdminSettings from './pages/admin/settings'
import AdminLeads from './pages/admin/leads'

function ProtectedRoute({ children, type }: { children: ReactNode; type?: 'admin' | 'employee' }) {
  const authUser = getAuthUser()

  if (!authUser) {
    return <Navigate to="/login" replace />
  }

  if (type && authUser.userType !== type) {
    return <Navigate to={authUser.userType === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute type="employee"><Dashboard /></ProtectedRoute>} />
        <Route path="/leads" element={<ProtectedRoute type="employee"><Leads /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute type="employee"><Teams /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute type="employee"><Sales /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute type="employee"><Calendar /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute type="employee"><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute type="employee"><Settings /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute type="employee"><Messages /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute type="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/teams" element={<ProtectedRoute type="admin"><AdminTeams /></ProtectedRoute>} />
        <Route path="/admin/employees" element={<ProtectedRoute type="admin"><AdminEmployees /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute type="admin"><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/leads" element={<ProtectedRoute type="admin"><AdminLeads /></ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute type="admin"><Messages /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
