import { getData } from '@/lib/data'
import Portfolio from '@/components/Portfolio'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const data = await getData()
  return <Portfolio data={data} />
}
