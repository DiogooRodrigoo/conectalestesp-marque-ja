"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { BusinessProvider, useBusiness } from "./BusinessContext";
import {
  ChartBar,
  CalendarCheck,
  Scissors,
  UsersFour,
  ProhibitInset,
  GearSix,
  SignOut,
  Sun,
  Moon,
  Buildings,
} from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

function buildNav(slug: string) {
  const main: NavItem[] = [
    { label: "Visão Geral",   href: `/${slug}/painel/overview`,      icon: ChartBar },
    { label: "Agenda",        href: `/${slug}/painel/agenda`,        icon: CalendarCheck },
    { label: "Serviços",      href: `/${slug}/painel/servicos`,      icon: Scissors },
    { label: "Profissionais", href: `/${slug}/painel/profissionais`, icon: UsersFour },
    { label: "Bloqueios",     href: `/${slug}/painel/bloqueios`,     icon: ProhibitInset },
  ];
  const system: NavItem[] = [
    { label: "Configurações", href: `/${slug}/painel/configuracoes`, icon: GearSix },
  ];
  return { main, system };
}

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// ─── Styled — Desktop ─────────────────────────────────────────────────────────

const LayoutRoot = styled.div`
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
`;

const Sidebar = styled.aside`
  width: 252px;
  min-width: 252px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  animation: ${fadeIn} 0.25s ease both;

  &::-webkit-scrollbar { display: none; }

  @media (max-width: 768px) {
    display: none;
  }
`;

const SidebarHeader = styled.div`
  padding: 20px 16px 18px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 11px;
  position: relative;
`;

const LogoBadge = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
`;

const LogoBadgeImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const LogoText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const LogoTitle = styled.span`
  font-size: 14.5px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.3px;
  line-height: 1.2;
`;

const LogoSub = styled.span`
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.2;
`;

const Nav = styled.nav`
  flex: 1;
  padding: 14px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const NavGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: 4px;
`;

const NavGroupLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--color-text-muted);
  opacity: 0.5;
  padding: 8px 10px 5px;
  display: block;
`;

const NavDivider = styled.div`
  height: 1px;
  background: var(--color-border);
  margin: 6px 4px 10px;
  opacity: 0.6;
`;

// Usa color-mix para que o background responda ao --color-primary dinâmico
const NavLink = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: ${({ $active }) => ($active ? "600" : "400")};
  color: ${({ $active }) => ($active ? "var(--color-primary)" : "var(--color-text-muted)")};
  background: ${({ $active }) => ($active ? "color-mix(in srgb, var(--color-primary) 10%, transparent)" : "transparent")};
  transition: background 0.15s, color 0.15s;
  position: relative;

  svg {
    flex-shrink: 0;
    color: ${({ $active }) => ($active ? "var(--color-primary)" : "var(--color-text-muted)")};
    transition: color 0.15s;
  }

  &:hover {
    background: ${({ $active }) => ($active ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "var(--color-surface-2)")};
    color: ${({ $active }) => ($active ? "var(--color-primary)" : "var(--color-text)")};
    svg { color: ${({ $active }) => ($active ? "var(--color-primary)" : "var(--color-text)")}; }
  }
`;

const BusinessCard = styled.div`
  margin: 0 10px 8px;
  padding: 10px 12px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 9px;
`;

const BusinessIcon = styled.div`
  width: 28px;
  height: 28px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  flex-shrink: 0;
`;

const BusinessName = styled.span`
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SidebarFooter = styled.div`
  padding: 8px 10px 14px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const FooterBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 10px;
  font-size: 13.5px;
  color: var(--color-text-muted);
  width: 100%;
  transition: background 0.15s, color 0.15s;
  svg { flex-shrink: 0; }
  &:hover { background: var(--color-surface-2); color: var(--color-text); }
`;

const SignOutButton = styled(FooterBtn)`
  &:hover {
    background: rgba(239, 68, 68, 0.08);
    color: var(--color-danger);
    svg { color: var(--color-danger); }
  }
`;

const MainContent = styled.main`
  flex: 1;
  min-width: 0;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding-bottom: 72px; /* espaço para o bottom nav */
  }
`;

// ─── Styled — Mobile ──────────────────────────────────────────────────────────

const MobileTopBar = styled.header`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 50;
  }
`;

const MobileTopLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const MobileLogoBadge = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const MobileLogoImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const MobileBusinessName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
`;

const MobileSignOut = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
  &:hover { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
`;

const MobileBottomNav = styled.nav`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    padding: 6px 4px;
    padding-bottom: max(6px, env(safe-area-inset-bottom));
  }
`;

