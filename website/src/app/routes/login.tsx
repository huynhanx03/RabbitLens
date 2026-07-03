import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginForm } from '@/auth/login-form';

export const Route = createFileRoute('/login')({
  beforeLoad: ({ context }) => {
    if (context.auth.session.type !== 'anonymous' && context.auth.user) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginForm,
});
