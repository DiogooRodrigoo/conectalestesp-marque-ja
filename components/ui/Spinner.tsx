"use client";

import styled, { keyframes } from "styled-components";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const sizes: Record<SpinnerSize, string> = {
  sm: "16px",
  md: "24px",
  lg: "36px",
};

const StyledSpinner = styled.span<{ $size: SpinnerSize; $color: string }>`
  display: inline-block;
  width: ${({ $size }) => sizes[$size]};
  height: ${({ $size }) => sizes[$size]};
  border: 2px solid ${({ $color }) => `${$color}30`};
  border-top-color: ${({ $color }) => $color};
  border-radius: 50%;
  animation: ${spin} 0.65s linear infinite;
  flex-shrink: 0;
`;

export default function Spinner({ size = "md", color = "var(--color-primary)" }: SpinnerProps) {
  return <StyledSpinner $size={size} $color={color} />;
}
