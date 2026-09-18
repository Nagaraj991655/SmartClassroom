import React from 'react';
import HumanAuthLayout from '../components/HumanAuthLayout';
import studentBg from '../assets/images/student-login-bg.jpg';

export default function StudentLoginPage({ onLoginSuccess }) {
  return (
    <HumanAuthLayout
      role="student"
      portalBadge="Student Portal"
      title="Student Sign In"
      subtitle="Sign in with your student index number to access course assignments, submit answer files, and track your evaluated grades."
      idLabel="Student ID"
      idPlaceholder="Enter your student ID"
      inputType="text"
      backgroundImage={studentBg}
      imageCaption="University College of Jaffna · Student Campus"
      onLoginSuccess={onLoginSuccess}
    />
  );
}
