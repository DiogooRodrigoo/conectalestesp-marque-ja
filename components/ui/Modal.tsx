"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import { X } from "@phosphor-icons/react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  footer?: React.ReactNode;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.18s ease;
`;

const sizeWidths = { sm: "400px", md: "520px", lg: "680px" };

const Dialog = styled.div<{ $size: "sm" | "md" | "lg" }>`
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.60);
  border-radius: var(--radius-2xl);
  width: 100%;
  max-width: ${({ $size }) => sizeWidths[$size]};
  max-height: calc(100dvh - 40px);
  display: flex;
  flex-direction: column;
  animation: ${slideUp} 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18), 0 4px 16px rgba(0, 0, 0, 0.08);

  [data-theme="dark"] & {
    background: rgba(24, 24, 30, 0.90);
    border-color: rgba(255, 255, 255, 0.07);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 22px 0;
  gap: 16px;
`;

const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.3px;
`;

const Description = styled.p`
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 5px;
  line-height: 1.55;
`;

const CloseBtn = styled.button`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: var(--color-surface-2);
    color: var(--color-text);
  }
`;

const Body = styled.div`
  padding: 20px 22px;
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }
`;

const Footer = styled.div`
  padding: 16px 22px 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--color-border);
`;

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  footer,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, handleKey]);

  if (!open || !mounted) return null;

  return createPortal(
    <Overlay onClick={onClose}>
      <Dialog $size={size} onClick={(e) => e.stopPropagation()}>
        {(title || description) && (
          <Header>
            <HeaderText>
              {title && <Title>{title}</Title>}
              {description && <Description>{description}</Description>}
            </HeaderText>
            <CloseBtn onClick={onClose} aria-label="Fechar">
              <X size={16} weight="bold" />
            </CloseBtn>
          </Header>
        )}
        <Body>{children}</Body>
        {footer && <Footer>{footer}</Footer>}
      </Dialog>
    </Overlay>,
    document.body
  );
}
