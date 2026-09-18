import React from 'react';
import { LogOut, GraduationCap, Shield, User, BookOpen } from 'lucide-react';
import { authStorage } from '../services/api';
import ucjIcon from '../assets/logo/ucj-icon.png';

export default function Navbar({ user, onLogout }) {
  if (!user) return null;

  const roleLabels = {
    admin: { label: 'Administrator', icon: Shield, class: 'role-admin' },
    teacher: { label: 'Teacher', icon: BookOpen, class: 'role-teacher' },
    student: { label: 'Student', icon: GraduationCap, class: 'role-student' }
  };

  const roleInfo = roleLabels[user.role] || { label: user.role, icon: User, class: '' };
  const RoleIcon = roleInfo.icon;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <div className="logo-badge" style={{ background: 'transparent', boxShadow: 'none', display: 'flex', alignItems: 'center' }}>
            <img src={ucjIcon} alt="UCJ Icon" style={{ height: '36px', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ lineHeight: 1.1 }}>SmartClassroom</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              University College of Jaffna
            </span>
          </div>
        </div>

        <div className="navbar-user">
          <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>

          <div className={`user-role-badge ${roleInfo.class}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RoleIcon size={13} />
            <span>{roleInfo.label}</span>
          </div>

          <button
            onClick={onLogout}
            className="btn btn-secondary btn-sm"
            title="Sign Out"
            style={{ padding: '0.4rem 0.65rem' }}
          >
            <LogOut size={16} />
            <span style={{ marginLeft: '4px' }}>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
