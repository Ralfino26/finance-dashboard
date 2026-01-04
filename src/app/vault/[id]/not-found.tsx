import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <h2 className="text-2xl font-bold">Vault Not Found</h2>
      <p className="text-muted-foreground">
        The vault you're looking for doesn't exist.
      </p>
      <Button asChild>
        <Link href="/">Go back to Overview</Link>
      </Button>
    </div>
  )
}

