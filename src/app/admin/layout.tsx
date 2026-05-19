import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { isAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
    title: 'Admin | HSE Virtual Support Agent',
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || !isAdmin(session.user?.email)) {
        redirect('/');
    }

    return <AdminShell>{children}</AdminShell>;
}
