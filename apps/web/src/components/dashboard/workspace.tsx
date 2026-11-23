
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

import {
  LayoutDashboard,
  ClipboardList,
  Utensils,
  CalendarDays,
  Settings,
  Menu,
  X,
} from 'lucide-react';

import type { Membership } from '@beelicious/shared';
import { logout } from '@/lib/dashboard/actions';

// ============================================
// API ERROR
// ============================================

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// ============================================
// DASHBOARD API
// ============================================

export async function dashboardApi<T>(
  path: string,
  tenant: string,
  options: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const response = await fetch(`/api/dashboard/${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      'x-tenant-id': tenant,
    },
    ...(options.body
      ? { body: JSON.stringify(options.body) }
      : {}),
    ...(options.signal
      ? { signal: options.signal }
      : {}),
    cache: 'no-store',
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json.error?.message ??
        'Layanan tidak tersedia. Coba kembali.',
      response.status,
    );
  }

  return json.data as T;
}

// ============================================
// MOCK MEMBERSHIP
// ============================================

// Data tenant sementara untuk development.
// Tidak menggunakan database maupun Supabase.

const mockMembership = {
  tenantId: '00000000-0000-4000-8000-000000000001',
  role: 'OWNER',
  tenant: {
    name: 'Beelicious Demo Tenant',
    isActive: true,
  },
} as unknown as Membership;

// ============================================
// WORKSPACE CONTEXT
// ============================================

const Workspace = createContext<{
  tenant: string;
  membership: Membership;
  bypass:boolean;
} | null>(null);

export function useWorkspace() {
  const value = useContext(Workspace);

  if (!value) {
    throw new Error('Workspace required');
  }

  return value;
}


// ============================================
// DEVELOPMENT MOCK DATA
// ============================================

function getMockDashboardData<T>(name: string, path: string): T {
  const now = new Date();

  const dateAfter = (days: number, hour: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
  };

  if (name === 'menu') {
    const categories = [
      {
        id: 'cat-001',
        name: 'Makanan',
        sortOrder: 1,
        isActive: true,
        updatedAt: now.toISOString(),
      },
      {
        id: 'cat-002',
        name: 'Minuman',
        sortOrder: 2,
        isActive: true,
        updatedAt: now.toISOString(),
      },
      {
        id: 'cat-003',
        name: 'Dessert',
        sortOrder: 3,
        isActive: true,
        updatedAt: now.toISOString(),
      },
    ];

    const items = [
      {
        id: 'menu-001',
        categoryId: 'cat-001',
        name: 'Nasi Ayam Teriyaki',
        description: 'Nasi dengan ayam teriyaki dan sayuran.',
        price: 25000,
        imageUrl: null,
        sortOrder: 1,
        isAvailable: true,
        updatedAt: now.toISOString(),
      },
      {
        id: 'menu-002',
        categoryId: 'cat-001',
        name: 'Chicken Katsu',
        description: 'Ayam katsu dengan nasi dan saus spesial.',
        price: 28000,
        imageUrl: null,
        sortOrder: 2,
        isAvailable: true,
        updatedAt: now.toISOString(),
      },
      {
        id: 'menu-003',
        categoryId: 'cat-001',
        name: 'Nasi Goreng Spesial',
        description: 'Nasi goreng dengan telur dan topping.',
        price: 22000,
        imageUrl: null,
        sortOrder: 3,
        isAvailable: false,
        updatedAt: now.toISOString(),
      },
      {
        id: 'menu-004',
        categoryId: 'cat-002',
        name: 'Es Teh Manis',
        description: 'Teh segar dengan es.',
        price: 6000,
        imageUrl: null,
        sortOrder: 4,
        isAvailable: true,
        updatedAt: now.toISOString(),
      },
      {
        id: 'menu-005',
        categoryId: 'cat-002',
        name: 'Kopi Susu',
        description: 'Kopi susu dengan rasa creamy.',
        price: 15000,
        imageUrl: null,
        sortOrder: 5,
        isAvailable: true,
        updatedAt: now.toISOString(),
      },
      {
        id: 'menu-006',
        categoryId: 'cat-003',
        name: 'Chocolate Cake',
        description: 'Kue cokelat lembut.',
        price: 18000,
        imageUrl: null,
        sortOrder: 6,
        isAvailable: true,
        updatedAt: now.toISOString(),
      },
    ];

    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const search = (params.get('search') ?? '').toLowerCase();
    const categoryId = params.get('categoryId') ?? '';
    const page = Math.max(1, Number(params.get('page') ?? 1));
    const pageSize = 25;

    const filtered = items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search) ||
        (item.description ?? '').toLowerCase().includes(search);

      const matchesCategory =
        !categoryId || item.categoryId === categoryId;

      return matchesSearch && matchesCategory;
    });

    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      categories,
      total: filtered.length,
    } as T;
  }

  if (name === 'pickup') {
    const items = [
      {
        id: 'pickup-001',
        startsAt: dateAfter(1, 10),
        endsAt: dateAfter(1, 11),
        capacity: 10,
        confirmed: 4,
        held: 2,
        remaining: 4,
        isAvailable: true,
        updatedAt: now.toISOString(),
      },
      {
        id: 'pickup-002',
        startsAt: dateAfter(1, 11),
        endsAt: dateAfter(1, 12),
        capacity: 12,
        confirmed: 5,
        held: 1,
        remaining: 6,
        isAvailable: true,
        updatedAt: now.toISOString(),
      },
      {
        id: 'pickup-003',
        startsAt: dateAfter(1, 13),
        endsAt: dateAfter(1, 14),
        capacity: 10,
        confirmed: 3,
        held: 0,
        remaining: 7,
        isAvailable: false,
        updatedAt: now.toISOString(),
      },
    ];

    const hours = [
      { dayOfWeek: 0, opensAt: 480, closesAt: 1020, isClosed: true },
      { dayOfWeek: 1, opensAt: 480, closesAt: 1020, isClosed: false },
      { dayOfWeek: 2, opensAt: 480, closesAt: 1020, isClosed: false },
      { dayOfWeek: 3, opensAt: 480, closesAt: 1020, isClosed: false },
      { dayOfWeek: 4, opensAt: 480, closesAt: 1020, isClosed: false },
      { dayOfWeek: 5, opensAt: 480, closesAt: 1020, isClosed: false },
      { dayOfWeek: 6, opensAt: 480, closesAt: 1020, isClosed: false },
    ].map((hour) => ({
      ...hour,
      id: `hours-${hour.dayOfWeek}`,
      updatedAt: now.toISOString(),
    }));

    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const page = Math.max(1, Number(params.get('page') ?? 1));
    const pageSize = 25;

    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      hours,
      total: items.length,
    } as T;
  }

  throw new Error(`Mock data belum tersedia untuk halaman: ${name}`);
}

// ============================================
// DASHBOARD QUERY
// ============================================


// export function useDashboardQuery<T>(
//   name: string,
//   path: string,
//   poll = false,
//   enabled = true,
// ) {
//   const { tenant } = useWorkspace();

//   return useQuery({
//     queryKey: ['dashboard', tenant, name, path],

//     queryFn: ({ signal }) =>
//       dashboardApi<T>(path, tenant, { signal }),

//     enabled,

//     ...(poll
//       ? {
//           refetchInterval: 8000,
//           refetchIntervalInBackground: false,
//         }
//       : {}),

//     staleTime: 2000,

//     retry: (count, error) =>
//       !(
//         error instanceof ApiError &&
//         [401, 403, 404].includes(error.status)
//       ) && count < 1,
//   });
// }

export function useDashboardQuery<T>(
  name: string,
  path: string,
  poll = false,
  enabled = true,
) {
  const { tenant, bypass } = useWorkspace();

  return useQuery({
    queryKey: ['dashboard', tenant, name, path],

    queryFn: ({ signal }) => {
      if (bypass && (name === 'menu' || name === 'pickup')) {
        return Promise.resolve(getMockDashboardData<T>(name, path));
      }

      return dashboardApi<T>(path, tenant, { signal });
    },

    enabled,

    ...(poll
      ? {
          refetchInterval: bypass ? false : 8000,
          refetchIntervalInBackground: false,
        }
      : {}),

    staleTime: 2000,

    retry: (count, error) =>
      !(
        error instanceof ApiError &&
        [401, 403, 404].includes(error.status)
      ) && count < 1,
  });
}


// ============================================
// WORKSPACE PROVIDER
// ============================================

export function WorkspaceProvider({
  children,
  account,
  bypass = false,
}: {
  children: ReactNode;
  account: string;
  bypass?: boolean;
}) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <Shell account={account} bypass={bypass}>
        {children}
      </Shell>
    </QueryClientProvider>
  );
}

// ============================================
// DASHBOARD SHELL
// ============================================

function Shell({
  children,
  account,
  bypass,
}: {
  children: ReactNode;
  account: string;
  bypass: boolean;
}) {
  // Ambil data membership hanya jika bypass tidak aktif.
  const query = useQuery({
    queryKey: ['memberships'],

    queryFn: ({ signal }) =>
      dashboardApi<Membership[]>('memberships', '', {
        signal,
      }),

    enabled: !bypass,

    retry: false,

    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  // Gunakan mock membership ketika development bypass aktif.
  const memberships = bypass
    ? [mockMembership]
    : query.data;

  const [selected, setSelected] = useState('');
  const [open, setOpen] = useState(false);

  const path = usePathname();
  const router = useRouter();
  const client = useQueryClient();

  const member =
    memberships?.find(
      (m) => m.tenantId === selected,
    ) ?? memberships?.[0];

  // Redirect ke login jika session tidak valid.
  useEffect(() => {
    if (
      !bypass &&
      query.error instanceof ApiError &&
      query.error.status === 401
    ) {
      client.clear();
      router.replace('/login');
    }
  }, [bypass, query.error, client, router]);

  // Loading membership.
  if (!bypass && query.isPending) {
    return (
      <main id="main" className="dashboard dash-loading">
        <p role="status">Memuat ruang tenant…</p>
      </main>
    );
  }

  // Membership error.
  if (!bypass && query.error) {
    return (
      <main id="main" className="dashboard dash-loading">
        <h1>Akses belum tersedia</h1>

        <p role="alert">
          {query.error.message}
        </p>

        <button onClick={() => query.refetch()}>
          Coba kembali
        </button>

        <form action={logout}>
          <button>Keluar</button>
        </form>
      </main>
    );
  }

  // Tidak ada membership.
  if (!member) {
    return (
      <main id="main" className="dashboard dash-loading">
        <h1>Belum ada akses tenant</h1>

        <p>
          Hubungi pengelola untuk menghubungkan akun ini
          dengan tenant.
        </p>

        <form action={logout}>
          <button>Keluar</button>
        </form>
      </main>
    );
  }

  // ============================================
  // SIDEBAR NAVIGATION
  // ============================================

  const nav = [
    ['/dashboard', 'Ringkasan', LayoutDashboard],
    ['/dashboard/orders', 'Pesanan', ClipboardList],
    ['/dashboard/menu', 'Menu', Utensils],
    ['/dashboard/pickup', 'Jadwal Pickup', CalendarDays],

    ...(member.role === 'OWNER'
      ? [
          [
            '/dashboard/settings',
            'Pengaturan',
            Settings,
          ] as const,
        ]
      : []),
  ] as const;

  // ============================================
  // DASHBOARD UI
  // ============================================

  return (
    <Workspace.Provider
      value={{
        tenant: member.tenantId,
        membership: member,
        bypass,
      }}
    >
      <div className="dashboard dash-shell">

        {/* MOBILE HEADER */}

        <header className="dash-mobile">
          <Link
            className="dash-brand"
            href="/dashboard"
          >
            beelicious.
          </Link>

          <button
            aria-label={
              open
                ? 'Tutup navigasi'
                : 'Buka navigasi'
            }
            aria-expanded={open}
            aria-controls="dash-sidebar"
            onClick={() => setOpen(!open)}
          >
            {open ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </header>

        {/* SIDEBAR */}

        <aside
          id="dash-sidebar"
          className={`dash-sidebar${
            open ? ' is-open' : ''
          }`}
        >
          <Link
            href="/dashboard"
            className="dash-brand"
          >
            beelicious.
          </Link>

          {/* TENANT SELECTOR */}

          {memberships && memberships.length > 1 ? (
            <label>
              Tenant

              <select
                value={member.tenantId}
                onChange={(e) => {
                  void client.cancelQueries();

                  client.removeQueries({
                    queryKey: ['dashboard'],
                  });

                  setSelected(e.target.value);
                  setOpen(false);

                  router.push('/dashboard');
                }}
              >
                {memberships.map((m) => (
                  <option
                    key={m.tenantId}
                    value={m.tenantId}
                  >
                    {m.tenant.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="dash-tenant">
              {member.tenant.name}
            </p>
          )}

          {/* TENANT ROLE */}

          <p className="dash-muted dash-role-badge">
            {member.role === 'OWNER'
              ? 'Pemilik'
              : 'Staf'}

            {!member.tenant.isActive
              ? ' · Tenant nonaktif'
              : ''}
          </p>

          {/* NAVIGATION */}

          <nav aria-label="Navigasi tenant">
            {nav.map(([url, label, Icon]) => (
              <Link
                key={url}
                href={url}
                aria-current={
                  (
                    url === '/dashboard'
                      ? path === url
                      : path.startsWith(url)
                  )
                    ? 'page'
                    : undefined
                }
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>

          {/* ACCOUNT */}

          <div className="dash-account">
            {bypass ? <span className="dash-env-badge">Development Tenant</span> : <span>{account}</span>}

            <Link href="/dashboard/password">
              Ganti kata sandi
            </Link>

            <form
              action={logout}
              onSubmit={() => client.clear()}
            >
              <button>Keluar</button>
            </form>
          </div>
        </aside>

        {/* MAIN CONTENT */}

        <main
          id="main"
          className="dash-content"
          key={member.tenantId}
        >
          {children}
        </main>

      </div>
    </Workspace.Provider>
  );
}

// ============================================
// QUERY STATE
// ============================================

export function QueryState({
  pending,
  error,
  refresh,
}: {
  pending: boolean;
  error: Error | null;
  refresh: () => void;
}) {
  const router = useRouter();
  const client = useQueryClient();

  useEffect(() => {
    if (
      error instanceof ApiError &&
      error.status === 401
    ) {
      client.clear();
      router.replace('/login');
    }
  }, [error, router, client]);

  return pending ? (
    <div
      className="dash-skeleton"
      role="status"
    >
      Memuat data…
    </div>
  ) : error ? (
    <div
      className="dash-error"
      role="alert"
    >
      <p>{error.message}</p>

      <button onClick={refresh}>
        Coba kembali
      </button>
    </div>
  ) : null;
}

// ============================================
// PAGE HEADING
// ============================================

export function PageHeading({
  title,
  description,
  refresh,
}: {
  title: string;
  description: string;
  refresh?: () => void;
}) {
  return (
    <header className="dash-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {refresh && (
        <button onClick={refresh}>
          Muat ulang
        </button>
      )}
    </header>
  );
}

// ============================================
// PAGINATION
// ============================================

export function Pagination({
  page,
  total,
  size,
  onPage,
}: {
  page: number;
  total: number;
  size: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="dash-pagination">
      <span>
        {total} hasil · Halaman {page}
      </span>

      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Sebelumnya
      </button>

      <button
        disabled={page * size >= total}
        onClick={() => onPage(page + 1)}
      >
        Berikutnya
      </button>
    </div>
  );
}

// ============================================
// CURRENCY FORMATTER
// ============================================

export const money = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);

// ============================================
// DATE FORMATTER
// ============================================

export const time = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value)) + ' WIB';

// ============================================
// ORDER STATUS LABELS
// ============================================

export const stageLabels: Record<string, string> = {
  NEW: 'Menunggu diterima',
  ACCEPTED: 'Diterima',
  PREPARING: 'Disiapkan',
  READY_FOR_PICKUP: 'Siap diambil',
  COMPLETED: 'Selesai',
  REQUIRES_REVIEW: 'Perlu pemeriksaan',
  PENDING_PAYMENT: 'Menunggu pembayaran',
  CONFIRMED: 'Terkonfirmasi',
  SUCCEEDED: 'Lunas',
  PENDING: 'Menunggu',
  INITIATING: 'Diproses',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Kedaluwarsa',
  FAILED: 'Gagal',
};

// ============================================
// STATUS COMPONENT
// ============================================


export function Status({
  value,
}: {
  value: string | null;
}) {
  const statusClasses: Record<string, string> = {
    // Payment status
    SUCCEEDED: 'is-paid',
    PENDING: 'is-pending',
    INITIATING: 'is-pending',
    FAILED: 'is-cancelled',
    EXPIRED: 'is-cancelled',

    // Fulfillment status
    NEW: 'is-new',
    ACCEPTED: 'is-accepted',
    PREPARING: 'is-preparing',
    READY_FOR_PICKUP: 'is-ready',
    COMPLETED: 'is-completed',
    REQUIRES_REVIEW: 'is-review',
    CANCELLED: 'is-cancelled',
    REJECTED: 'is-cancelled',
  };

  return (
    <span
      className={`dash-status ${
        value ? statusClasses[value] ?? '' : ''
      }`}
    >
      {value
        ? stageLabels[value] ?? value
        : 'Belum tersedia'}
    </span>
  );
}
