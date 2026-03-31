import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/Cookies";
import { GoogleAnalytics } from '@next/third-parties/google'


export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_PRODUCTNAME,
  description: "The best way to build your SaaS product.",
};

/**
 * Inline script that patches the Performance API before ANY other JS executes.
 * Prevents "mgt.clearMarks is not a function" errors in Next.js minified bundles
 * where `mgt` is a minified alias for `performance`.
 *
 * Uses a raw <script> tag (not next/script) so it is embedded synchronously in
 * the HTML <head> and runs before deferred/async framework bundles.
 */
const PERF_POLYFILL = `(function(){var g=typeof globalThis!=='undefined'?globalThis:typeof window!=='undefined'?window:typeof self!=='undefined'?self:{};if(!g.performance){g.performance={}}var p=g.performance;var noop=function(){};var empty=function(){return[]};var now=function(){return Date.now()};var methods={mark:noop,clearMarks:noop,measure:noop,clearMeasures:noop,getEntriesByName:empty,getEntriesByType:empty,now:p.now?p.now.bind(p):now};for(var k in methods){if(typeof p[k]!=='function'){try{Object.defineProperty(p,k,{value:methods[k],writable:true,configurable:true})}catch(e){try{p[k]=methods[k]}catch(e2){}}}}if(g.Performance&&g.Performance.prototype){var pp=g.Performance.prototype;for(var k in methods){if(typeof pp[k]!=='function'){try{Object.defineProperty(pp,k,{value:methods[k],writable:true,configurable:true})}catch(e){try{pp[k]=methods[k]}catch(e2){}}}}}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let theme = process.env.NEXT_PUBLIC_THEME
  if(!theme) {
    theme = "theme-sass3"
  }
  const gaID = process.env.NEXT_PUBLIC_GOOGLE_TAG;

  return (
    <html lang="en" suppressHydrationWarning>
    <head>
      {/* Raw synchronous script — runs before ANY deferred/async JS (including Next.js bundles) */}
      <script dangerouslySetInnerHTML={{ __html: PERF_POLYFILL }} />
    </head>
    <body className={theme} suppressHydrationWarning>
      {children}
      <Analytics />
      <CookieConsent />
      { gaID && (
          <GoogleAnalytics gaId={gaID}/>
      )}

    </body>
    </html>
  );
}
