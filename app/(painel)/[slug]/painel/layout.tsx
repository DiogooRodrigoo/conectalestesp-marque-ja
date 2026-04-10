"use client";

import { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { BusinessProvider, useBusiness } from "./BusinessContext";
import type { BusinessHours } from "@/types/database";

// ─── Nav config ───────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  emoji: string;
}

function buildNav(slug: string) {
  const main: NavItem[] = [
    { label: "Visão Geral",   href: `/${slug}/painel/overview`,      emoji: "🏠" },
    { label: "Agenda",        href: `/${slug}/painel/agenda`,        emoji: "📅" },
    { label: "Serviços",      href: `/${slug}/painel/servicos`,      emoji: "✂️" },
    { label: "Profissionais", href: `/${slug}/painel/profissionais`, emoji: "👥" },
    { label: "Bloqueios",     href: `/${slug}/painel/bloqueios`,     emoji: "🚫" },
  ];
  const system: NavItem[] = [
    { label: "Configurações", href: `/${slug}/painel/configuracoes`, emoji: "⚙️" },
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

const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const pulseDot = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0.5; }
`;

// ─── Styled — Layout root ─────────────────────────────────────────────────────

const LayoutRoot = styled.div`
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
`;

// ─── Styled — Sidebar ─────────────────────────────────────────────────────────

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

  @media (max-width: 768px) { display: none; }
`;

const SidebarHeader = styled.div`
  position: relative;
  padding: 20px 16px 18px;
  overflow: hidden;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 11px;
`;

const SidebarHeaderBg = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(249,115,22,0.10) 0%, rgba(249,115,22,0.02) 100%);
  pointer-events: none;
`;

const LogoBadge = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 16px rgba(249,115,22,0.25), 0 2px 6px rgba(0,0,0,0.15);
  border: 1.5px solid rgba(249,115,22,0.25);
`;

const LogoBadgeImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const LogoInitials = styled.div<{ $color: string }>`
  width: 100%;
  height: 100%;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
`;

const LogoText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  position: relative;
  z-index: 1;
