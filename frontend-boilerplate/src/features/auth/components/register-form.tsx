import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { VStack } from '@astryxdesign/core/Layout';
import { TextInput } from '@astryxdesign/core/TextInput';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { useRegister } from '../hooks/use-auth';

const registerSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { mutate: register, isPending, isError, error } = useRegister();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: { name: '', email: '', password: '' },
  });

  return (
    <form onSubmit={handleSubmit((data) => register(data))} noValidate>
      <VStack gap={4}>
        {isError && (
          <Banner
            status="error"
            title="Não foi possível criar a conta"
            description={getApiErrorMessage(
              error,
              'Tente novamente em alguns instantes.',
            )}
          />
        )}

        <FormLayout>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <TextInput
                label="Nome"
                htmlName="name"
                placeholder="Seu nome completo"
                hasAutoFocus
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                status={
                  errors.name
                    ? { type: 'error', message: errors.name.message }
                    : undefined
                }
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <TextInput
                label="E-mail"
                type="email"
                htmlName="email"
                placeholder="seu@email.com"
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
                description="No mínimo 6 caracteres."
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
          label="Criar conta"
          variant="primary"
          width="100%"
          isLoading={isPending}
        />
      </VStack>
    </form>
  );
}
