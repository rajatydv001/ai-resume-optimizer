"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/upload", label: "Upload" },
  { href: "/resumes", label: "History" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="page-container flex h-12 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-accent-blue text-[10px] font-bold text-white">
            O
          </span>
          <span className="text-muted-foreground/80">Optimizer</span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-150",
                pathname === link.href
                  ? "bg-muted/60 text-foreground"
                  : "text-muted-foreground/70 hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
