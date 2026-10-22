import { ClerkProvider } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Linguacode - AI-Powered Code Refactoring',
  description: 'AI-Powered Code Refactoring & Interview Prep',
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: 'Linguacode - AI-Powered Code Refactoring',
    description: 'AI-Powered Code Refactoring & Interview Prep',
    url: 'https://linguacode-1.onrender.com',
    siteName: 'Linguacode',
    images: [
      {
        url: 'https://linguacode-1.onrender.com/logo.png', // الرابط المطلق للوغو ليظهر بوضوح في معاينة الروابط
        width: 1200,
        height: 630,
        alt: 'Linguacode Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}