import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LoginForm } from './components/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';

export function LoginPage() {
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
              Acessar a plataforma
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-muted-foreground">
              Informe suas credenciais para entrar no painel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Ainda não tem acesso?{' '}
              <Link
                to="/register"
                className="font-medium text-primary hover:underline"
              >
                Criar conta
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
