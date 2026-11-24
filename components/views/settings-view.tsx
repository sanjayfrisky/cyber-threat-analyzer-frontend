"use client";
import React, { useState } from "react";
import {
  User,
  Shield,
  KeyRound,
  Mail,
  Calendar,
  LogOut,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { AuthUser } from "@/lib/types";
import { apiUrl } from "@/lib/api";

export function SettingsView({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CT";

  return (
    <div className="settings-view-container">
      <div className="view-header">
        <div>
          <div className="eyebrow">ANALYST PROFILE & SECURITY</div>
          <h2>Account Settings</h2>
          <p>Manage your identity, session credentials, and security preferences.</p>
        </div>
      </div>

      {/* User profile card */}
      <div className="profile-hero-card">
        <div className="profile-avatar-large">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="avatar-img" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="profile-hero-info">
          <h3>{user.full_name}</h3>
          <p className="profile-email">
            <Mail size={14} /> {user.email}
          </p>
          <div className="profile-tags">
            <span className="badge-pill">
              {user.auth_provider === "google" ? "Google OAuth 2.0" : "Analyst Account"}
            </span>
            <span className="badge-pill green">Active SOC Session</span>
          </div>
        </div>
      </div>

      {/* Profile details grid */}
      <div className="settings-sections">
        <div className="settings-card">
          <div className="card-header">
            <User size={18} className="accent-blue" />
            <h4>Analyst Identity</h4>
          </div>
          <div className="setting-field">
            <label>Full Name / Handle</label>
            <input type="text" value={user.full_name} readOnly disabled />
          </div>
          <div className="setting-field">
            <label>Registered Email</label>
            <input type="email" value={user.email} readOnly disabled />
          </div>
          <div className="setting-field">
            <label>Authentication Authority</label>
            <input
              type="text"
              value={user.auth_provider === "google" ? "Google Identity Services (GSI)" : "Local PostgreSQL Database"}
              readOnly
              disabled
            />
          </div>
        </div>

        <div className="settings-card">
          <div className="card-header">
            <Lock size={18} className="accent-orange" />
            <h4>Security & Token Governance</h4>
          </div>
          <p className="setting-help-text">
            Your session is secured via SHA-256 JWT tokens with automatic HttpOnly cookie binding.
          </p>

          <div className="security-notice-box">
            <CheckCircle2 size={16} className="accent-green" />
            <span>Session cookies are protected with Strict SameSite policy.</span>
          </div>

          <div className="signout-section">
            <button type="button" className="btn btn-danger" onClick={onLogout}>
              <LogOut size={16} />
              <span>Sign Out from SOC Console</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
