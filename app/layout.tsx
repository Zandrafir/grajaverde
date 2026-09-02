import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

// Fonte do redesign GrajaVerde (handoff: design_handoff_grajaverde).
// next/font/google auto-hospeda o arquivo (sem chamada em runtime ao
// Google Fonts, ao contrario do <link> do arquivo de referencia) e
// expõe a variavel --font-space-grotesk usada em app/globals.css.
// Space Grotesk so vai ate peso 700 no Google Fonts (nao tem 800/900) -
// "variable" carrega a familia variavel inteira; o font-weight:800/900
// usado no titulo/numeros do redesign satura no 700 real da fonte, que
// e visualmente o mesmo resultado que o arquivo de referencia (ele usa
// a mesma fonte, com a mesma limitacao).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: "variable",
});

export const metadata: Metadata = {
  title: "GrajaVerde",
  description: "Movimento Pelo Clima — Diretoria de Ensino Sul 3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
