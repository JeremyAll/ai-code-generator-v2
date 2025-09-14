import './globals.css'

export const metadata = {
  title: 'BAML Streaming API Demo',
  description: 'Next.js streaming API with Claude integration',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}