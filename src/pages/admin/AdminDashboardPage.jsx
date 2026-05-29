import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui'

function StatCard({ label, value, icon, href, color = 'bg-brand-cream' }) {
  return (
    <Link to={href || '#'} className={`${color} border border-brand-border p-6 block hover:shadow-card-hover transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="font-display text-4xl font-medium text-brand-dark">{value}</p>
      <p className="font-body text-sm text-brand-muted mt-1">{label}</p>
    </Link>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0, users: 0, uploads: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const [
        { count: products },
        { count: orders },
        { count: uploads },
        { data: revenue },
        { data: recent },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('custom_poster_uploads').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
        supabase.from('orders')
          .select('id, status, total_amount, created_at, payment_status')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const totalRevenue = revenue?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
      setStats({ products, orders, uploads, revenue: totalRevenue })
      setRecentOrders(recent || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-brand-dark">Dashboard</h1>
        <p className="font-body text-sm text-brand-muted mt-1">Welcome back, Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Products" value={stats.products || 0} icon="🖼️" href="/admin/products" />
        <StatCard label="Total Orders" value={stats.orders || 0} icon="📦" href="/admin/orders" />
        <StatCard label="Custom Uploads" value={stats.uploads || 0} icon="🎨" href="/admin/custom-uploads" />
        <StatCard
          label="Total Revenue"
          value={`₹${(stats.revenue || 0).toLocaleString('en-IN')}`}
          icon="💰"
          color="bg-brand-primary/10"
        />
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-brand-dark">Recent Orders</h2>
          <Link to="/admin/orders" className="font-body text-sm text-brand-primary hover:underline">
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="font-body text-sm text-brand-muted py-8 text-center">No orders yet</p>
        ) : (
          <div className="bg-white border border-brand-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-border bg-brand-cream">
                  {['Order ID', 'Date', 'Amount', 'Status', 'Payment'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-brand-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-brand-cream/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-brand-dark">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-brand-muted">
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-body text-sm text-brand-dark font-medium">
                      ₹{order.total_amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs font-body rounded-sm ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'confirmed' ? 'bg-indigo-100 text-indigo-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs font-body rounded-sm ${
                        order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
