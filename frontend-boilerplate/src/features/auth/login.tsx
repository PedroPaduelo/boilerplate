import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LoginForm } from './components/login-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription>Entre com seu email e senha</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Nao tem conta?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Criar conta
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
