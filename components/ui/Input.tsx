"use client";

import styled, { css } from "styled-components";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const Wrapper = styled.div<{ $fullWidth: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: ${({ $fullWidth }) => ($fullWidth ? "100%" : "auto")};
`;

const Label = styled.label`
  font-size: 12.5px;
  font-weight: 500;
  color: var(--color-text-muted);
  letter-spacing: 0.2px;
`;

const InputWrapper = styled.div<{ $hasError: boolean; $hasIcon: boolean; $hasIconRight: boolean }>`
  position: relative;
  display: flex;
  align-items: center;

  svg, .input-icon {
    position: absolute;
    color: var(--color-text-muted);
    pointer-events: none;
    flex-shrink: 0;
  }

  .input-icon-left {
    left: 12px;
  }

  .input-icon-right {
    right: 12px;
  }
`;

const StyledInput = styled.input<{ $hasError: boolean; $hasIcon: boolean; $hasIconRight: boolean }>`
  width: 100%;
  height: 40px;
  background: var(--color-surface-2);
  border: 1px solid ${({ $hasError }) => ($hasError ? "var(--color-danger)" : "var(--color-border)")};
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 13.5px;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  padding-left: ${({ $hasIcon }) => ($hasIcon ? "38px" : "12px")};
  padding-right: ${({ $hasIconRight }) => ($hasIconRight ? "38px" : "12px")};
  outline: none;

  &::placeholder {
    color: var(--color-text-muted);
    opacity: 0.6;
  }

  &:focus {
    border-color: ${({ $hasError }) => ($hasError ? "var(--color-danger)" : "var(--color-primary)")};
    box-shadow: 0 0 0 3px ${({ $hasError }) =>
      $hasError ? "rgba(239,68,68,0.12)" : "rgba(249,115,22,0.12)"};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Hint = styled.span`
  font-size: 12px;
  color: var(--color-text-muted);
`;

const ErrorMsg = styled.span`
  font-size: 12px;
  color: var(--color-danger);
`;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, fullWidth = false, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <Wrapper $fullWidth={fullWidth}>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <InputWrapper $hasError={!!error} $hasIcon={!!icon} $hasIconRight={!!iconRight}>
          {icon && <span className="input-icon input-icon-left">{icon}</span>}
          <StyledInput
            ref={ref}
            id={inputId}
            $hasError={!!error}
            $hasIcon={!!icon}
            $hasIconRight={!!iconRight}
            {...props}
          />
          {iconRight && <span className="input-icon input-icon-right">{iconRight}</span>}
        </InputWrapper>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        {!error && hint && <Hint>{hint}</Hint>}
      </Wrapper>
    );
  }
);

Input.displayName = "Input";
export default Input;
