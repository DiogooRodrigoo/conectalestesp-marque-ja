"use client";

import { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import {
  House, CalendarBlank, Tag, Users, ProhibitInset,
  GearSix, Sun, Moon, SignOut,
} from "@phosphor-icons/react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { BusinessProvider, useBusiness } from "./BusinessContext";
import type { BusinessHours } from "@/types/database";

// ─── Nav config ───────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

function buildNav(slug: string) {
  const main: NavItem[] = [
    { label: "Visão Geral",   href: `/${slug}/painel/overview`,      icon: House },
    { label: "Agenda",        href: `/${slug}/painel/agenda`,        icon: CalendarBlank },
    { label: "Serviços",      href: `/${slug}/painel/servicos`,      icon: Tag },
    { label: "Profissionais", href: `/${slug}/painel/profissionais`, icon: Users },
    { label: "Bloqueios",     href: `/${slug}/painel/bloqueios`,     icon: ProhibitInset },
  ];
  const system: NavItem[] = [
    { label: "Configurações", href: `/${slug}/painel/configuracoes`, icon: GearSix },
  ];
  return { main, system };
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function getBusinessStatus(hours: BusinessHours[] | null) {
  if (!hours?.length) return { isOpen: false, label: "Fechado" };
  const today = new Date();
  const dayOfWeek = today.getDay();
  const todayHours = hours.find((h) => h.day_of_week === dayOfWeek);
  if (!todayHours?.is_open) return { isOpen: false, label: "Fechado hoje" };
  const now = today.getHours() * 60 + today.getMinutes();
  const [openH, openM] = todayHours.open_time.split(":").map(Number);
  const [closeH, closeM] = todayHours.close_time.split(":").map(Number);
  const openMins = openH * 60 + (openM || 0);
  const closeMins = closeH * 60 + (closeM || 0);
  if (now < openMins) return { isOpen: false, label: `Abre às ${todayHours.open_time}` };
  if (now >= closeMins) return { isOpen: false, label: "Fechado agora" };
  return { isOpen: true, label: "Aberto agora" };
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// ─── Animations ───────────────────────────────────────────────────────────────

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-4px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const pulseDot = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50%       { transform: scale(1.6); opacity: 0.5; }
`;

// ─── Styled — Layout root ─────────────────────────────────────────────────────

const LayoutRoot = styled.div`
  display: flex;
  min-height: 100vh;
`;

// ─── Styled — Sidebar ─────────────────────────────────────────────────────────

const Sidebar = styled.aside`
  width: 88px;
  min-width: 88px;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-right: var(--glass-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  animation: ${fadeIn} 0.25s ease both;
  z-index: 40;

  @media (max-width: 768px) { display: none; }
`;

const SidebarTop = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0 16px;
  width: 100%;
  border-bottom: var(--glass-border);
`;

const LogoBadge = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.35), 0 2px 6px rgba(0,0,0,0.12);
  animation: ${float} 3s ease-in-out infinite;
  overflow: hidden;
  cursor: default;
`;

const LogoBadgeImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const LogoInitials = styled.div`
  font-size: 17px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
`;

const Nav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 0 8px;
  gap: 4px;
  width: 100%;
`;

const NavDivider = styled.div`
  width: 36px;
  height: 1px;
  background: var(--color-border);
  margin: 8px 0;
  opacity: 0.6;
`;

const NavBtn = styled(Link)<{ $active?: boolean }>`
  width: 52px;
  height: 52px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s;

  background: ${({ $active }) =>
    $active ? "var(--color-primary)" : "transparent"};
  color: ${({ $active }) =>
    $active ? "#fff" : "var(--color-text-muted)"};
  box-shadow: ${({ $active }) =>
    $active ? "0 4px 16px rgba(249,115,22,0.35)" : "none"};

  &:hover {
    background: ${({ $active }) =>
      $active ? "var(--color-primary)" : "rgba(249,115,22,0.08)"};
    color: ${({ $active }) => ($active ? "#fff" : "var(--color-primary)")};
    transform: scale(1.07);
  }
`;

const NavTooltip = styled.span`
  position: absolute;
  left: calc(100% + 12px);
  background: rgba(15, 15, 20, 0.92);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 8px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.15s, transform 0.15s;
  z-index: 99;

  ${NavBtn}:hover & {
    opacity: 1;
    transform: translateX(0);
  }
`;

const SidebarFooter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0 18px;
  gap: 6px;
  width: 100%;
  border-top: var(--glass-border);
`;

const FooterIconBtn = styled.button<{ $danger?: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s, transform 0.15s;
  position: relative;

  &:hover {
    background: ${({ $danger }) =>
      $danger ? "rgba(239,68,68,0.10)" : "rgba(249,115,22,0.08)"};
    color: ${({ $danger }) =>
      $danger ? "var(--color-danger)" : "var(--color-primary)"};
    transform: scale(1.07);
  }
`;

const FooterTooltip = styled.span`
  position: absolute;
  left: calc(100% + 12px);
  background: rgba(15, 15, 20, 0.92);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 8px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.15s, transform 0.15s;
  z-index: 99;

  ${FooterIconBtn}:hover & {
    opacity: 1;
    transform: translateX(0);
  }
`;

const AvatarBadge = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
  box-shadow: 0 0 0 2px rgba(249,115,22,0.3);
  flex-shrink: 0;
`;

// ─── Styled — Main ────────────────────────────────────────────────────────────

const MainContent = styled.main`
  flex: 1;
  min-width: 0;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding-bottom: 72px;
  }
`;

// ─── Styled — Mobile top bar ──────────────────────────────────────────────────

const MobileTopBar = styled.header`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    position: sticky;
    top: 0;
    z-index: 50;
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border-bottom: var(--glass-border);
  }
`;

const MobileTopLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const MobileLogoBadge = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(249,115,22,0.3);
  overflow: hidden;
  flex-shrink: 0;
`;

const MobileLogoImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const MobileLogoInitials = styled.div`
  font-size: 12px;
  font-weight: 800;
  color: #fff;
`;

const MobileTopInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MobileBusinessName = styled.span`
  font-size: 14px;
  font-weight: 800;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
  letter-spacing: -0.3px;
`;

const MobileOpenBadge = styled.span<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 700;
  color: ${({ $open }) => ($open ? "#16A34A" : "#DC2626")};
  background: ${({ $open }) => ($open ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.08)")};
  border: 1px solid ${({ $open }) => ($open ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.20)")};
  border-radius: 99px;
  padding: 1px 6px;
  width: fit-content;
`;

const MobileOpenDot = styled.span<{ $open: boolean }>`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: ${({ $open }) => ($open ? "#16A34A" : "#DC2626")};
  flex-shrink: 0;
  ${({ $open }) => $open && css`animation: ${pulseDot} 2s ease infinite;`}
`;

const MobileActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const MobileIconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s;
  &:hover {
    background: rgba(249,115,22,0.08);
    color: var(--color-primary);
  }
`;

// ─── Styled — Mobile bottom nav ───────────────────────────────────────────────

const MobileBottomNav = styled.nav`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border-top: var(--glass-border);
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
  background: ${({ $active }) => ($active ? "rgba(249,115,22,0.08)" : "transparent")};
  transition: background 0.15s, color 0.15s;
  position: relative;

  ${({ $active }) => $active && css`
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 3px;
      background: var(--color-primary);
      border-radius: 0 0 3px 3px;
    }
  `}
`;

const MobileNavLabel = styled.span`
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.1px;
  line-height: 1;
  white-space: nowrap;
`;

// ─── Sidebar logo content ─────────────────────────────────────────────────────

function SidebarLogoContent() {
  const { business } = useBusiness();
  if (!business) return null;
  if (business.logo_url) return <LogoBadgeImg src={business.logo_url} alt={business.name} />;
  return <LogoInitials>{getInitials(business.name)}</LogoInitials>;
}

// ─── Sidebar inner ────────────────────────────────────────────────────────────

function SidebarInner({
  navMain,
  navSystem,
  pathname,
  isDark,
  toggleTheme,
  onSignOut,
}: {
  navMain: NavItem[];
  navSystem: NavItem[];
  pathname: string;
  isDark: boolean;
  toggleTheme: () => void;
  onSignOut: () => void;
}) {
  const { business } = useBusiness();

  return (
    <>
      <SidebarTop>
        <LogoBadge>
          <SidebarLogoContent />
        </LogoBadge>
      </SidebarTop>

      <Nav>
        {navMain.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <NavBtn key={item.href} href={item.href} $active={isActive}>
              <item.icon size={22} weight={isActive ? "fill" : "regular"} />
              <NavTooltip>{item.label}</NavTooltip>
            </NavBtn>
          );
        })}

        <NavDivider />

        {navSystem.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <NavBtn key={item.href} href={item.href} $active={isActive}>
              <item.icon size={22} weight={isActive ? "fill" : "regular"} />
              <NavTooltip>{item.label}</NavTooltip>
            </NavBtn>
          );
        })}
      </Nav>

      <SidebarFooter>
        <FooterIconBtn onClick={toggleTheme}>
          {isDark ? <Sun size={20} weight="fill" /> : <Moon size={20} weight="fill" />}
          <FooterTooltip>{isDark ? "Modo claro" : "Modo escuro"}</FooterTooltip>
        </FooterIconBtn>
        <FooterIconBtn $danger onClick={onSignOut}>
          <SignOut size={20} />
          <FooterTooltip>Sair da conta</FooterTooltip>
        </FooterIconBtn>
        <AvatarBadge title={business?.name ?? ""}>
          {business ? getInitials(business.name) : "MJ"}
        </AvatarBadge>
      </SidebarFooter>
    </>
  );
}

