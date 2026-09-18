import React from 'react';
import HumanAuthLayout from '../components/HumanAuthLayout';
import adminBg from '../assets/images/admin-login-bg.jpg';

export default function AdminLoginPage({ onLoginSuccess }) {
  return (
    <HumanAuthLayout
      role="admin"
      portalBadge="Institutional Administration"
      title="Administrator Sign In"
      subtitle="Authorized personnel only. Access central governance to oversee faculty, student registries, departments, and system configurations."
      idLabel="Email"
      idPlaceholder="Enter administrator email "
      inputType="email"
      backgroundImage={adminBg}
      imageCaption="University College of Jaffna · Main Administration Entrance"
      onLoginSuccess={onLoginSuccess}
    />
  );
}
