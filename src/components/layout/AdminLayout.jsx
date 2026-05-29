import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const navLinks = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Products', href: '/admin/products', icon: '🖼️' },
  { label: 'Orders', href: '/admin/orders', icon: '📦' },
  { label: 'Custom Uploads', href: '/admin/custom-uploads', icon: '🎨' },
]

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-brand-dark flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="font-display text-2xl text-brand-bg">Framed</Link>
          <p className="font-body text-xs text-brand-bg/40 mt-1 tracking-wider uppercase">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map(link => {
            const isActive = location.pathname === link.href ||
              (link.href !== '/admin' && location.pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded font-body text-sm transition-all ${
                  isActive
                    ? 'bg-brand-primary text-brand-bg'
                    : 'text-brand-bg/60 hover:text-brand-bg hover:bg-white/5'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link to="/" className="flex items-center gap-2 px-4 py-2 text-brand-bg/60 hover:text-brand-bg font-body text-sm">
            ← Back to Site
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 font-body text-sm w-full"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
