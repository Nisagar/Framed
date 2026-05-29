import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PageHeader, Badge, Spinner } from '../components/ui'
import toast from 'react-hot-toast'

const STATUS_VARIANTS = {
  pending_payment: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'success',
  delivered: 'success',
  cancelled: 'error',
  payment_failed: 'error',
}

export default function DashboardPage() {
  const { user, profile, updateProfile } = useAuth()
  const [orders, setOrders] = useState([])
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('orders')

  useEffect(() => {
    fetchData()
  }, [user])

  async function fetchData() {
    if (!user) return
    setLoading(true)
    try {
      const [{ data: ords }, { data: ups }] = await Promise.all([
        supabase
          .from('orders')
          .select('*, items:order_items(id, quantity, size, price, product:products(title, slug))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('custom_poster_uploads')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])
      setOrders(ords || [])
      setUploads(ups || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await updateProfile(profileForm)
    setSaving(false)
    if (error) toast.error(error.message)
    else {
      toast.success('Profile updated!')
      setEditMode(false)
    }
  }

  return (
    <div className="pt-16 md:pt-20">
      <PageHeader title="My Account" breadcrumb="Dashboard" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-brand-cream border border-brand-border p-5">
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-14 h-14 rounded-full bg-brand-primary flex items-center justify-center mb-3">
                  <span className="font-display text-2xl text-brand-bg">
                    {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <p className="font-body text-sm font-medium text-brand-dark">{profile?.full_name || 'Welcome!'}</p>
                <p className="font-body text-xs text-brand-muted">{user?.email}</p>
              </div>

              <nav className="space-y-1">
                {[
                  { id: 'orders', label: 'Order History' },
                  { id: 'uploads', label: 'Custom Uploads' },
                  { id: 'profile', label: 'Profile' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2.5 font-body text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'bg-brand-primary text-brand-bg'
                        : 'text-brand-dark hover:bg-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : (
              <>
                {/* Orders */}
                {activeTab === 'orders' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="font-display text-2xl text-brand-dark mb-5">Order History</h2>
                    {orders.length === 0 ? (
                      <div className="text-center py-12 bg-brand-cream border border-brand-border">
                        <p className="font-display text-xl text-brand-dark mb-2">No orders yet</p>
                        <p className="font-body text-sm text-brand-muted mb-4">Start shopping to see your orders here</p>
                        <Link to="/products" className="btn-primary inline-block">Browse Posters</Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map(order => (
                          <div key={order.id} className="bg-white border border-brand-border p-4 md:p-5">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <p className="font-mono text-xs text-brand-muted">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </p>
                                <p className="font-body text-xs text-brand-muted">
                                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant={STATUS_VARIANTS[order.status] || 'default'}>
                                  {order.status?.replace(/_/g, ' ')}
                                </Badge>
                                <span className="font-display text-lg text-brand-dark">
                                  ₹{order.total_amount?.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>

                            <div className="text-xs font-body text-brand-muted">
                              {order.items?.slice(0, 2).map(item => (
                                <span key={item.id} className="mr-2">
                                  {item.product?.title} ({item.size} × {item.quantity})
                                </span>
                              ))}
                              {order.items?.length > 2 && `+${order.items.length - 2} more`}
                            </div>

                            <Link
                              to={`/dashboard/orders/${order.id}`}
                              className="mt-3 inline-block font-body text-xs text-brand-primary hover:underline"
                            >
                              View Details →
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Custom Uploads */}
                {activeTab === 'uploads' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-display text-2xl text-brand-dark">Custom Uploads</h2>
                      <Link to="/custom-upload" className="btn-primary text-sm py-2">New Upload</Link>
                    </div>
                    {uploads.length === 0 ? (
                      <div className="text-center py-12 bg-brand-cream border border-brand-border">
                        <p className="font-display text-xl text-brand-dark mb-2">No uploads yet</p>
                        <Link to="/custom-upload" className="btn-primary inline-block mt-2">Upload Image</Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {uploads.map(upload => (
                          <div key={upload.id} className="border border-brand-border bg-white overflow-hidden">
                            {upload.image_url && (
                              <img src={upload.image_url} alt="Custom upload" className="w-full aspect-[3/4] object-cover" />
                            )}
                            <div className="p-3">
                              <div className="flex items-center justify-between">
                                <Badge variant={STATUS_VARIANTS[upload.status] || 'default'}>
                                  {upload.status || 'pending'}
                                </Badge>
                                <span className="font-body text-xs text-brand-muted">{upload.size}</span>
                              </div>
                              {upload.notes && (
                                <p className="font-body text-xs text-brand-muted mt-2 line-clamp-2">{upload.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Profile */}
                {activeTab === 'profile' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-display text-2xl text-brand-dark">Profile</h2>
                      {!editMode && (
                        <button onClick={() => setEditMode(true)} className="btn-outline text-sm py-2">
                          Edit
                        </button>
                      )}
                    </div>

                    {editMode ? (
                      <form onSubmit={handleSaveProfile} className="space-y-4 max-w-sm">
                        <div>
                          <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profileForm.full_name}
                            onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                            className="input-field"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button type="button" onClick={() => setEditMode(false)} className="btn-ghost">
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4 max-w-sm">
                        {[
                          { label: 'Full Name', value: profile?.full_name || '—' },
                          { label: 'Email', value: user?.email },
                          { label: 'Phone', value: profile?.phone || '—' },
                          { label: 'Member Since', value: new Date(user?.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) },
                        ].map(field => (
                          <div key={field.label} className="border-b border-brand-border pb-3">
                            <p className="font-body text-xs text-brand-muted uppercase tracking-wider mb-1">{field.label}</p>
                            <p className="font-body text-sm text-brand-dark">{field.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
