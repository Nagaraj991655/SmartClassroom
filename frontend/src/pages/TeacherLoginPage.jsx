import React from 'react';
import HumanAuthLayout from '../components/HumanAuthLayout';
import teacherBg from '../assets/images/teacher-login-bg.jpg';

export default function TeacherLoginPage({ onLoginSuccess }) {
  return (
    <HumanAuthLayout
      role="teacher"
      portalBadge="Faculty & Staff Portal"
      title="Faculty Sign In"
      subtitle="Sign in with your staff ID to publish course assignments, inspect student submission documents, and evaluate grades."
      idLabel="Teacher ID"
      idPlaceholder="Enter your staff ID"
      inputType="text"
      backgroundImage={teacherBg}
      imageCaption="University College of Jaffna · Faculty & Academic Complex"
      onLoginSuccess={onLoginSuccess}
    />
  );
}
