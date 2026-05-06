
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import type { ReactNode } from 'react'
import { getAuthUser } from './api/auth'
import type { FeatureKey } from './api/features'
import { useFeatureFlags } from './hooks/useFeatureFlags'
import Login from './pages/Login'
import Dashboard from './pages/dashboard'
import Leads from './pages/leads'
import Teams from './pages/teams'
import Sales from './pages/sales'
import Calendar from './pages/calendar'
import Profile from './pages/profile'
import Settings from './pages/settings'
import Messages from './pages/messages'
import KnowledgeBase from './pages/knowledge-base'
import Tasks from './pages/tasks'
import AdminDashboard from './pages/admin/dashboard'
import AdminTeams from './pages/admin/teams'
import AdminEmployees from './pages/admin/employees'
import AdminHr from './pages/admin/hr'
import AdminSettings from './pages/admin/settings'
import AdminLeads from './pages/admin/leads'
import AdminKnowledgeBase from './pages/admin/knowledge-base'
import AdminMedia from './pages/admin/media'
import AdminTasks from './pages/admin/tasks'
import PayrollPage from './pages/admin/payroll'
import Credentials from './pages/admin/credentials'

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

function FeatureRoute({ children, feature, scope }: { children: ReactNode; feature: FeatureKey; scope: 'admin' | 'employee' }) {
  const { isLoading, isEnabled } = useFeatureFlags()

  if (isLoading) {
    return <div className="min-h-screen bg-[#070910] p-6 text-sm text-white/50">Loading feature access...</div>
  }

  if (!isEnabled(feature, scope)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070910] p-6 text-white">
        <div className="max-w-[28rem] rounded-lg border border-white/10 bg-white/[0.04] p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Feature Disabled</p>
          <h1 className="mt-2 text-xl font-semibold">This module is turned off</h1>
          <p className="mt-2 text-sm leading-6 text-white/55">Ask an admin to enable it in Settings → Features.</p>
        </div>
      </div>
    )
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute type="employee"><FeatureRoute feature="dashboard" scope="employee"><Dashboard /></FeatureRoute></ProtectedRoute>} />
        <Route path="/leads" element={<ProtectedRoute type="employee"><FeatureRoute feature="leads" scope="employee"><Leads /></FeatureRoute></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute type="employee"><FeatureRoute feature="tasks" scope="employee"><Tasks /></FeatureRoute></ProtectedRoute>} />
        <Route path="/knowledge-base" element={<ProtectedRoute type="employee"><FeatureRoute feature="knowledge-base" scope="employee"><KnowledgeBase /></FeatureRoute></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute type="employee"><FeatureRoute feature="teams" scope="employee"><Teams /></FeatureRoute></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute type="employee"><FeatureRoute feature="sales" scope="employee"><Sales /></FeatureRoute></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute type="employee"><FeatureRoute feature="calendar" scope="employee"><Calendar /></FeatureRoute></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute type="employee"><FeatureRoute feature="profile" scope="employee"><Profile /></FeatureRoute></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute type="employee"><FeatureRoute feature="settings" scope="employee"><Settings /></FeatureRoute></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute type="employee"><FeatureRoute feature="messages" scope="employee"><Messages /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute type="admin"><FeatureRoute feature="dashboard" scope="admin"><AdminDashboard /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/teams" element={<ProtectedRoute type="admin"><FeatureRoute feature="teams" scope="admin"><AdminTeams /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/employees" element={<ProtectedRoute type="admin"><FeatureRoute feature="employees" scope="admin"><AdminEmployees /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/hr" element={<ProtectedRoute type="admin"><FeatureRoute feature="hr" scope="admin"><AdminHr /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute type="admin"><FeatureRoute feature="settings" scope="admin"><AdminSettings /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/leads" element={<ProtectedRoute type="admin"><FeatureRoute feature="leads" scope="admin"><AdminLeads /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/tasks" element={<ProtectedRoute type="admin"><FeatureRoute feature="tasks" scope="admin"><AdminTasks /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/knowledge-base" element={<ProtectedRoute type="admin"><FeatureRoute feature="knowledge-base" scope="admin"><AdminKnowledgeBase /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/knowledge-base/*" element={<ProtectedRoute type="admin"><FeatureRoute feature="knowledge-base" scope="admin"><AdminKnowledgeBase /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/media" element={<ProtectedRoute type="admin"><FeatureRoute feature="media" scope="admin"><AdminMedia /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute type="admin"><FeatureRoute feature="messages" scope="admin"><Messages /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/payroll" element={<ProtectedRoute type="admin"><FeatureRoute feature="payroll" scope="admin"><PayrollPage /></FeatureRoute></ProtectedRoute>} />
        <Route path="/admin/credentials" element={<ProtectedRoute type="admin"><FeatureRoute feature="credentials" scope="admin"><Credentials /></FeatureRoute></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
