import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { getData } from '@/lib/data'
import AdminPanel from '@/components/AdminPanel'

export default async function AdminPage() {
  const auth = await isAuthenticated()
  if (!auth) redirect('/admin/login')

  const data = await getData()
  return <AdminPanel data={data} />
}
