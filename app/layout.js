import './globals.css'

export const metadata = {
  title: 'bymedina — Weekly Design Dispatch',
  description: 'Design moves fast. Jaden Medina makes sense of it. Weekly insights on design trends, tools, and culture.',
  openGraph: {
    title: 'bymedina',
    description: 'Weekly design insights from Jaden Medina',
    type: 'website',
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
