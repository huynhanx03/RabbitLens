import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppShell } from '../app-shell';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (context.auth.session.type === 'anonymous' || !context.auth.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: AppShell,
});
