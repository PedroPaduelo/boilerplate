import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';

/**
 * Casca visual das telas de autenticação (login/registro).
 *
 * Existe para (a) eliminar a duplicação entre `login.tsx` e `register.tsx`,
 * que eram idênticos exceto por título/descrição, e (b) aplicar a MARCA:
 * antes as duas telas mostravam um quadrado com a letra "W" — resquício do
 * boilerplate — em vez da identidade do auditorIA.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 p-4">
      {/* Halo da cor da marca — dá profundidade sem competir com o formulário. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <img
            src="/auditoria-logo.png"
            alt="auditorIA"
            className="h-8 w-auto select-none"
            draggable={false}
          />
          <p className="text-sm text-muted-foreground">
            Pergunte aos seus dados. Receba respostas auditáveis.
          </p>
        </div>

        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardHeader className="items-center text-center">
            <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
              {title}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {children}
            <p className="mt-6 text-center text-xs text-muted-foreground">{footer}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
