"use client";
import React, { useState } from "react";
import {
  LayoutDashboard,
  MessageSquareText,
  Search,
  ScanSearch,
  Wrench,
  Cpu,
  History,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Activity,
} from "lucide-react";
import { API_BASE, apiUrl } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

export type View =
  | "dashboard"
  | "chat"
  | "history"
  | "cve"
  | "screening"
  | "tools"
  | "integrations"
  | "settings";

interface SidebarProps {
  active: View;
  onChange: (view: View) => void;
  backendOnline: boolean | null;
  user: AuthUser;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  active,
  onChange,
  backendOnline,
  user,
  onLogout,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const mainNav: { id: View; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "chat", label: "Threat Intel Chat", icon: MessageSquareText },
    { id: "history", label: "Chat History", icon: History },
    { id: "cve", label: "CVE Analysis", icon: Search },
    { id: "screening", label: "Vulnerability Scanner", icon: ScanSearch },
  ];

  const secondaryNav: { id: View; label: string; icon: any }[] = [
    { id: "tools", label: "MCP Tools", icon: Wrench },
    { id: "integrations", label: "Plugins & OAuth", icon: Cpu },
    { id: "settings", label: "Profile & Settings", icon: Settings },
  ];

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CT";

  return (
    <aside className={`saas-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-mark-saas">
          <Shield size={20} />
        </div>
        {!collapsed && (
          <div className="brand-text-saas">
            <b>
              CYBER<span>INTEL</span>
            </b>
            <small>DEFENSIVE SECURITY</small>
          </div>
        )}
        <button
          type="button"
          className="collapse-toggle"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation Group 1: Workspace */}
      <div className="nav-group">
        {!collapsed && <div className="nav-section-label">INVESTIGATION</div>}
        <nav className="nav-items-list">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`saas-nav-btn ${isActive ? "active" : ""}`}
                onClick={() => onChange(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="nav-icon" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Navigation Group 2: Platform & Governance */}
      <div className="nav-group">
        {!collapsed && <div className="nav-section-label">PLATFORM</div>}
        <nav className="nav-items-list">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`saas-nav-btn ${isActive ? "active" : ""}`}
                onClick={() => onChange(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className="nav-icon" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Section & Logout */}
      <div className="sidebar-bottom-section">
        <div className="sidebar-user-card" onClick={() => onChange("settings")}>
          <div className="user-avatar-mini">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="avatar-img-mini" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          {!collapsed && (
            <div className="user-text-meta">
              <span className="user-name-label">{user.full_name}</span>
              <span className="user-role-label">SOC Analyst</span>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              className="quick-logout-btn"
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>

        {/* System connectivity pill */}
        {!collapsed && (
          <div className="backend-status-pill">
            <span
              className={`dot-indicator ${
                backendOnline ? "online" : backendOnline === false ? "offline" : "pending"
              }`}
            />
            <span className="status-text">
              {backendOnline ? "API Online" : backendOnline === false ? "API Offline" : "Connecting..."}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