`;

const LogoTitle = styled.span`
  font-size: 14px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.3px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const OpenBadge = styled.span<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  color: ${({ $open }) => ($open ? "#16A34A" : "#DC2626")};
  background: ${({ $open }) => ($open ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.08)")};
  border: 1px solid ${({ $open }) => ($open ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.20)")};
  border-radius: 99px;
  padding: 2px 7px;
  width: fit-content;
`;

const OpenDot = styled.span<{ $open: boolean }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $open }) => ($open ? "#16A34A" : "#DC2626")};
  ${({ $open }) => $open && css`animation: ${pulseDot} 2s ease infinite;`}
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

const NavLink = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 11px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? "700" : "500")};
  color: ${({ $active }) => ($active ? "var(--color-primary)" : "var(--color-text-muted)")};
  background: ${({ $active }) => ($active ? "color-mix(in srgb, var(--color-primary) 10%, transparent)" : "transparent")};
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${({ $active }) => ($active ? "color-mix(in srgb, var(--color-primary) 12%, transparent)" : "var(--color-surface-2)")};
    color: ${({ $active }) => ($active ? "var(--color-primary)" : "var(--color-text)")};
  }
`;

const NavEmoji = styled.span`
  font-size: 15px;
  flex-shrink: 0;
  line-height: 1;
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
  gap: 9px;
  padding: 9px 11px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--color-text-muted);
  width: 100%;
  transition: background 0.15s, color 0.15s;
  &:hover { background: var(--color-surface-2); color: var(--color-text); }
`;

const SignOutButton = styled(FooterBtn)`
  &:hover { background: rgba(239,68,68,0.08); color: var(--color-danger); }
`;

const FooterEmoji = styled.span`
  font-size: 14px;
  flex-shrink: 0;
  line-height: 1;
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
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 50;
    background: var(--color-surface);
  }
`;

const MobileTopBarBg = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(249,115,22,0.10) 0%, rgba(249,115,22,0.02) 100%);
  pointer-events: none;
`;

const MobileTopLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
`;

const MobileLogoBadge = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(249,115,22,0.2), 0 1px 4px rgba(0,0,0,0.1);
  border: 1.5px solid rgba(249,115,22,0.2);
`;

const MobileLogoImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const MobileLogoInitials = styled.div<{ $color: string }>`
  width: 100%;
  height: 100%;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
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
  position: relative;
  z-index: 1;
`;

const MobileIconBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  font-size: 15px;
  transition: background 0.15s;
  &:hover { background: var(--color-surface-2); }
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

const MobileNavEmoji = styled.span`
  font-size: 18px;
  line-height: 1;
`;

const MobileNavLabel = styled.span`
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.1px;
  line-height: 1;
  white-space: nowrap;
`;

// ─── Sub-componentes (acessam useBusiness) ────────────────────────────────────

function BusinessColorInjector() {
  const { business } = useBusiness();
  useEffect(() => {
    if (!business?.primary_color) return;
    const color = business.primary_color;
    const hex = color.replace("#", "");
    const r = Math.round(parseInt(hex.slice(0, 2), 16) * 0.939);
    const g = Math.round(parseInt(hex.slice(2, 4), 16) * 0.939);
    const b = Math.round(parseInt(hex.slice(4, 6), 16) * 0.454);
    const dark = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    document.documentElement.style.setProperty("--color-primary", color);
    document.documentElement.style.setProperty("--color-primary-dark", dark);
  }, [business?.primary_color]);
  return null;
}

function SidebarLogoContent() {
  const { business } = useBusiness();
  if (!business) return null;
  if (business.logo_url) return <LogoBadgeImg src={business.logo_url} alt={business.name} />;
  return (
    <LogoInitials $color={business.primary_color ?? "#F97316"}>
      {getInitials(business.name)}
    </LogoInitials>
  );
}

function SidebarInner({
  navMain,
  navSystem,
  pathname,
  isDark,
  toggleTheme,
  onSignOut,
  businessHours,
}: {
  navMain: NavItem[];
  navSystem: NavItem[];
  pathname: string;
  isDark: boolean;
  toggleTheme: () => void;
  onSignOut: () => void;
  businessHours: BusinessHours[] | null;
}) {
  const { business } = useBusiness();
  const status = getBusinessStatus(businessHours);

  return (
    <>
      <SidebarHeader>
        <SidebarHeaderBg />
        <LogoBadge>
          <SidebarLogoContent />
        </LogoBadge>
        <LogoText>
          <LogoTitle>{business?.name ?? "Marque Já"}</LogoTitle>
          <OpenBadge $open={status.isOpen}>
            <OpenDot $open={status.isOpen} />
            {status.label}
          </OpenBadge>
        </LogoText>
      </SidebarHeader>

      <Nav>
        <NavGroup>
          <NavGroupLabel>Menu</NavGroupLabel>
          {navMain.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <NavLink key={item.href} href={item.href} $active={isActive}>
                <NavEmoji>{item.emoji}</NavEmoji>
                {item.label}
              </NavLink>
            );
          })}
        </NavGroup>

        <NavDivider />

        <NavGroup>
          <NavGroupLabel>Sistema</NavGroupLabel>
          {navSystem.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <NavLink key={item.href} href={item.href} $active={isActive}>
                <NavEmoji>{item.emoji}</NavEmoji>
                {item.label}
              </NavLink>
            );
          })}
        </NavGroup>
      </Nav>

      <SidebarFooter>
        <FooterBtn onClick={toggleTheme}>
          <FooterEmoji>{isDark ? "☀️" : "🌙"}</FooterEmoji>
          {isDark ? "Modo Claro" : "Modo Escuro"}
        </FooterBtn>
        <SignOutButton onClick={onSignOut}>
          <FooterEmoji>🚪</FooterEmoji>
          Sair da conta
        </SignOutButton>
      </SidebarFooter>
    </>
  );
}

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
      <MobileTopBarBg />
      <MobileTopLeft>
        <MobileLogoBadge>
          {business?.logo_url ? (
            <MobileLogoImg src={business.logo_url} alt={business.name} />
          ) : (
            <MobileLogoInitials $color={business?.primary_color ?? "#F97316"}>
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
          {isDark ? "☀️" : "🌙"}
        </MobileIconBtn>
        <MobileIconBtn onClick={onSignOut} aria-label="Sair">
          🚪
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
  const [isDark, setIsDark] = useState(true);
  const [businessHours, setBusinessHours] = useState<BusinessHours[] | null>(null);

  const { main: NAV_MAIN, system: NAV_SYSTEM } = buildNav(slug);

  const MOBILE_NAV: NavItem[] = [
    { label: "Início",   href: `/${slug}/painel/overview`,      emoji: "🏠" },
    { label: "Agenda",   href: `/${slug}/painel/agenda`,        emoji: "📅" },
    { label: "Serviços", href: `/${slug}/painel/servicos`,      emoji: "✂️" },
    { label: "Equipe",   href: `/${slug}/painel/profissionais`, emoji: "👥" },
    { label: "Config",   href: `/${slug}/painel/configuracoes`, emoji: "⚙️" },
  ];

  async function handleSignOut() {
    await getSupabaseClient().auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    const saved = localStorage.getItem("mj_theme");
    if (saved === "light") {
      setIsDark(false);
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      setIsDark(true);
      document.documentElement.removeAttribute("data-theme");
    }
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
          <SidebarInner
            navMain={NAV_MAIN}
            navSystem={NAV_SYSTEM}
            pathname={pathname}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onSignOut={handleSignOut}
            businessHours={businessHours}
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
              <MobileNavEmoji>{item.emoji}</MobileNavEmoji>
              <MobileNavLabel>{item.label}</MobileNavLabel>
            </MobileNavItem>
          );
        })}
      </MobileBottomNav>

    </BusinessProvider>
  );
}
