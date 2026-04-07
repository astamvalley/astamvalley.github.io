import BackLink from '@/app/components/BackLink'

export default function SignatureLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackLink />
      {children}
    </>
  )
}
