import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "99Freela API REST",
  description: "API REST completa com Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
