import { Link } from 'react-router-dom';
import { RegisterForm } from './components/register-form';
import { AuthShell } from './components/auth-shell';

export function RegisterPage() {
  return (
    <AuthShell
      title="Criar sua conta"
      description="Leva menos de um minuto. Depois é só conectar um banco e perguntar."
      footer={
        <>
          Já possui uma conta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
