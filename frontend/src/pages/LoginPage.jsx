import React from 'react';
import StudentLoginPage from './StudentLoginPage';

/**
 * Standard /login entrypoint: Defaulting directly to Student Portal.
 */
export default function LoginPage(props) {
  return <StudentLoginPage {...props} />;
}
