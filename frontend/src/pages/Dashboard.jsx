import React, { useContext } from 'react';
import { AuthContext } from '../App.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import PersonalDashboard from './PersonalDashboard.jsx';

export default function Dashboard() {
  const { role } = useContext(AuthContext);
  return role === 'admin' ? <AdminDashboard /> : <PersonalDashboard />;
}
