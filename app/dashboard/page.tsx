import { redirect } from 'next/navigation'

export default function DashboardRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  return <RedirectWithParams searchParams={searchParams} />
}

async function RedirectWithParams({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams
  const qs = new URLSearchParams(params).toString()
  redirect(`/localboost/dashboard${qs ? `?${qs}` : ''}`)
}
