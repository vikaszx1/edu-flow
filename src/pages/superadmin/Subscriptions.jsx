import { Check, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { subscriptionPlans } from '../../data/mockData'
import useStore from '../../store/useStore'
import { supabase } from '../../lib/supabase'

const tierVariant = { Pro: 'purple', Basic: 'blue', Enterprise: 'amber' }

function ManagePlanModal({ plan, onClose, onSave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="rounded-[14px] border w-full max-w-[420px]" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--bdr)' }}>
          <div className="font-syne text-[15px] font-semibold">Manage {plan.name} Plan</div>
          <button onClick={onClose} style={{ color: 'var(--lgt)' }}><X size={16} /></button>
        </div>
        <div className="p-5">
          <div className="rounded-[9px] p-4 mb-4" style={{ background: plan.color }}>
            <div className="font-syne text-2xl font-bold" style={{ color: plan.textColor }}>{plan.price}</div>
            <div className="text-[12px] mt-1" style={{ color: plan.textColor }}>{plan.schools} schools on this plan</div>
          </div>
          <div className="flex flex-col gap-2 mb-4">
            {plan.features.map(f => (
              <div key={f} className="flex items-center gap-2 text-[12px]">
                <Check size={13} style={{ color: 'var(--teal)', flexShrink: 0 }} /> {f}
              </div>
            ))}
          </div>
          <div className="rounded-[9px] px-3 py-2 text-[12px] border" style={{ background: '#e6f1fb', borderColor: '#b3d4f5', color: '#185fa5' }}>
            To change pricing or features, update your Supabase billing config.
          </div>
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--bdr)' }}>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={onSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}

export default function Subscriptions() {
  const [activePlan,  setActivePlan]  = useState(null)
  const [schools,     setSchools]     = useState([])
  const toast       = useStore(s => s.toast)
  const showConfirm = useStore(s => s.showConfirm)

  useEffect(() => {
    supabase.from('schools').select('id, name, city, is_active').order('name')
      .then(({ data }) => setSchools((data ?? []).map(s => ({
        ...s, tier: 'Basic', status: s.is_active ? 'Active' : 'Inactive', students: 0,
      }))))
  }, [])

  const expiring = []  // no expiry data in DB yet
  const mrr = '—'

  const handleRenew = async (school) => {
    const ok = await showConfirm({
      title: 'Renew Subscription',
      message: `Renew ${school.name}'s ${school.tier} plan? An invoice will be generated.`,
      variant: 'info',
      confirmLabel: 'Renew',
    })
    if (ok) toast('success', `${school.name} subscription renewed`)
  }

  return (
    <div>
      {activePlan && (
        <ManagePlanModal
          plan={activePlan}
          onClose={() => setActivePlan(null)}
          onSave={() => { toast('success', `${activePlan.name} plan updated`); setActivePlan(null) }}
        />
      )}
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-[18px]">
        <StatCard label="Monthly Revenue"  value={mrr}    upText="↑ 8%"    sub="vs last month" />
        <StatCard label="Pro Schools"      value="17"     upText="₹5,999/mo" sub="per school"  />
        <StatCard label="Basic Schools"    value="28"     upText="₹2,999/mo" sub="per school"  />
        <StatCard label="Expiring Soon"    value={String(expiring.length)} downText={expiring.length > 0 ? 'Action needed' : ''} sub="within 30 days" />
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-[18px]">
        {subscriptionPlans.map(plan => (
          <div
            key={plan.id}
            className="rounded-[11px] border p-5 flex flex-col"
            style={{ background: plan.color, borderColor: 'var(--bdr)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-syne text-[15px] font-semibold" style={{ color: plan.textColor }}>{plan.name}</span>
              <Badge variant={tierVariant[plan.name] || 'blue'}>{plan.schools} schools</Badge>
            </div>
            <div className="font-syne text-2xl font-bold mb-4" style={{ color: plan.textColor }}>{plan.price}</div>
            <ul className="flex flex-col gap-2 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-[12px]" style={{ color: plan.textColor }}>
                  <Check size={13} style={{ color: plan.textColor, flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setActivePlan(plan)}
              className="mt-5 w-full py-2 rounded-[7px] text-[12px] font-medium border"
              style={{ borderColor: plan.textColor, color: plan.textColor, background: 'transparent' }}
            >
              Manage Plan
            </button>
          </div>
        ))}
      </div>

      {/* Expiring schools */}
      {expiring.length > 0 && (
        <Card>
          <CardHeader title="Expiring Subscriptions" />
          <CardBody className="py-2.5 px-3.5">
            {expiring.map(s => (
              <div key={s.id} className="flex items-center gap-3 py-[10px] border-b last:border-b-0" style={{ borderColor: 'var(--bdr)' }}>
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{s.name}</div>
                  <div className="text-[11px]" style={{ color: 'var(--mut)' }}>{s.city} · {s.students.toLocaleString()} students · since {s.since}</div>
                </div>
                <Badge variant={tierVariant[s.tier] || 'blue'}>{s.tier}</Badge>
                <Badge variant="amber">Expiring</Badge>
                <button
                  onClick={() => handleRenew(s)}
                  className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-white"
                  style={{ background: 'var(--pri)' }}
                >
                  Renew
                </button>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* All school billing table */}
      <Card>
        <CardHeader title="Billing Overview" />
        <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['School', 'City', 'Plan', 'Monthly Fee', 'Students', 'Status'].map(h => (
                <th key={h} className="text-[10px] uppercase tracking-[0.5px] font-medium text-left px-3 pb-2 pt-3 border-b"
                  style={{ color: 'var(--mut)', borderColor: 'var(--bdr)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schools.map(s => {
              const plan = subscriptionPlans.find(p => p.name === s.tier)
              return (
                <tr key={s.id} className="border-b last:border-b-0 hover:bg-[#FAFAF8]" style={{ borderColor: 'var(--bdr)' }}>
                  <td className="px-3 py-[10px] text-[13px] font-medium max-w-[200px] truncate">{s.name}</td>
                  <td className="px-3 py-[10px] text-[12px]" style={{ color: 'var(--mut)' }}>{s.city}</td>
                  <td className="px-3 py-[10px]"><Badge variant={tierVariant[s.tier] || 'blue'}>{s.tier}</Badge></td>
                  <td className="px-3 py-[10px] text-[12px] font-medium">{plan?.price ?? '—'}</td>
                  <td className="px-3 py-[10px] text-[12px]">{s.students.toLocaleString()}</td>
                  <td className="px-3 py-[10px]">
                    <Badge variant={s.status === 'Active' ? 'green' : 'amber'}>{s.status}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  )
}