// ─── Mobile header ────────────────────────────────────────────────────────────

function MobileHeader({
  isDark,
  toggleTheme,
  onSignOut,
  businessHours,
}: {
  isDark: boolean;
  toggleTheme: () => void;
  onSignOut: () => void;
  businessHours: BusinessHours[] | null;
}) {
  const { business } = useBusiness();
  const status = getBusinessStatus(businessHours);

  return (
    <MobileTopBar>
      <MobileTopLeft>
        <MobileLogoBadge>
          {business?.logo_url ? (
            <MobileLogoImg src={business.logo_url} alt={business.name} />
          ) : (
            <MobileLogoInitials>
              {business ? getInitials(business.name) : "MJ"}
            </MobileLogoInitials>
          )}
        </MobileLogoBadge>
        <MobileTopInfo>
          <MobileBusinessName>{business?.name ?? "Marque Já"}</MobileBusinessName>
          <MobileOpenBadge $open={status.isOpen}>
            <MobileOpenDot $open={status.isOpen} />
            {status.label}
          </MobileOpenBadge>
        </MobileTopInfo>
      </MobileTopLeft>
      <MobileActions>
        <MobileIconBtn onClick={toggleTheme} aria-label={isDark ? "Modo claro" : "Modo escuro"}>
          {isDark ? <Sun size={18} weight="fill" /> : <Moon size={18} weight="fill" />}
        </MobileIconBtn>
        <MobileIconBtn onClick={onSignOut} aria-label="Sair">
          <SignOut size={18} />
        </MobileIconBtn>
      </MobileActions>
    </MobileTopBar>
  );
}

