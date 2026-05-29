import { Link } from 'react-router-dom'

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=5jjv14a',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/18gTdKiWzd/',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/nisagar13/',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:nisagar13@gmail.com',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
  },
]

const categoryLinks = [
  { label: 'Anime',    href: '/products?category=anime'    },
  { label: 'Cinema',   href: '/products?category=cinema'   },
  { label: 'Cricket',  href: '/products?category=cricket'  },
  { label: 'Football', href: '/products?category=football' },
]

const quickLinks = [
  { label: 'Custom Print',              href: '/custom-upload'       },
  { label: 'My Orders',                 href: '/dashboard'           },
  { label: 'Contact Us',                href: '/contact'             },
  { label: 'FAQ',                       href: '/faq'                 },
  { label: 'Exchange & Shipping Policy',href: '/shipping-policy'     },
  { label: 'Terms & Conditions',        href: '/terms'               },
]

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-brand-bg/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand + social */}
          <div className="lg:col-span-1">
            <span className="font-display text-3xl font-medium text-brand-bg">Framed</span>
            <p className="mt-3 font-body text-sm text-brand-bg/55 leading-relaxed max-w-[220px]">
              Premium wall posters for the passionate soul. Curated prints for your space.
            </p>

            {/* Social icons */}
            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full border border-brand-bg/20 flex items-center justify-center
                             text-brand-bg/50 hover:text-brand-bg hover:border-brand-bg/50
                             transition-all duration-200 hover:scale-110"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-body text-[11px] tracking-widest uppercase text-brand-bg/35 mb-5">
              Categories
            </h4>
            <ul className="space-y-3">
              {categoryLinks.map(link => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-brand-bg/65 hover:text-brand-bg transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="sm:col-span-2 lg:col-span-2">
            <h4 className="font-body text-[11px] tracking-widest uppercase text-brand-bg/35 mb-5">
              Quick Links
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {quickLinks.map(link => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="font-body text-sm text-brand-bg/65 hover:text-brand-bg transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="mt-12 pt-6 border-t border-brand-bg/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-brand-bg/35">
            © {new Date().getFullYear()} Framed. All rights reserved.
          </p>
          <p className="font-body text-xs text-brand-bg/35">
            Made with care for poster enthusiasts.
          </p>
        </div>

      </div>
    </footer>
  )
}