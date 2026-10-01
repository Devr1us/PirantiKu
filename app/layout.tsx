import type { Metadata } from "next";
import { Open_Sans, Libre_Baskerville } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/layout/motion-provider";
import { CartProvider } from "@/lib/cart-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME, TAGLINE, APP_DESCRIPTION } from "@/lib/constants";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-libre-baskerville",
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} | ${TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${openSans.variable} ${libreBaskerville.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--petrol)] font-sans antialiased">
        <MotionProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1 flex flex-col w-full">
              {children}
            </main>
            <Footer />
            <Toaster />
          </CartProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