const MobileNavItem = styled(Link)<{ $active?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 4px;
  border-radius: 10px;
  text-decoration: none;
  color: ${({ $active }) => ($active ? "var(--color-primary)" : "var(--color-text-muted)")};
  background: ${({ $active }) => ($active ? "color-mix(in srgb, var(--color-primary) 8%, transparent)" : "transparent")};
  transition: background 0.15s, color 0.15s;

  svg { flex-shrink: 0; }
`;

const MobileNavLabel = styled.span`
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.1px;
  line-height: 1;
  white-space: nowrap;
`;

// ─── Componentes internos (usam useBusiness) ─────────────────────────────────

function BusinessColorInjector() {
  const { business } = useBusiness();
  useEffect(() => {
    if (!business?.primary_color) return;
    const color = business.primary_color;
    const hex = color.replace("#", "");
    const r = Math.round(parseInt(hex.slice(0, 2), 16) * 0.9);
    const g = Math.round(parseInt(hex.slice(2, 4), 16) * 0.9);
    const b = Math.round(parseInt(hex.slice(4, 6), 16) * 0.9);
    const dark = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    document.documentElement.style.setProperty("--color-primary", color);
    document.documentElement.style.setProperty("--color-primary-dark", dark);
  }, [business?.primary_color]);
  return null;
}

function SidebarBusinessCard() {
  const { business } = useBusiness();
  if (!business) return null;
  return (
    <BusinessCard>
      <BusinessIcon>
        <Buildings size={15} weight="fill" />
      </BusinessIcon>
      <BusinessName>{business.name}</BusinessName>
    </BusinessCard>
  );
}

function MobileHeader({ onSignOut }: { onSignOut: () => void }) {
  const { business } = useBusiness();
  return (
    <MobileTopBar>
      <MobileTopLeft>
        <MobileLogoBadge>
          <MobileLogoImg src="/conecta-logo.jpeg" alt="Conecta Leste SP" />
        </MobileLogoBadge>
        <MobileBusinessName>{business?.name ?? "Marque Já"}</MobileBusinessName>
      </MobileTopLeft>
      <MobileSignOut onClick={onSignOut} aria-label="Sair">
        <SignOut size={18} />
      </MobileSignOut>
    </MobileTopBar>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [isDark, setIsDark] = useState(false);

  const { main: NAV_MAIN, system: NAV_SYSTEM } = buildNav(slug);

  // Nav items para o mobile bottom bar (Bloqueios fica de fora por ser menos usado)
  const MOBILE_NAV: NavItem[] = [
    { label: "Início",   href: `/${slug}/painel/overview`,      icon: ChartBar },
    { label: "Agenda",   href: `/${slug}/painel/agenda`,        icon: CalendarCheck },
    { label: "Serviços", href: `/${slug}/painel/servicos`,      icon: Scissors },
    { label: "Equipe",   href: `/${slug}/painel/profissionais`, icon: UsersFour },
    { label: "Config",   href: `/${slug}/painel/configuracoes`, icon: GearSix },
  ];

  async function handleSignOut() {
    await getSupabaseClient().auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    const saved = localStorage.getItem("mj_theme");
    if (saved === "dark") {
      setIsDark(true);
      document.documentElement.removeAttribute("data-theme");
    } else {
      setIsDark(false);
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("mj_theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("mj_theme", "light");
    }
  }

  return (
    <BusinessProvider>
      <BusinessColorInjector />
      <LayoutRoot>

        {/* ── Sidebar desktop ── */}
        <Sidebar>
          <SidebarHeader>
            <LogoBadge>
              <LogoBadgeImg src="/conecta-logo.jpeg" alt="Conecta Leste SP" />
            </LogoBadge>
            <LogoText>
              <LogoTitle>Marque Já</LogoTitle>
              <LogoSub>Painel de Gestão</LogoSub>
            </LogoText>
          </SidebarHeader>

          <Nav>
            <NavGroup>
              <NavGroupLabel>Menu</NavGroupLabel>
              {NAV_MAIN.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <NavLink key={item.href} href={item.href} $active={isActive}>
                    <Icon size={17} weight={isActive ? "fill" : "regular"} />
                    {item.label}
                  </NavLink>
                );
              })}
            </NavGroup>

            <NavDivider />

            <NavGroup>
              <NavGroupLabel>Sistema</NavGroupLabel>
              {NAV_SYSTEM.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <NavLink key={item.href} href={item.href} $active={isActive}>
                    <Icon size={17} weight={isActive ? "fill" : "regular"} />
                    {item.label}
                  </NavLink>
                );
              })}
            </NavGroup>
          </Nav>

          <SidebarBusinessCard />

          <SidebarFooter>
            <FooterBtn onClick={toggleTheme}>
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
              {isDark ? "Modo Claro" : "Modo Escuro"}
            </FooterBtn>
            <SignOutButton onClick={handleSignOut}>
              <SignOut size={17} />
              Sair da conta
            </SignOutButton>
          </SidebarFooter>
        </Sidebar>

        {/* ── Conteúdo principal ── */}
        <MainContent>
          {/* Header mobile (logo + nome do negócio + sair) */}
          <MobileHeader onSignOut={handleSignOut} />
          {children}
        </MainContent>

      </LayoutRoot>

      {/* ── Bottom nav mobile ── */}
      <MobileBottomNav>
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <MobileNavItem key={item.href} href={item.href} $active={isActive}>
              <Icon size={20} weight={isActive ? "fill" : "regular"} />
              <MobileNavLabel>{item.label}</MobileNavLabel>
            </MobileNavItem>
          );
        })}
      </MobileBottomNav>

    </BusinessProvider>
  );
}
