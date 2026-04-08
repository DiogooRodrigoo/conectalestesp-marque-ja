"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Raleway } from "next/font/google";
import styled, { keyframes } from "styled-components";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, Eye, EyeSlash, CheckCircle, Warning } from "@phosphor-icons/react";
import Link from "next/link";

const raleway = Raleway({ subsets: ["latin"], weight: ["700", "800"] });

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4f5;
  padding: 24px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 16px;
  padding: 36px;
  animation: ${fadeIn} 0.4s ease both;

  --color-text: #09090b;
  --color-text-muted: #71717a;
  --color-border: #e4e4e7;
  --color-bg: #f4f4f5;
  --color-surface-2: #efefef;
  --color-danger: #ef4444;
  --color-primary: #f97316;
  --color-primary-dark: #ea6c0a;
  --color-success: #22c55e;
  --radius-sm: 8px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
  transition: color 0.15s;

  &:hover { color: var(--color-primary); }
`;

const LogoName = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.3px;
  font-family: ${raleway.style.fontFamily};
  margin-bottom: 8px;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.4px;
  margin-bottom: 6px;
`;

const Subtitle = styled.p`
  font-size: 13.5px;
  color: var(--color-text-muted);
  line-height: 1.55;
  margin-bottom: 24px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
`;

const Label = styled.label`
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-text-muted);
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  height: 42px;
  background: var(--color-bg);
  border: 1.5px solid ${({ $hasError }) => ($hasError ? "var(--color-danger)" : "var(--color-border)")};
  border-radius: var(--radius-sm);
  padding: 0 44px 0 12px;
  font-size: 14px;
  color: var(--color-text);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder { color: var(--color-text-muted); opacity: 0.7; }

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  }
`;

const EyeBtn = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
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

const SubmitButton = styled.button<{ $loading?: boolean }>`
  width: 100%;
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

const AlertBox = styled.div<{ $success?: boolean }>`
  background: ${({ $success }) => $success ? "rgba(34, 197, 94, 0.08)" : "rgba(239, 68, 68, 0.08)"};
  border: 1px solid ${({ $success }) => $success ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)"};
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  font-size: 13px;
  color: ${({ $success }) => $success ? "var(--color-success)" : "var(--color-danger)"};
  margin-bottom: 14px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const SuccessState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 8px 0;
`;

const SuccessIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-success);
`;

const SuccessTitle = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
`;

const SuccessText = styled.p`
  font-size: 13.5px;
  color: var(--color-text-muted);
  line-height: 1.55;
`;

const BackToLogin = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  padding: 13px;
  border-radius: var(--radius-sm);
  margin-top: 8px;
  transition: background 0.15s;

  &:hover { background: var(--color-primary-dark); }
`;

const InvalidState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 8px 0;
`;

const InvalidIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-danger);
`;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exchanging, setExchanging] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setExchanging(false);
      return;
    }
    getSupabaseClient()
      .auth.exchangeCodeForSession(code)
      .then(({ error: err }) => {
        if (err) {
          setError("Link inválido ou expirado. Solicite um novo link de redefinição.");
        } else {
          setReady(true);
        }
        setExchanging(false);
      });
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await getSupabaseClient().auth.updateUser({ password });

    if (updateError) {
      setError("Não foi possível atualizar a senha. Tente novamente.");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 3000);
  }

  if (exchanging) {
    return (
      <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: 14 }}>
        Verificando link...
      </p>
    );
  }

  if (done) {
    return (
      <SuccessState>
        <SuccessIcon>
          <CheckCircle size={28} weight="fill" />
        </SuccessIcon>
        <SuccessTitle>Senha atualizada!</SuccessTitle>
        <SuccessText>
          Sua senha foi redefinida com sucesso. Redirecionando para o login...
        </SuccessText>
        <BackToLogin href="/login">Ir para o login</BackToLogin>
      </SuccessState>
    );
  }

  if (!ready) {
    return (
      <InvalidState>
        <InvalidIcon>
          <Warning size={28} weight="fill" />
        </InvalidIcon>
        <SuccessTitle>Link inválido</SuccessTitle>
        <SuccessText>
          {error || "Este link de redefinição é inválido ou expirou."}
        </SuccessText>
        <BackToLogin href="/forgot-password">Solicitar novo link</BackToLogin>
      </InvalidState>
    );
  }

  return (
    <>
      <Title>Nova senha</Title>
      <Subtitle>Crie uma senha forte para sua conta.</Subtitle>

      {error && (
        <AlertBox>
          {error}
        </AlertBox>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          <Label htmlFor="password">Nova senha</Label>
          <InputWrapper>
            <StyledInput
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <EyeBtn type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </EyeBtn>
          </InputWrapper>
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="confirm">Confirmar senha</Label>
          <InputWrapper>
            <StyledInput
              id="confirm"
              type={showConfirm ? "text" : "password"}
              placeholder="Repita a nova senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              $hasError={!!confirm && confirm !== password}
            />
            <EyeBtn type="button" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <EyeSlash size={16} /> : <Eye size={16} />}
            </EyeBtn>
          </InputWrapper>
          {confirm && confirm !== password && <ErrorText>As senhas não coincidem</ErrorText>}
        </FieldGroup>

        <SubmitButton type="submit" $loading={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </SubmitButton>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <PageWrapper>
      <Card data-theme="light">
        <BackLink href="/login">
          <ArrowLeft size={14} weight="bold" />
          Voltar ao login
        </BackLink>
        <LogoName>Marque Já</LogoName>
        <Suspense fallback={
          <p style={{ textAlign: "center", color: "#71717a", fontSize: 14 }}>Carregando...</p>
        }>
          <ResetPasswordForm />
        </Suspense>
      </Card>
    </PageWrapper>
  );
}
