import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { RegisterForm } from './components/register-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';

export function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground">
              W
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
              Criar sua conta
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
              Preencha os dados abaixo para começar a usar a plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Já possui uma conta?{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
