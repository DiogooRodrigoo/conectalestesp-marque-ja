import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :root {
    --color-primary: #F97316;
    --color-primary-dark: #EA6C0A;
    --color-bg: #0A0A0A;
    --color-surface: #141414;
    --color-surface-2: #1E1E1E;
    --color-border: #2A2A2A;
    --color-text: #FAFAFA;
    --color-text-muted: #A1A1AA;
    --color-success: #22C55E;
    --color-danger: #EF4444;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --transition-theme: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }

  [data-theme="light"] {
    --color-bg: #F4F4F5;
    --color-surface: #FFFFFF;
    --color-surface-2: #EFEFEF;
    --color-border: #E4E4E7;
    --color-text: #09090B;
    --color-text-muted: #71717A;
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

  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: var(--color-surface);
    transition: var(--transition-theme);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 3px;
    transition: var(--transition-theme);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-muted);
  }

  *, *::before, *::after {
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.15s ease;
  }

  button, a, input, select, textarea {
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.15s ease,
      box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
  }
`;

export default GlobalStyle;
