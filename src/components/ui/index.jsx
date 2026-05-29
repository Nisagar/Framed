// Reusable UI primitives

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} border-2 border-brand-primary border-t-transparent rounded-full animate-spin`} />
  )
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="font-display text-2xl text-brand-dark mb-2">{title}</h3>
      {subtitle && <p className="font-body text-sm text-brand-muted max-w-xs">{subtitle}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-brand-cream text-brand-dark',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-body font-medium tracking-wide ${variants[variant]}`}>
      {children}
    </span>
  )
}

export function Divider({ label }) {
  return (
    <div className="relative flex items-center py-2">
      <div className="flex-1 border-t border-brand-border" />
      {label && (
        <span className="flex-shrink-0 mx-4 font-body text-xs text-brand-muted uppercase tracking-wider">{label}</span>
      )}
      <div className="flex-1 border-t border-brand-border" />
    </div>
  )
}

export function PageHeader({ title, subtitle, breadcrumb }) {
  return (
    <div className="bg-brand-cream border-b border-brand-border py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {breadcrumb && (
          <p className="font-body text-xs text-brand-muted tracking-widest uppercase mb-3">{breadcrumb}</p>
        )}
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="mt-3 font-body text-sm text-brand-muted">{subtitle}</p>}
      </div>
    </div>
  )
}
