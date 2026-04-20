"use client";

import styled from "styled-components";

type BadgeVariant = "default" | "success" | "danger" | "warning" | "info" | "orange" | "blue";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
}

const colors: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  default: {
    bg: "rgba(161,161,170,0.1)",
    text: "var(--color-text-muted)",
    border: "rgba(161,161,170,0.2)",
    dot: "#a1a1aa",
  },
  success: {
    bg: "rgba(34,197,94,0.1)",
    text: "var(--color-success)",
    border: "rgba(34,197,94,0.2)",
    dot: "#22c55e",
  },
  danger: {
    bg: "rgba(239,68,68,0.1)",
    text: "var(--color-danger)",
    border: "rgba(239,68,68,0.2)",
    dot: "#ef4444",
  },
  warning: {
    bg: "rgba(234,179,8,0.1)",
    text: "#eab308",
    border: "rgba(234,179,8,0.2)",
    dot: "#eab308",
  },
  info: {
    bg: "rgba(99,102,241,0.1)",
    text: "#818cf8",
    border: "rgba(99,102,241,0.2)",
    dot: "#818cf8",
  },
  orange: {
    bg: "rgba(var(--color-primary-rgb),0.1)",
    text: "var(--color-primary)",
    border: "rgba(var(--color-primary-rgb),0.2)",
    dot: "#f97316",
  },
  blue: {
    bg: "rgba(59,130,246,0.1)",
    text: "#3b82f6",
    border: "rgba(59,130,246,0.2)",
    dot: "#3b82f6",
  },
};

const StyledBadge = styled.span<{ $variant: BadgeVariant; $size: BadgeSize }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 99px;
  border: 1px solid ${({ $variant }) => colors[$variant].border};
  background: ${({ $variant }) => colors[$variant].bg};
  color: ${({ $variant }) => colors[$variant].text};
  font-size: ${({ $size }) => ($size === "sm" ? "11px" : "12px")};
  padding: ${({ $size }) => ($size === "sm" ? "2px 8px" : "3px 10px")};
`;

const Dot = styled.span<{ $variant: BadgeVariant }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${({ $variant }) => colors[$variant].dot};
  flex-shrink: 0;
`;

export default function Badge({ variant = "default", size = "md", dot = false, children }: BadgeProps) {
  return (
    <StyledBadge $variant={variant} $size={size}>
      {dot && <Dot $variant={variant} />}
      {children}
    </StyledBadge>
  );
}
