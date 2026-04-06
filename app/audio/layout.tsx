import TabNav from './TabNav'

export default function AudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TabNav />
      {children}
    </>
  )
}
