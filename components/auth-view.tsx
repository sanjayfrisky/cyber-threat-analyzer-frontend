"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
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

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
            isDismissedMoment: () => boolean;
            getNotDisplayedReason: () => string;
            getSkippedReason: () => string;
            getDismissedReason: () => string;
          }) => void) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string | number;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

interface AuthViewProps {
  initialMode?: "login" | "register";
  onSuccess?: () => void;
}

export function AuthView({ initialMode = "login", onSuccess }: AuthViewProps) {
  const { login, loginWithGoogle, register } = useAuth();
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  const handleGoogleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      if (!response.credential) {
        setError("Google authentication did not provide credentials.");
        return;
      }
      setGoogleLoading(true);
      setError(null);
      setSuccessMsg(null);
      try {
        await loginWithGoogle(response.credential, true);
        setSuccessMsg("Google authorization verified! Redirecting to workspace...");
        if (onSuccess) onSuccess();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Google authentication failed.";
        setError(msg);
      } finally {
        setGoogleLoading(false);
      }
    },
    [loginWithGoogle, onSuccess]
  );

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }

    const scriptId = "google-gsi-client";
    const existing = document.getElementById(scriptId);
    if (!existing) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setGisLoaded(true);
      script.onerror = () => {
        console.warn("Failed to load Google Identity Services SDK.");
      };
      document.head.appendChild(script);
    } else {
      setGisLoaded(true);
    }
  }, []);

  // Initialize GIS client once loaded
  useEffect(() => {
    if (!gisLoaded || !window.google?.accounts?.id || !googleClientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render official GIS button if container is mounted
      if (googleBtnContainerRef.current) {
        googleBtnContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          text: mode === "login" ? "signin_with" : "signup_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: 380,
        });
      }
    } catch (e) {
      console.warn("Error initializing Google Identity Services:", e);
    }
  }, [gisLoaded, googleClientId, mode, handleGoogleCredentialResponse]);

  const handleGoogleClick = () => {
    setError(null);
    if (!googleClientId) {
      setError("Google Client ID is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
      return;
    }

    if (!window.google?.accounts?.id) {
      setError("Google authentication service is loading. Please try again in a moment.");
      return;
    }

    setGoogleLoading(true);
    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (res) => {
          handleGoogleCredentialResponse(res);
        },
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setGoogleLoading(false);
          const reason =
            notification.getNotDisplayedReason?.() ||
            notification.getSkippedReason?.() ||
            "Popup prompt suppressed.";
          console.log("GIS prompt notification:", reason);
        } else if (notification.isDismissedMoment()) {
          setGoogleLoading(false);
        }
      });
    } catch (err: unknown) {
      setGoogleLoading(false);
      const msg = err instanceof Error ? err.message : "Unable to launch Google Sign-In prompt.";
      setError(msg);
    }
  };

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

  const isProcessing = loading || googleLoading;

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
            disabled={isProcessing}
          >
            <Lock size={15} /> Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => switchMode("register")}
            disabled={isProcessing}
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

        {/* Google Authentication Button */}
        <button
          type="button"
          className="google-auth-btn"
          onClick={handleGoogleClick}
          disabled={isProcessing}
          aria-label="Continue with Google"
        >
          {googleLoading ? (
            <>
              <Loader2 size={18} className="spin text-blue-600" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <span className="google-icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              </span>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Hidden / Fallback GIS render button anchor if needed */}
        <div ref={googleBtnContainerRef} style={{ display: "none" }} />

        {/* Visual Divider */}
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

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
                  disabled={isProcessing}
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
                disabled={isProcessing}
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
                  disabled={isProcessing}
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
                disabled={isProcessing}
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
                  disabled={isProcessing}
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
                  disabled={isProcessing}
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>
          )}

          {/* Submit Action */}
          <button type="submit" className="auth-submit-btn" disabled={isProcessing}>
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
                disabled={isProcessing}
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
                disabled={isProcessing}
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
