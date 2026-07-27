import { Link } from '@astryxdesign/core/Link';
import { LoginForm } from './components/login-form';
import { AuthShell } from './components/auth-shell';

export function LoginPage() {
  return (
    <AuthShell
      title="Entrar na sua conta"
      description="Acesse seus dashboards, conexões e o agente de auditoria."
      footer={
        <>
          Ainda não tem acesso? <Link href="/register">Criar conta</Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
