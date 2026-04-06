import TabNav from './TabNav'

export default function MatterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TabNav />
      {children}
    </>
  )
}
