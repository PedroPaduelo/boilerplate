import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { VStack } from '@astryxdesign/core/Layout';
import { TextInput } from '@astryxdesign/core/TextInput';
import { useLogin } from '../hooks/use-auth';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Informe seu e-mail')
    .email('Esse e-mail não parece válido — confira o formato'),
  password: z.string().min(6, 'A senha tem no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { mutate: login, isPending, isError } = useLogin();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    // Valida ao sair do campo (não a cada tecla) — menos ruído enquanto digita.
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  return (
    <form onSubmit={handleSubmit((data) => login(data))} noValidate>
      <VStack gap={4}>
        {/* Falha de submit (credencial/rede) é persistente e pertence ao topo do
            formulário — toast some antes de o usuário ligar causa e efeito.
            A mensagem não diz QUAL campo errou: credencial se confirma inteira. */}
        {isError && (
          <Banner
            status="error"
            title="Não foi possível entrar"
            description="Confira o e-mail e a senha e tente novamente."
          />
        )}

        <FormLayout>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextInput
                label="E-mail"
                type="email"
                htmlName="email"
                placeholder="voce@empresa.com"
                hasAutoFocus
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                status={
                  errors.email
                    ? { type: 'error', message: errors.email.message }
                    : undefined
                }
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextInput
                label="Senha"
                type="password"
                htmlName="password"
                placeholder="••••••••"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                status={
                  errors.password
                    ? { type: 'error', message: errors.password.message }
                    : undefined
                }
              />
            )}
          />
        </FormLayout>

        <Button
          type="submit"
          label="Entrar"
          variant="primary"
          width="100%"
          isLoading={isPending}
        />
      </VStack>
    </form>
  );
}
