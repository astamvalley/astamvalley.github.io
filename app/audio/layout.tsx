import BackLink from '@/app/components/BackLink'

export default function AudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackLink />
      {children}
    </>
  )
}
