"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Raleway } from "next/font/google";
import styled, { keyframes } from "styled-components";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  Tag,
  Wrench,
  Tooth,
  Stethoscope,
  Barbell,
  Sparkle,
  CalendarCheck,
  UsersFour,
  ChartBar,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react";

const raleway = Raleway({ subsets: ["latin"], weight: ["700", "800"] });

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const floatA = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(1deg); }
`;

const floatB = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-14px) rotate(-1deg); }
`;

const floatC = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-7px) rotate(0.5deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.25; transform: scale(1.05); }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  background: var(--color-bg);
`;

// ─── Left Panel ───────────────────────────────────────────────────────────────

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  background: #ffffff;
  border-right: 1px solid #e4e4e7;
  animation: ${fadeIn} 0.4s ease both;

  @media (max-width: 900px) {
    border-right: none;
    padding: 40px 24px;
  }
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;

  /* Force light mode colors */
  --color-text: #09090b;
  --color-text-muted: #71717a;
  --color-border: #e4e4e7;
  --color-bg: #f4f4f5;
  --color-surface-2: #efefef;
  --color-danger: #ef4444;
  --color-primary: #f97316;
  --color-primary-dark: #ea6c0a;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
`;

const LogoImgWrap = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: rgba(249, 115, 22, 0.08);
  border: 1px solid rgba(249, 115, 22, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
`;

const LogoImg = styled.img`
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 0 14px rgba(249, 115, 22, 0.35), 0 0 6px rgba(249, 115, 22, 0.2);
`;

const LogoName = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: #09090b;
  letter-spacing: -0.3px;
  font-family: ${raleway.style.fontFamily};
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.5px;
  margin-bottom: 6px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 28px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.2px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input<{ $hasError?: boolean }>`
  background: var(--color-bg);
  border: 1.5px solid ${({ $hasError }) => ($hasError ? "var(--color-danger)" : "var(--color-border)")};
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-text);
  outline: none;
  width: 100%;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder { color: #3a3a42; }

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  }
`;

const PasswordInput = styled(Input)`
  padding-right: 44px;
`;

const EyeBtn = styled.button`
  position: absolute;
  right: 12px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;

  &:hover { color: var(--color-text); }
`;

const ErrorText = styled.span`
  font-size: 12px;
  color: var(--color-danger);
`;

const OptionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: -2px;
`;

const RememberLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
  user-select: none;
`;

const Checkbox = styled.input`
  width: 15px;
  height: 15px;
  accent-color: var(--color-primary);
  cursor: pointer;
`;

const ForgotLink = styled.a`
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.15s;

  &:hover { color: var(--color-primary); }
`;

const SubmitButton = styled.button<{ $loading?: boolean }>`
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 13px;
  border-radius: var(--radius-sm);
  margin-top: 6px;
  transition: background 0.15s ease, transform 0.1s ease, opacity 0.15s;
  opacity: ${({ $loading }) => ($loading ? 0.7 : 1)};
  pointer-events: ${({ $loading }) => ($loading ? "none" : "auto")};

  &:hover { background: var(--color-primary-dark); }
  &:active { transform: scale(0.98); }
`;

const AlertBox = styled.div`
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--color-danger);
  margin-bottom: 4px;
`;

const Footer = styled.p`
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 40px;
  text-align: center;
`;

// ─── Right Panel ──────────────────────────────────────────────────────────────

const RightPanel = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #c2410c 0%, #ea580c 40%, #f97316 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;

  @media (max-width: 900px) {
    display: none;
  }
`;

const RightOverlay = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%),
    radial-gradient(circle at 20% 80%, rgba(0,0,0,0.15) 0%, transparent 50%);
  pointer-events: none;
`;

const RightLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
`;

const RightLogoBadge = styled.div`
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
`;

const RightLogoName = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #fff;
`;

const RightContent = styled.div`
  position: absolute;
  bottom: 48px;
  left: 48px;
  right: 48px;
  z-index: 1;
`;

const Tagline = styled.h2`
  font-size: 34px;
  font-weight: 800;
  color: #fff;
  line-height: 1.15;
  letter-spacing: -1px;
  margin-bottom: 12px;
  max-width: 320px;
`;

const TaglineSub = styled.p`
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  line-height: 1.6;
  max-width: 300px;
