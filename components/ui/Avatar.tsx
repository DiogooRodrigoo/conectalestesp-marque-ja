"use client";

import styled from "styled-components";

type AvatarSize = "xs" | "sm" | "md" | "lg";

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  color?: string;
}

const PALETTE = [
  "#F97316", "#818CF8", "#34D399", "#F472B6",
  "#38BDF8", "#A78BFA", "#FB923C", "#4ADE80",
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizes: Record<AvatarSize, { size: string; font: string; radius: string }> = {
  xs: { size: "24px", font: "10px", radius: "6px" },
  sm: { size: "32px", font: "12px", radius: "8px" },
  md: { size: "40px", font: "14px", radius: "10px" },
  lg: { size: "48px", font: "17px", radius: "12px" },
};

const StyledAvatar = styled.div<{ $size: AvatarSize; $color: string }>`
  width: ${({ $size }) => sizes[$size].size};
  height: ${({ $size }) => sizes[$size].size};
  min-width: ${({ $size }) => sizes[$size].size};
  border-radius: ${({ $size }) => sizes[$size].radius};
  font-size: ${({ $size }) => sizes[$size].font};
  background: ${({ $color }) => `${$color}22`};
  color: ${({ $color }) => $color};
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 0.5px;
  user-select: none;
`;

export default function Avatar({ name, size = "md", color }: AvatarProps) {
  const resolvedColor = color ?? getColor(name);
  return (
    <StyledAvatar $size={size} $color={resolvedColor}>
      {getInitials(name)}
    </StyledAvatar>
  );
}
