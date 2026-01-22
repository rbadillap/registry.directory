import { RegistryItem } from "./viewer-types"

export function getHardcodedItems(registryName: string): RegistryItem[] {
  // For now, return the same hardcoded items for all registries
  // In the future, this will fetch real data based on the registry name

  return [
    {
      name: "button",
      type: "registry:ui",
      description: "A customizable button component with multiple variants and sizes.",
      files: [
        {
          path: "components/ui/button.tsx",
          type: "registry:ui",
          target: "components/ui/button.tsx",
          code: `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }`
        }
      ],
      dependencies: [
        "@radix-ui/react-slot",
        "class-variance-authority"
      ],
      registryDependencies: ["utils"],
      author: {
        name: "shadcn",
        url: "https://github.com/shadcn"
      }
    },
    {
      name: "card",
      type: "registry:ui",
      description: "A container component for displaying content in a card layout with header, content, and footer sections.",
      files: [
        {
          path: "components/ui/card.tsx",
          type: "registry:ui",
          target: "components/ui/card.tsx",
          code: `import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }`
        }
      ],
      dependencies: [],
      registryDependencies: ["utils"]
    },
    {
      name: "input",
      type: "registry:ui",
      description: "A text input component with built-in styling and accessibility features.",
      files: [
        {
          path: "components/ui/input.tsx",
          type: "registry:ui",
          target: "components/ui/input.tsx",
          code: `import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }`
        }
      ],
      dependencies: [],
      registryDependencies: ["utils"]
    },
    {
      name: "utils",
      type: "registry:lib",
      description: "Utility functions for merging Tailwind CSS classes with clsx.",
      files: [
        {
          path: "lib/utils.ts",
          type: "registry:lib",
          target: "lib/utils.ts",
          code: `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`
        }
      ],
      dependencies: [
        "clsx",
        "tailwind-merge"
      ],
      registryDependencies: []
    },
    {
      name: "use-toast",
      type: "registry:hook",
      description: "A hook for managing toast notifications with multiple variants.",
      files: [
        {
          path: "hooks/use-toast.ts",
          type: "registry:hook",
          target: "hooks/use-toast.ts",
          code: `import * as React from "react"

type ToastActionElement = React.ReactElement<any>

type ToastProps = {
  title?: string
  description?: string
  action?: ToastActionElement
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback((props: ToastProps) => {
    setToasts((prev) => [...prev, props])
  }, [])

  return { toast, toasts }
}`
        }
      ],
      dependencies: [],
      registryDependencies: []
    },
    {
      name: "login-form",
      type: "registry:block",
      description: "A complete login form with email and password fields.",
      files: [
        {
          path: "components/blocks/login-form.tsx",
          type: "registry:block",
          target: "components/blocks/login-form.tsx",
          code: `import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Password" />
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}`
        },
        {
          path: "components/blocks/login-form.css",
          type: "registry:block",
          target: "components/blocks/login-form.css",
          code: `.login-form {
  max-width: 400px;
  margin: 0 auto;
}`
        }
      ],
      dependencies: [],
      registryDependencies: ["button", "input", "card"]
    },
    {
      name: "api-utils",
      type: "registry:lib",
      description: "Utility functions for API calls and error handling.",
      files: [
        {
          path: "lib/api/utils.ts",
          type: "registry:lib",
          target: "lib/api/utils.ts",
          code: `export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('API request failed')
  }
  return response.json()
}

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    console.error('API Error:', error.message)
  }
}`
        }
      ],
      dependencies: [],
      registryDependencies: []
    }
  ]
}