`;

// Floating profession cards
const FloatingScene = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
`;

const BgCircle = styled.div<{ $size: number; $top: string; $left: string; $delay?: number }>`
  position: absolute;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  animation: ${pulse} ${({ $delay }) => 3 + ($delay ?? 0)}s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay ?? 0}s;
`;

const ProfCard = styled.div<{ $top: string; $left?: string; $right?: string; $variant?: "a" | "b" | "c"; $delay: number }>`
  position: absolute;
  top: ${({ $top }) => $top};
  ${({ $left }) => $left && `left: ${$left};`}
  ${({ $right }) => $right && `right: ${$right};`}
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 16px;
  padding: 14px 16px;
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${({ $variant }) => $variant === "b" ? floatB : $variant === "c" ? floatC : floatA} ease-in-out infinite;
  animation-duration: ${({ $delay }) => 3.5 + $delay * 0.4}s;
  animation-delay: ${({ $delay }) => $delay * 0.5}s;
  min-width: 148px;
`;

const ProfAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`;

const ProfInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ProfName = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
`;

const ProfSub = styled.span`
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  line-height: 1;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 28px;
  max-width: 320px;
`;

const FeatureCard = styled.div`
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: var(--radius-md);
  padding: 14px;
  backdrop-filter: blur(8px);
`;

const CardIcon = styled.div`
  width: 28px;
  height: 28px;
  background: rgba(255,255,255,0.15);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: #fff;
`;

const CardLabel = styled.p`
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 2px;
`;

const CardValue = styled.p`
  font-size: 11px;
  color: rgba(255,255,255,0.6);
`;

