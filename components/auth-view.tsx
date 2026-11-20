"use client";
import React, { useState } from "react";
import {
  Shield,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  KeyRound,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AuthViewProps {
  initialMode?: "login" | "register";
  onSuccess?: () => void;
}

export function AuthView({ initialMode = "login", onSuccess }: AuthViewProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Basic client-side validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your analyst email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "register") {
      if (!fullName.trim()) {
        setError("Please enter your full name or analyst handle.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please verify.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(trimmedEmail, password, rememberMe);
        if (onSuccess) onSuccess();
      } else {
        await register(trimmedEmail, password, fullName.trim());
        setSuccessMsg("Account provisioned successfully! Redirecting to workspace...");
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication request failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand">
          <div className="brand-mark large">
            <Shield size={28} />
          </div>
          <div className="brand-text">
            <h2>
              CYBER<span>INTEL</span>
            </h2>
            <small>DEFENSIVE SECURITY RAG CONSOLE</small>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => switchMode("login")}
          >
            <Lock size={15} /> Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => switchMode("register")}
          >
            <User size={15} /> Create Account
          </button>
        </div>

        {/* Section Heading */}
        <div className="auth-header">
          {mode === "login" ? (
            <>
              <h3>Welcome Back</h3>
              <p>Sign in to access your security intelligence workspace.</p>
            </>
          ) : (
            <>
              <h3>Create Analyst Account</h3>
              <p>Register for access to defensive threat intelligence and screening.</p>
            </>
          )}
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="auth-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="auth-alert success">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {mode === "register" && (
            <div className="auth-field">
              <label htmlFor="auth-fullname">Full Name</label>
              <div className="auth-input-wrapper">
                <User size={17} className="auth-input-icon" />
                <input
                  id="auth-fullname"
                  type="text"
                  placeholder="e.g. John Doe / SOC Lead"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  autoComplete="name"
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Analyst Email</label>
            <div className="auth-input-wrapper">
              <Mail size={17} className="auth-input-icon" />
              <input
                id="auth-email"
                type="email"
                placeholder="analyst@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-field-header">
              <label htmlFor="auth-password">Password</label>
              {mode === "login" && (
                <button
                  type="button"
                  className="auth-link-text"
                  onClick={() => setShowForgotModal(true)}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="auth-input-wrapper">
              <Lock size={17} className="auth-input-icon" />
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder={mode === "register" ? "Minimum 8 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                className="auth-pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode === "register" && (
              <span className="auth-hint">Must contain at least 8 characters.</span>
            )}
          </div>

          {mode === "register" && (
            <div className="auth-field">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <div className="auth-input-wrapper">
                <Lock size={17} className="auth-input-icon" />
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-pwd-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="auth-options">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>
          )}

          {/* Submit Action */}
          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>{mode === "login" ? "Authenticating..." : "Creating Account..."}</span>
              </>
            ) : mode === "login" ? (
              <>
                <ShieldCheck size={18} />
                <span>Sign In to Console</span>
                <ArrowRight size={17} />
              </>
            ) : (
              <>
                <KeyRound size={18} />
                <span>Provision Analyst Account</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Mode Switch Prompt */}
        <div className="auth-footer">
          {mode === "login" ? (
            <p>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="auth-toggle-link"
                onClick={() => switchMode("register")}
              >
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already registered?{" "}
              <button
                type="button"
                className="auth-toggle-link"
                onClick={() => switchMode("login")}
              >
                Sign In to existing workspace
              </button>
            </p>
          )}
        </div>

        {/* Security watermark badge */}
        <div className="auth-security-badge">
          <Terminal size={14} />
          <span>Encrypted with SHA-256 session token · Evidence Triage & RAG Assistant</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="auth-modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <KeyRound size={22} className="accent-blue" />
              <h4>Password Recovery</h4>
            </div>
            <p>
              For security compliance in this defensive intelligence environment, automated password
              resets are managed by your Security Administrator.
            </p>
            <p className="auth-modal-note">
              Please contact your SOC Manager or submit an internal IT ticket to reset credentials.
            </p>
            <button
              type="button"
              className="auth-modal-close-btn"
              onClick={() => setShowForgotModal(false)}
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
