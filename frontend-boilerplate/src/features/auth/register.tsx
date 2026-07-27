import { Link } from '@astryxdesign/core/Link';
import { RegisterForm } from './components/register-form';
import { AuthShell } from './components/auth-shell';

export function RegisterPage() {
  return (
    <AuthShell
      title="Criar sua conta"
      description="Leva menos de um minuto. Depois é só conectar um banco e perguntar."
      footer={
        <>
          Já possui uma conta? <Link href="/login">Entrar</Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
