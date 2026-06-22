/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Budgets from './pages/Budgets';
import Cards from './pages/Cards';
import Goals from './pages/Goals';
import Stats from './pages/Stats';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            {/* Fallback for undefined routes within the layout */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

