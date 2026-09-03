import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AR Analytics — Turn Raw Data into Decisions',
  description: 'Connect your spreadsheets and datasets. AR Analytics automatically discovers trends, anomalies, relationships and opportunities — and explains them in plain language.',
  openGraph: {
    title: 'AR Analytics — Turn Raw Data into Decisions',
    description: 'AI-powered data analytics that automatically discovers trends, anomalies, and insights from your spreadsheets.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
