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
        background: 'var(--bg-primary, #0f172a)',
        color: 'var(--text-primary, #f8fafc)',
        padding: '24px',
        fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-secondary, #1e293b)',
          border: '1px solid var(--border-color, #334155)',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
          textAlign: 'center'
        }}
      >
        {/* Header Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
          }}
        >
          <Lock size={28} color="#ffffff" />
        </div>

        {/* Titles */}
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: '0 0 8px',
            letterSpacing: '-0.025em'
          }}
        >
          Dr. Lohith J.J.
        </h1>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-muted, #94a3b8)',
            margin: '0 0 32px',
            lineHeight: 1.5
          }}
        >
          Academic Portfolio Administration Dashboard. Please authenticate with your authorized GitHub account.
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
            gap: '12px',
            background: '#24292f',
            color: '#ffffff',
            border: '1px solid #444c56',
            borderRadius: '10px',
            padding: '14px 20px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#2f363d';
            e.currentTarget.style.borderColor = '#57606a';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = '#24292f';
            e.currentTarget.style.borderColor = '#444c56';
          }}
        >
          {/* GitHub SVG Icon */}
          <svg
            height="20"
            width="20"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{ flexShrink: 0 }}
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span>Continue with GitHub</span>
          <ArrowRight size={16} />
        </button>

        {/* Security Footer Badge */}
        <div
          style={{
            marginTop: '32px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color, #334155)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: 'var(--text-muted, #94a3b8)'
          }}
        >
          <ShieldCheck size={16} color="#10b981" />
          <span>Protected by D1 Session & HttpOnly Cookies</span>
        </div>
      </div>
    </div>
  );
};
