"use client"

import * as React from "react"
import { useState } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { setTargetRole } from "@/app/actions/profile"
import { toast } from "sonner"

export function TargetRoleSelector({ currentRole, availableRoles }: { currentRole?: string, availableRoles: string[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleSelect = async (role: string) => {
    if (role === currentRole) {
       setOpen(false)
       return
    }
    
    setIsPending(true)
    try {
      await setTargetRole(role)
      toast.success("Target role updated successfully")
      setOpen(false)
    } catch (e: any) {
      toast.error(e.message || "Failed to update target role")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isPending}
          className="w-[280px] justify-between shadow-sm"
        >
          {isPending ? (
            <span className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</span>
          ) : currentRole ? (
            currentRole
          ) : (
            <span className="text-muted-foreground">Select a target role...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="end">
        <Command>
          <CommandInput placeholder="Search roles..." />
          <CommandList>
            <CommandEmpty>No role found.</CommandEmpty>
            <CommandGroup>
              {availableRoles.map((role) => (
                <CommandItem
                  key={role}
                  value={role}
                  onSelect={(currentValue) => {
                    handleSelect(role)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentRole === role ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {role}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
