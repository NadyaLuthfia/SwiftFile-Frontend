import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MasterAdminDashboard from './pages/MasterAdminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FileTemplate from './pages/FileTemplate'; 
import SiapCetak from './pages/SiapCetak';
import ArsipHistory from './pages/ArsipHistory';
import Login from './pages/Login';
import DraftDokumen from './pages/DraftDokument'; 
import DraftPenyerahan from './pages/DraftPenyerahan';
import DraftKerusakan from './pages/DraftKerusakan'; 
import ManagementData from './pages/ManagementData';
import DraftSuratTugas from './pages/DraftSuratTugas';
import MonitoringData from './pages/MonitoringData';

function App() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  return (
    <BrowserRouter>
      <Routes>
        
        {/* 🔑 1. RUTE KHUSUS LOGIN (Punya Halaman Sendiri) */}
        <Route 
          path="/login" 
          element={
            !token ? (
              <Login />
            ) : role === 'master_admin' ? (
              <Navigate to="/master-dashboard" replace />
            ) : role === 'admin' ? (
              <Navigate to="/admin-dashboard" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />

        {/* 🔒 2. PROTEKSI TOKEN JIKA BELUM LOGIN */}
        {!token ? (
          // Jika tidak ada token dan coba akses rute apa pun, PAKSA pindah ke URL /login
          <Route path="*" element={<Navigate to="/login" replace />} />
        ) : (
          /* JIKA SUDAH LOGIN, PEMBAGIAN RUTE BERDASARKAN ROLE */
          <>
            {/* 👑 Kelompok Akses: MASTER ADMIN */}
            {role === 'master_admin' && (
              <>
                <Route path="/" element={<Navigate to="/master-dashboard" replace />} />
                <Route path="/master-dashboard" element={<MasterAdminDashboard />} />
                <Route path="/file-template" element={<FileTemplate />} />
                <Route path="/draft-dokumen" element={<DraftDokumen />} />
                <Route path="/draft-surat-tugas" element={<DraftSuratTugas />} />
                <Route path="/draft-penyerahan" element={<DraftPenyerahan />} />
                <Route path="/draft-kerusakan" element={<DraftKerusakan />} /> 
                <Route path="/siap-cetak" element={<SiapCetak />} />
                <Route path="/arsip-history" element={<ArsipHistory />} />
                <Route path="/management-data" element={<ManagementData />} />
                <Route path="/monitoring-data" element={<MonitoringData />} />
                <Route path="*" element={<Navigate to="/master-dashboard" replace />} />
              </>
            )}

            {/* 👥 Kelompok Akses: ADMIN BIASA */}
            {role === 'admin' && (
              <>
                <Route path="/" element={<Navigate to="/admin-dashboard" replace />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/file-template" element={<FileTemplate />} />
                <Route path="/draft-dokumen" element={<DraftDokumen />} />
                <Route path="/draft-surat-tugas" element={<DraftSuratTugas />} />
                <Route path="/draft-penyerahan" element={<DraftPenyerahan />} />
                <Route path="/draft-kerusakan" element={<DraftKerusakan />} /> 
                <Route path="/siap-cetak" element={<SiapCetak />} />
                <Route path="/arsip-history" element={<ArsipHistory />} />
                <Route path="/management-data" element={<ManagementData />} />
                <Route path="/monitoring-data" element={<MonitoringData />} />
                <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
              </>
            )}

            {/* 👤 Kelompok Akses: USER BIASA */}
            {role === 'user' && (
              <>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/file-template" element={<FileTemplate />} />
                <Route path="/draft-dokumen" element={<DraftDokumen />} />
                <Route path="/draft-surat-tugas" element={<DraftSuratTugas />} />
                <Route path="/draft-penyerahan" element={<DraftPenyerahan />} />
                <Route path="/draft-kerusakan" element={<DraftKerusakan />} /> 
                <Route path="/siap-cetak" element={<SiapCetak />} />
                <Route path="/arsip-history" element={<ArsipHistory />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
          </>
        )}

      </Routes>
    </BrowserRouter>
  );
}

export default App;