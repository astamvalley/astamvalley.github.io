import TabNav from './TabNav'

export default function PretextLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <TabNav />
      {children}
    </div>
  )
}
