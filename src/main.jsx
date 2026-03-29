import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLoginPage onLogin={(u) => {
          localStorage.setItem('token', u.token || localStorage.getItem('token'));
          localStorage.setItem('user', JSON.stringify(u));
          window.location.href = '/';
        }} />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
