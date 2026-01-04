"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CryptoOption {
  id: string
  symbol: string
  name: string
}

interface CryptoSearchProps {
  value: string
  onChange: (symbol: string) => void
  onSelect: (option: CryptoOption) => void
  placeholder?: string
  label?: string
}

export function CryptoSearch({
  value,
  onChange,
  onSelect,
  placeholder = "Search crypto (e.g., Bitcoin, BTC, SOL...)",
  label = "Search Crypto",
}: CryptoSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<CryptoOption[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<CryptoOption | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Search for coins
  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    setIsOpen(true)

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/crypto/search?q=${encodeURIComponent(searchQuery)}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setResults(data)
        }
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = null
      }
    }
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (option: CryptoOption) => {
    setSelectedOption(option)
    setSearchQuery(`${option.name} (${option.symbol})`)
    onChange(option.symbol)
    onSelect(option)
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchQuery(newValue)
    onChange("")
    setSelectedOption(null)
  }

  return (
    <div className="grid gap-2 relative" ref={containerRef}>
      <Label htmlFor="crypto-search">{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="crypto-search"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
        {isOpen && (results.length > 0 || loading) && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Searching...
              </div>
            ) : (
              results.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground flex items-center justify-between",
                    selectedOption?.id === option.id && "bg-accent"
                  )}
                >
                  <div>
                    <div className="font-medium">{option.name}</div>
                    <div className="text-xs text-muted-foreground">{option.symbol}</div>
                  </div>
                  {selectedOption?.id === option.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {selectedOption && (
        <p className="text-xs text-green-600 dark:text-green-400">
          ✓ Selected: {selectedOption.name} ({selectedOption.symbol})
        </p>
      )}
    </div>
  )
}

