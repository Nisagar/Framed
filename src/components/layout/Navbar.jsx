import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useCartStore } from '../../context/cartStore'
import toast from 'react-hot-toast'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, isAdmin, signOut } = useAuth()
  const totalItems = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out successfully')
    navigate('/')
  }

  const navLinks = [
    { label: 'All Posters', href: '/products' },
    { label: 'Anime', href: '/products?category=anime' },
    { label: 'Cinema', href: '/products?category=cinema' },
    { label: 'Cricket', href: '/products?category=cricket' },
    { label: 'Football', href: '/products?category=football' },
    { label: 'Custom Print', href: '/custom-upload' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-brand-bg/95 backdrop-blur-sm border-b border-brand-border shadow-sm'
          : 'bg-brand-bg border-b border-brand-border'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl md:text-3xl font-medium text-brand-dark tracking-tight">
              Framed
            </span>
            <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-brand-primary" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="font-body text-sm text-brand-dark/70 hover:text-brand-primary transition-colors duration-200 tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Search icon */}
            <Link to="/products" className="p-2 text-brand-dark/70 hover:text-brand-primary transition-colors" aria-label="Search">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-brand-dark/70 hover:text-brand-primary transition-colors" aria-label="Cart">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-primary text-brand-bg text-[10px] font-medium rounded-full flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 text-brand-dark/70 hover:text-brand-primary transition-colors"
                  aria-label="Account"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-brand-bg border border-brand-border shadow-card-hover z-50"
                    >
                      <div className="py-1">
                        <Link to="/dashboard" className="block px-4 py-2.5 text-sm font-body text-brand-dark hover:bg-brand-cream">
                          My Account
                        </Link>
                        <Link to="/dashboard" className="block px-4 py-2.5 text-sm font-body text-brand-dark hover:bg-brand-cream">
                          Order History
                        </Link>
                        <Link to="/custom-upload" className="block px-4 py-2.5 text-sm font-body text-brand-dark hover:bg-brand-cream">
                          Custom Upload
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" className="block px-4 py-2.5 text-sm font-body text-brand-primary font-medium hover:bg-brand-cream border-t border-brand-border mt-1">
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2.5 text-sm font-body text-red-600 hover:bg-red-50 border-t border-brand-border"
                        >
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:block btn-outline text-xs py-2 px-4">
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-brand-dark"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-brand-border bg-brand-bg overflow-hidden"
          >
            <nav className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="font-body text-sm py-3 text-brand-dark border-b border-brand-border/50 last:border-0"
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="flex gap-3 pt-4">
                  <Link to="/login" className="btn-outline flex-1 text-center text-sm py-2">Sign In</Link>
                  <Link to="/signup" className="btn-primary flex-1 text-center text-sm py-2">Sign Up</Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
