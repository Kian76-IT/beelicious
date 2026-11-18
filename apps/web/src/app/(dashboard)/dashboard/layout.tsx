
import { redirect } from 'next/navigation';
import { authClient } from '@/lib/dashboard/auth';
import { dashboardConfig } from '@/lib/dashboard/config';
import { WorkspaceProvider } from '@/components/dashboard/workspace';
import '@/components/dashboard/dashboard.css';

export const metadata = {
  title: 'Dashboard Tenant — Beelicious',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configuration = dashboardConfig();

  // Development bypass
  if (configuration?.bypass) {
    return (
      <WorkspaceProvider
        account="Development Tenant"
        bypass={true}
      >
        {children}
      </WorkspaceProvider>
    );
  }

  // Normal Supabase authentication
  const client = await authClient();

  const user = client
    ? (await client.auth.getUser()).data.user
    : null;

  if (!user) redirect('/login');

  return (
    <WorkspaceProvider
      account={user.email ?? 'Akun tenant'}
      bypass={false}
    >
      {children}
    </WorkspaceProvider>
  );
}
