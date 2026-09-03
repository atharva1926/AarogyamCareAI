import { Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Logo } from './ui'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

export function Navbar({ onMenu }: { onMenu?: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          <a href="#home" className="hover:text-brand-700">
            Home
          </a>
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-brand-700">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:block">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/signup">
            <Button>Get Started</Button>
          </Link>
          {onMenu && (
            <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open menu" onClick={onMenu}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
