import type { Metadata } from "next";
import { Inter } from "next/font/google";
import StyledComponentsRegistry from "./lib/registry";
import GlobalStyle from "./styles/global";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Marque Já | Agendamento Online",
  description: "Plataforma de agendamento online para comércios locais",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <GlobalStyle />
          {children}
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
