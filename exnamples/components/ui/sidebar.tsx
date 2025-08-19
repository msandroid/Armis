"use client"

import * as React from "react"
import { PanelLeft } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | undefined>(undefined)

function useSidebar() {
  const context = React.useContext(SidebarContext)

  if (!context) {
    throw new Error("useSidebar must be used within a <Sidebar />")
  }

  return context
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

function Sidebar({ children, className, ...props }: SidebarProps) {
  const [open, setOpen] = React.useState(false)
  const [openMobile, setOpenMobile] = React.useState(false)
  const isMobile = useMobile()

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        setOpenMobile(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(!openMobile)
    } else {
      setOpen(!open)
    }
  }

  return (
    <SidebarContext.Provider
      value={{
        state: open ? "expanded" : "collapsed",
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

function SidebarTrigger({ className, ...props }: SidebarTriggerProps) {
  const { isMobile, openMobile, setOpenMobile, open, setOpen } = useSidebar()

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("md:hidden", className)}
            {...props}
          >
            <PanelLeft className="h-4 w-4" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SheetTrigger>
      </Sheet>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("hidden md:inline-flex", className)}
      onClick={() => setOpen(!open)}
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  )
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarContent({ className, children, ...props }: SidebarContentProps) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar()

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="w-80 p-0">
          <ScrollArea className="h-full">
            <div className="p-6">{children}</div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className={cn(
        "hidden md:flex md:flex-col md:inset-y-0 md:z-50 md:flex md:w-80 md:flex-col",
        className
      )}
      {...props}
    >
      <ScrollArea className="h-full">
        <div className="p-6">{children}</div>
      </ScrollArea>
    </div>
  )
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarHeader({ className, children, ...props }: SidebarHeaderProps) {
  return (
    <div
      className={cn("flex h-[60px] items-center px-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

function SidebarTitle({ className, ...props }: SidebarTitleProps) {
  return (
    <h2
      className={cn(
        "flex items-center gap-2 text-lg font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

interface SidebarDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function SidebarDescription({ className, ...props }: SidebarDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {}

function SidebarNav({ className, children, ...props }: SidebarNavProps) {
  return (
    <nav
      className={cn("flex flex-1 flex-col gap-2", className)}
      {...props}
    >
      {children}
    </nav>
  )
}

interface SidebarNavItemProps extends React.HTMLAttributes<HTMLLIElement> {}

function SidebarNavItem({ className, children, ...props }: SidebarNavItemProps) {
  return (
    <li
      className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium", className)}
      {...props}
    >
      {children}
    </li>
  )
}

interface SidebarNavLinkProps extends React.HTMLAttributes<HTMLAnchorElement> {
  href: string
  active?: boolean
}

function SidebarNavLink({ className, active, ...props }: SidebarNavLinkProps) {
  return (
    <a
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarFooter({ className, children, ...props }: SidebarFooterProps) {
  return (
    <div
      className={cn("flex h-[60px] items-center px-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarSearchProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarSearch({ className, children, ...props }: SidebarSearchProps) {
  return (
    <div
      className={cn("flex items-center gap-2 px-3 py-2", className)}
      {...props}
    >
      <Input
        type="search"
        placeholder="Search..."
        className="h-8 w-full"
      />
      {children}
    </div>
  )
}

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

function SidebarGroup({ className, children, ...props }: SidebarGroupProps) {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLLabelElement> {}

function SidebarGroupLabel({ className, children, ...props }: SidebarGroupLabelProps) {
  return (
    <Label
      className={cn("px-2 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    >
      {children}
    </Label>
  )
}

export {
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarTitle,
  SidebarDescription,
  SidebarNav,
  SidebarNavItem,
  SidebarNavLink,
  SidebarFooter,
  SidebarSearch,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
}