// ─── Layout principal ─────────────────────────────────────────────────────────

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [isDark, setIsDark] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours[] | null>(null);

  const { main: NAV_MAIN, system: NAV_SYSTEM } = buildNav(slug);

  const MOBILE_NAV: NavItem[] = [
    { label: "Início",   href: `/${slug}/painel/overview`,      icon: House },
    { label: "Agenda",   href: `/${slug}/painel/agenda`,        icon: CalendarBlank },
    { label: "Serviços", href: `/${slug}/painel/servicos`,      icon: Tag },
    { label: "Equipe",   href: `/${slug}/painel/profissionais`, icon: Users },
    { label: "Config",   href: `/${slug}/painel/configuracoes`, icon: GearSix },
  ];

  async function handleSignOut() {
    await getSupabaseClient().auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    // Sempre inicia em modo claro
    setIsDark(false);
    document.documentElement.removeAttribute("data-theme");
  }, []);

  useEffect(() => {
    async function fetchHours() {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", session.user.id)
        .eq("slug", slug)
        .single();
      if (!biz) return;
      const { data: hours } = await supabase
        .from("business_hours")
        .select("*")
        .eq("business_id", biz.id);
      if (hours) setBusinessHours(hours as BusinessHours[]);
    }
    fetchHours();
  }, [slug]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("mj_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("mj_theme", "");
    }
  }

  return (
    <BusinessProvider>
      <LayoutRoot>

        {/* ── Sidebar desktop ── */}
        <Sidebar>
          <SidebarInner
            navMain={NAV_MAIN}
            navSystem={NAV_SYSTEM}
            pathname={pathname}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onSignOut={handleSignOut}
          />
        </Sidebar>

        {/* ── Conteúdo ── */}
        <MainContent>
          <MobileHeader
            isDark={isDark}
            toggleTheme={toggleTheme}
            onSignOut={handleSignOut}
            businessHours={businessHours}
          />
          {children}
        </MainContent>

      </LayoutRoot>

      {/* ── Bottom nav mobile ── */}
      <MobileBottomNav>
        {MOBILE_NAV.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <MobileNavItem key={item.href} href={item.href} $active={isActive}>
              <item.icon size={22} weight={isActive ? "fill" : "regular"} />
              <MobileNavLabel>{item.label}</MobileNavLabel>
            </MobileNavItem>
          );
        })}
      </MobileBottomNav>

    </BusinessProvider>
  );
}
