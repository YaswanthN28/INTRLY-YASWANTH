"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Suppress the React 19 / Next.js 16 false-positive warning for next-themes script tag
if (typeof console !== "undefined") {
  const origError = console.error
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : (args[0] as any)?.message || ""
    if (
      typeof msg === "string" &&
      (msg.includes("Encountered a script tag while rendering React component") ||
       msg.includes("Scripts inside React components are never executed"))
    ) {
      return
    }
    origError.apply(console, args)
  }
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
