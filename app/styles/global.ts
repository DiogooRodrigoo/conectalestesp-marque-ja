import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :root {
    /* ── Brand ─────────────────────────────────────────────── */
    --color-primary:        #F97316;
    --color-primary-dark:   #EA580C;
    --color-primary-rgb:    249, 115, 22;
    --color-primary-glow:   rgba(249, 115, 22, 0.30);
    --color-primary-subtle: rgba(249, 115, 22, 0.08);

    /* ── Surface ────────────────────────────────────────────── */
    --color-bg:        #f1f5f9;
    --color-surface:   rgba(255, 255, 255, 0.72);
    --color-surface-2: rgba(255, 255, 255, 0.50);
    --color-border:    rgba(255, 255, 255, 0.55);

    /* ── Text ───────────────────────────────────────────────── */
    --color-text:       #111827;
    --color-text-muted: #6B7280;

    /* ── Semantic ───────────────────────────────────────────── */
    --color-success: #22C55E;
    --color-danger:  #EF4444;
    --color-warning: #F59E0B;

    /* ── Radius ─────────────────────────────────────────────── */
    --radius-sm:  8px;
    --radius-md:  14px;
    --radius-lg:  20px;
    --radius-xl:  26px;
    --radius-2xl: 32px;

    /* ── Glass ──────────────────────────────────────────────── */
    --glass-bg:     rgba(255, 255, 255, 0.72);
    --glass-blur:   blur(28px);
    --glass-border: 1px solid rgba(255, 255, 255, 0.55);

    /* ── Shadow ─────────────────────────────────────────────── */
    --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);
    --shadow-card-hover: 0 16px 48px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
    --shadow-btn:  0 4px 20px rgba(249, 115, 22, 0.35), 0 1px 3px rgba(0, 0, 0, 0.1);

    /* ── Gradient ───────────────────────────────────────────── */
    --gradient-primary: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
    --transition-theme: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }

  [data-theme="dark"] {
    --color-bg:        #0c0c0e;
    --color-surface:   rgba(30, 30, 36, 0.80);
    --color-surface-2: rgba(40, 40, 48, 0.70);
    --color-border:    rgba(255, 255, 255, 0.08);
    --color-text:      #F9FAFB;
    --color-text-muted: #9CA3AF;
    --glass-bg:     rgba(24, 24, 30, 0.80);
    --glass-border: 1px solid rgba(255, 255, 255, 0.07);
    --shadow-card: 0 4px 24px rgba(0, 0, 0, 0.25), 0 1px 4px rgba(0, 0, 0, 0.15);
    --shadow-card-hover: 0 16px 48px rgba(0, 0, 0, 0.40), 0 4px 12px rgba(0, 0, 0, 0.20);
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background-color: var(--color-bg);
    background-image:
      radial-gradient(ellipse 60% 50% at 0% 0%,   rgba(249, 115, 22, 0.12) 0%, transparent 70%),
      radial-gradient(ellipse 50% 40% at 100% 0%,  rgba(251, 146, 60, 0.10) 0%, transparent 65%),
      radial-gradient(ellipse 55% 45% at 100% 100%, rgba(234, 88, 12,  0.09) 0%, transparent 70%),
      radial-gradient(ellipse 50% 40% at 0% 100%,  rgba(245, 158, 11, 0.08) 0%, transparent 65%),
      radial-gradient(ellipse 40% 35% at 50% 50%,  rgba(249, 115, 22, 0.05) 0%, transparent 70%);
    background-attachment: fixed;
    color: var(--color-text);
    min-height: 100vh;
    line-height: 1.5;
  }

  [data-theme="dark"] body {
    background-image:
      radial-gradient(ellipse 60% 50% at 0% 0%,   rgba(249, 115, 22, 0.08) 0%, transparent 70%),
      radial-gradient(ellipse 50% 40% at 100% 0%,  rgba(251, 146, 60, 0.06) 0%, transparent 65%),
      radial-gradient(ellipse 55% 45% at 100% 100%, rgba(234, 88, 12,  0.06) 0%, transparent 70%),
      radial-gradient(ellipse 50% 40% at 0% 100%,  rgba(245, 158, 11, 0.05) 0%, transparent 65%);
  }

  h1, h2, h3 {
    font-family: 'Cabinet Grotesk', inherit;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
  }

  input, textarea, select {
    font-family: inherit;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }

  *, *::before, *::after {
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.15s ease;
  }

  button, a, input, select, textarea {
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.15s ease,
      box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
  }
`;

export default GlobalStyle;
