import TabNav from './TabNav'

export default function SimLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TabNav />
      {children}
    </>
  )
}
