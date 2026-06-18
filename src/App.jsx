import React from 'react';
import { BrowserRouter } from 'react-router-dom'; // 1. Import BrowserRouter
import Dashboard from './pages/Dashboard';
import MasterAdminDashboard from './pages/MasterAdminDashboard';
import SiapCetak from './pages/SiapCetak';
import ArsipHistory from './pages/ArsipHistory';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    // 2. Bungkus komponenmu dengan BrowserRouter
    <BrowserRouter>
      <div className="w-full h-screen bg-slate-50">
        <AdminDashboard />
      </div>
    </BrowserRouter>
  );
}

export default App;