const Dot = styled.div<{ $top: string; $left: string; $size: number; $delay: number }>`
  position: absolute;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  animation: ${pulse} ${({ $delay }) => 2 + $delay}s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const errors: { email?: string; password?: string } = {};
    if (!email) errors.email = "Informe seu e-mail";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "E-mail inválido";
    if (!password) errors.password = "Informe sua senha";
    else if (password.length < 6) errors.password = "Mínimo 6 caracteres";
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user) {
      setError("E-mail ou senha incorretos. Tente novamente.");
      setLoading(false);
      return;
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("slug")
      .eq("owner_id", authData.user.id)
      .single();

    router.push(business?.slug ? `/${business.slug}/painel/overview` : "/login");
  }

  return (
    <PageWrapper>
      <LeftPanel>
        <FormCard data-theme="light">
          <Logo>
            <LogoImgWrap>
              <LogoImg src="/logo.png" alt="Marque Já" />
            </LogoImgWrap>
            <LogoName>Marque Já</LogoName>
          </Logo>

          <Title>Acesse seu painel</Title>
          <Subtitle>Entre com suas credenciais para continuar</Subtitle>

          {error && <AlertBox>{error}</AlertBox>}

          <Form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Label htmlFor="email">E-mail</Label>
              <InputWrapper>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  $hasError={!!fieldErrors.email}
                  autoComplete="email"
                />
              </InputWrapper>
              {fieldErrors.email && <ErrorText>{fieldErrors.email}</ErrorText>}
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="password">Senha</Label>
              <InputWrapper>
                <PasswordInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  $hasError={!!fieldErrors.password}
                  autoComplete="current-password"
                />
                <EyeBtn type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </EyeBtn>
              </InputWrapper>
              {fieldErrors.password && <ErrorText>{fieldErrors.password}</ErrorText>}
            </FieldGroup>

            <OptionsRow>
              <RememberLabel>
                <Checkbox
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Lembrar de mim
              </RememberLabel>
              <ForgotLink href="/forgot-password">Esqueci a senha</ForgotLink>
            </OptionsRow>

            <SubmitButton type="submit" $loading={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </SubmitButton>
          </Form>

          <Footer>Gerenciado pela Conecta Leste SP</Footer>
        </FormCard>
      </LeftPanel>

      <RightPanel>
        <RightOverlay />

        {/* Background circles */}
        <FloatingScene>
          <BgCircle $size={320} $top="-100px" $left="55%" $delay={0} />
          <BgCircle $size={200} $top="35%" $left="-70px" $delay={1.5} />
          <BgCircle $size={140} $top="62%" $left="65%" $delay={0.8} />
          <BgCircle $size={90}  $top="18%" $left="38%" $delay={2} />
          <BgCircle $size={60}  $top="75%" $left="20%" $delay={1} />
          <BgCircle $size={110} $top="50%" $left="78%" $delay={0.5} />
          <BgCircle $size={50}  $top="10%" $left="12%" $delay={2.5} />

          {/* Dots */}
          <Dot $top="20%" $left="15%" $size={8} $delay={0} />
          <Dot $top="35%" $left="80%" $size={6} $delay={1} />
          <Dot $top="72%" $left="30%" $size={7} $delay={0.5} />
          <Dot $top="55%" $left="60%" $size={5} $delay={2} />
          <Dot $top="15%" $left="55%" $size={6} $delay={1.2} />
          <Dot $top="45%" $left="45%" $size={4} $delay={0.8} />
          <Dot $top="82%" $left="70%" $size={5} $delay={1.8} />
          <Dot $top="28%" $left="25%" $size={4} $delay={0.3} />

          {/* Profession cards */}
          <ProfCard $top="9%" $left="8%" $variant="a" $delay={0}>
            <ProfAvatar>✂️</ProfAvatar>
            <ProfInfo>
              <ProfName>Cabeleireiro</ProfName>
              <ProfSub>Corte & Estilo</ProfSub>
            </ProfInfo>
          </ProfCard>

          <ProfCard $top="7%" $right="6%" $variant="b" $delay={1}>
            <ProfAvatar>🦷</ProfAvatar>
            <ProfInfo>
              <ProfName>Dentista</ProfName>
              <ProfSub>Saúde bucal</ProfSub>
            </ProfInfo>
          </ProfCard>

          <ProfCard $top="34%" $left="5%" $variant="c" $delay={2}>
            <ProfAvatar>🔧</ProfAvatar>
            <ProfInfo>
              <ProfName>Mecânico</ProfName>
              <ProfSub>Auto & Moto</ProfSub>
            </ProfInfo>
          </ProfCard>

          <ProfCard $top="30%" $right="5%" $variant="a" $delay={3}>
            <ProfAvatar>🩺</ProfAvatar>
            <ProfInfo>
              <ProfName>Médico</ProfName>
              <ProfSub>Consultas</ProfSub>
            </ProfInfo>
          </ProfCard>

          <ProfCard $top="50%" $left="28%" $variant="b" $delay={1.5}>
            <ProfAvatar>💅</ProfAvatar>
            <ProfInfo>
              <ProfName>Manicure</ProfName>
              <ProfSub>Unhas & Estética</ProfSub>
            </ProfInfo>
          </ProfCard>

          <ProfCard $top="56%" $right="5%" $variant="c" $delay={0.5}>
            <ProfAvatar>🏋️</ProfAvatar>
            <ProfInfo>
              <ProfName>Personal</ProfName>
              <ProfSub>Treino & Saúde</ProfSub>
            </ProfInfo>
          </ProfCard>
        </FloatingScene>

        <RightContent>
          <Tagline>Sua agenda sempre cheia.</Tagline>
          <TaglineSub>
            Gerencie agendamentos, profissionais e serviços do seu negócio em um só lugar.
          </TaglineSub>
          <CardsGrid>
            <FeatureCard>
              <CardIcon><CalendarCheck size={15} weight="fill" /></CardIcon>
              <CardLabel>Agenda</CardLabel>
              <CardValue>Agendamentos em tempo real</CardValue>
            </FeatureCard>
            <FeatureCard>
              <CardIcon><UsersFour size={15} weight="fill" /></CardIcon>
              <CardLabel>Profissionais</CardLabel>
              <CardValue>Gerencie sua equipe</CardValue>
            </FeatureCard>
            <FeatureCard>
              <CardIcon><Tag size={15} weight="fill" /></CardIcon>
              <CardLabel>Serviços</CardLabel>
              <CardValue>Catálogo completo</CardValue>
            </FeatureCard>
            <FeatureCard>
              <CardIcon><ChartBar size={15} weight="fill" /></CardIcon>
              <CardLabel>Visão Geral</CardLabel>
              <CardValue>Métricas do negócio</CardValue>
            </FeatureCard>
          </CardsGrid>
        </RightContent>
      </RightPanel>
    </PageWrapper>
  );
}
