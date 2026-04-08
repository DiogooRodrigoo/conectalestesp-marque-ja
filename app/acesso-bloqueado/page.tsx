"use client";

import styled from "styled-components";
import { LockKey, WhatsappLogo } from "@phosphor-icons/react";

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 24px;
`;

const Card = styled.div`
  max-width: 420px;
  width: 100%;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 40px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const IconWrap = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  margin-bottom: 4px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.4px;
`;

const Desc = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  line-height: 1.6;
  max-width: 320px;
`;

const WhatsAppBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 12px 24px;
  background: #25d366;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  transition: background 0.15s, transform 0.1s;
  text-decoration: none;

  &:hover { background: #1ebe5a; }
  &:active { transform: scale(0.97); }
`;

const Footer = styled.p`
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 8px;
  opacity: 0.6;
`;

export default function AcessoBloqueadoPage() {
  return (
    <Wrapper>
      <Card>
        <IconWrap>
          <LockKey size={28} weight="fill" />
        </IconWrap>

        <Title>Acesso suspenso</Title>

        <Desc>
          O acesso ao painel foi temporariamente suspenso. Entre em contato
          com a Conecta Leste SP para regularizar sua assinatura e reativar
          o acesso.
        </Desc>

        <WhatsAppBtn
          href="https://wa.me/5511999999999?text=Olá,%20meu%20acesso%20ao%20Marque%20Já%20foi%20suspenso.%20Gostaria%20de%20regularizar."
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsappLogo size={18} weight="fill" />
          Falar com a Conecta Leste
        </WhatsAppBtn>

        <Footer>Marque Já · Conecta Leste SP</Footer>
      </Card>
    </Wrapper>
  );
}
