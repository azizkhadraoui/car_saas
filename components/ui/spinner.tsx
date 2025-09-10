"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<SVGElement> {
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 48,
}

const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const dimension = sizeMap[size] ?? sizeMap.md

    return (
      <svg
        ref={ref}
        className={cn(
          "animate-spin text-primary",
          className
        )}
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
    )
  }
)

Spinner.displayName = "Spinner"

export { Spinner }
