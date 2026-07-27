import { z } from 'zod';

const baseSchema = z.object({
  name: z.string().min(1, 'Informe o nome'),
  email: z.string().email('E-mail inválido'),
  password: z.string(),
  role: z.enum(['ADMIN', 'ANALYST', 'CREATOR', 'VIEWER', 'USER']),
  isActive: z.boolean(),
});

export type UserFormData = z.infer<typeof baseSchema>;

/**
 * Política de senha espelhando o backend (mín. 8, ao menos 1 letra e 1 número).
 *
 * Em EDIÇÃO a senha é opcional: campo vazio mantém a atual; preenchido, precisa
 * cumprir a regra inteira. Por isso o schema depende do modo do formulário.
 */
export function buildUserFormSchema(isEdit: boolean) {
  return baseSchema.superRefine((value, ctx) => {
    const password = value.password;
    if (isEdit && password.length === 0) return;

    if (password.length < 8) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'Mínimo 8 caracteres',
      });
    } else if (!/[A-Za-z]/.test(password)) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'Precisa de ao menos uma letra',
      });
    } else if (!/[0-9]/.test(password)) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: 'Precisa de ao menos um número',
      });
    }
  });
}
