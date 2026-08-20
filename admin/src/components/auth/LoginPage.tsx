import React from 'react';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const handleGithubLogin = () => {
    // Top-level browser navigation to OAuth initiation endpoint
    window.location.href = '/api/v1/auth/github';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.06) 0%, var(--bg-app, #080c14) 60%)',
        color: 'var(--text-primary, #f1f5f9)',
        padding: '24px',
        fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-card, #111827)',
          border: '1px solid var(--border-primary, rgba(148, 163, 184, 0.12))',
          borderRadius: '20px',
          padding: '44px 36px 40px',
          boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.04)',
          textAlign: 'center'
        }}
      >
        {/* Header Icon */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 24px -4px rgba(56, 189, 248, 0.3)'
          }}
        >
          <Lock size={24} color="#0c1221" />
        </div>

        {/* Titles */}
        <h1
          style={{
            fontSize: '1.35rem',
            fontWeight: 700,
            margin: '0 0 6px',
            letterSpacing: '-0.03em',
            color: 'var(--text-primary, #f1f5f9)'
          }}
        >
          Dr. Lohith J.J.
        </h1>
        <p
          style={{
            fontSize: '0.825rem',
            color: 'var(--text-dim, #64748b)',
            margin: '0 0 36px',
            lineHeight: 1.6
          }}
        >
          Portfolio Administration Console
          <br />
          Authenticate with your authorized GitHub account.
        </p>

        {/* Login Button */}
        <button
          type="button"
          onClick={handleGithubLogin}
          id="btn-github-login"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: '#f1f5f9',
            color: '#111827',
            border: 'none',
            borderRadius: '10px',
            padding: '13px 20px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.33, 1, 0.68, 1)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            letterSpacing: '0.01em'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* GitHub SVG Icon */}
          <svg
            height="18"
            width="18"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{ flexShrink: 0 }}
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span>Continue with GitHub</span>
          <ArrowRight size={15} />
        </button>

        {/* Security Footer Badge */}
        <div
          style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-primary, rgba(148, 163, 184, 0.12))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            fontSize: '0.725rem',
            color: 'var(--text-dim, #64748b)'
          }}
        >
          <ShieldCheck size={14} color="#34d399" />
          <span>HttpOnly sessions • Edge-secured</span>
        </div>
      </div>
    </div>
  );
};
