import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :root {
    --color-primary: #F97316;
    --color-primary-dark: #E05A00;
    --color-primary-glow: rgba(249, 115, 22, 0.32);
    --color-primary-subtle: rgba(249, 115, 22, 0.08);
    --color-bg: #0A0A0A;
    --color-surface: #141414;
    --color-surface-2: #1E1E1E;
    --color-border: #2A2A2A;
    --color-text: #FAFAFA;
    --color-text-muted: #A1A1AA;
    --color-success: #22C55E;
    --color-danger: #EF4444;
    --color-warning: #F59E0B;
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --radius-xl: 26px;
    --shadow-card: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.07), 0 20px 60px rgba(0,0,0,0.1);
    --shadow-btn: 0 4px 20px var(--color-primary-glow), 0 1px 3px rgba(0,0,0,0.1);
    --gradient-primary: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
    --transition-theme: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }

  [data-theme="light"] {
    --color-bg: #F2F0ED;
    --color-surface: #FFFFFF;
    --color-surface-2: #F7F5F2;
    --color-border: #E8E4DF;
    --color-text: #0D0D0D;
    --color-text-muted: #78716C;
    --color-primary-subtle: rgba(249, 115, 22, 0.07);
    --shadow-card: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 20px 60px rgba(0,0,0,0.09);
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    background: var(--color-bg);
    color: var(--color-text);
    min-height: 100vh;
    line-height: 1.5;
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
  ::-webkit-scrollbar-track { background: var(--color-surface); }
  ::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--color-text-muted); }

  *, *::before, *::after {
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.15s ease;
  }

  button, a, input, select, textarea {
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.15s ease,
      box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
  }
`;

export default GlobalStyle;
