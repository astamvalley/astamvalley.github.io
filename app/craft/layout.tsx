import TabNav from './TabNav'

export default function CraftLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TabNav />
      {children}
    </>
  )
}
