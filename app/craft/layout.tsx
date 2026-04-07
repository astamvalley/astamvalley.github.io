import BackLink from '@/app/components/BackLink'

export default function CraftLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackLink />
      {children}
    </>
  )
}
