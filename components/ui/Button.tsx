"use client";

import styled, { css, keyframes } from "styled-components";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const sizeStyles = {
  sm: css`
    height: 32px;
    padding: 0 12px;
    font-size: 12.5px;
    gap: 6px;
    border-radius: var(--radius-sm);
  `,
  md: css`
    height: 40px;
    padding: 0 16px;
    font-size: 13.5px;
    gap: 8px;
    border-radius: var(--radius-sm);
  `,
  lg: css`
    height: 48px;
    padding: 0 20px;
    font-size: 15px;
    gap: 10px;
    border-radius: var(--radius-md);
  `,
};

const variantStyles = {
  primary: css`
    background: var(--color-primary);
    color: #fff;
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background: var(--color-primary-dark);
    }
    &:active:not(:disabled) {
      transform: scale(0.98);
    }
  `,
  secondary: css`
    background: var(--color-surface-2);
    color: var(--color-text);
    border: 1px solid var(--color-border);

    &:hover:not(:disabled) {
      background: #262626;
      border-color: #3a3a3a;
    }
    &:active:not(:disabled) {
      transform: scale(0.98);
    }
  `,
  ghost: css`
    background: transparent;
    color: var(--color-text-muted);
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background: var(--color-surface-2);
      color: var(--color-text);
      border-color: var(--color-border);
    }
    &:active:not(:disabled) {
      transform: scale(0.98);
    }
  `,
  danger: css`
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-danger);
    border: 1px solid rgba(239, 68, 68, 0.2);

    &:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.18);
      border-color: rgba(239, 68, 68, 0.35);
    }
    &:active:not(:disabled) {
      transform: scale(0.98);
    }
  `,
};

const StyledButton = styled.button<{
  $variant: Variant;
  $size: Size;
  $fullWidth: boolean;
  $loading: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease, opacity 0.15s ease;
  white-space: nowrap;
  user-select: none;
  position: relative;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};

  ${({ $size }) => sizeStyles[$size]}
  ${({ $variant }) => variantStyles[$variant]}

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  ${({ $loading }) =>
    $loading &&
    css`
      color: transparent !important;
      pointer-events: none;

      &::after {
        content: "";
        position: absolute;
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: ${spin} 0.65s linear infinite;
        color: white;
      }
    `}
`;

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  iconRight,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      $loading={loading}
      disabled={disabled || loading}
      {...props}
    >
      {icon && !loading && icon}
      {children}
      {iconRight && !loading && iconRight}
    </StyledButton>
  );
}
