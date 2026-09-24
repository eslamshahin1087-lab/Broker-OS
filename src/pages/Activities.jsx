import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { canManageOperations } from '../constants/roles'
import {
  ACTIVITY_PRIORITIES,
  ACTIVITY_STATUSES,
  ACTIVITY_TYPES,
  addActivity,
  completeActivity,
  deleteActivity,
  isActivityOverdue,
  listenToActivities,
  updateActivity,
} from '../services/activities'

const emptyForm = {
  title: '',
  description: '',
  type: 'task',
  priority: 'normal',
  dueDate: '',
}

const statusLabel = (value) => ACTIVITY_STATUSES.find((item) => item.value === value)?.label || value
const typeLabel = (value) => ACTIVITY_TYPES.find((item) => item.value === value)?.label || value
const priorityLabel = (value) => ACTIVITY_PRIORITIES.find((item) => item.value === value)?.label || value

export default function Activities() {
  const { organizationId, role, user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState('open')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const canManage = canManageOperations(role)

  useEffect(() => {
    if (!organizationId) return undefined
    const unsubscribe = listenToActivities(
      organizationId,
      (rows) => { setItems(rows); setLoading(false) },
      (err) => { console.error(err); setError('تعذر تحميل المهام والمتابعات'); setLoading(false) }
    )
    return () => unsubscribe()
  }, [organizationId])

  useEffect(() => {
    const suggestedTitle = searchParams.get('title')
    if (!suggestedTitle) return
    setForm((current) => ({
      ...current,
      title: suggestedTitle,
      priority: searchParams.get('priority') || current.priority,
      description: searchParams.get('description') || current.description,
      dueDate: searchParams.get('dueDate') || current.dueDate,
    }))
    setSearchParams({}, { replace: true })
    setNotice('تم نقل التوصية من ذكاء التشغيل إلى نموذج مهمة جديدة.')
  }, [searchParams, setSearchParams])

  const visible = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'overdue') return items.filter((item) => isActivityOverdue(item))
    if (filter === 'today') {
      const today = new Date().toISOString().slice(0, 10)
      return items.filter((item) => item.dueDate === today && item.status !== 'done' && item.status !== 'cancelled')
    }
    return items.filter((item) => !['done', 'cancelled'].includes(item.status))
  }, [items, filter])

  const stats = useMemo(() => ({
    open: items.filter((item) => !['done', 'cancelled'].includes(item.status)).length,
    overdue: items.filter((item) => isActivityOverdue(item)).length,
    today: items.filter((item) => {
      const today = new Date().toISOString().slice(0, 10)
      return item.dueDate === today && !['done', 'cancelled'].includes(item.status)
    }).length,
    done: items.filter((item) => item.status === 'done').length,
  }), [items])

  const save = async (event) => {
    event.preventDefault()
    if (!organizationId || !user?.uid || !form.title.trim()) return
    setSaving(true); setError('')
    try {
      await addActivity(organizationId, user.uid, form)
      setForm(emptyForm)
      setNotice('تم إنشاء المهمة وربطها بمركز التشغيل.')
    } catch (err) {
      console.error(err); setError('تعذر إنشاء المهمة')
    } finally { setSaving(false) }
  }

  const changeStatus = async (item, status) => {
    if (!organizationId || !user?.uid) return
    try { await updateActivity(organizationId, user.uid, item.id, { status }) }
    catch (err) { console.error(err); setError('تعذر تحديث حالة المهمة') }
  }

  const markDone = async (item) => {
    if (!organizationId || !user?.uid) return
    try { await completeActivity(organizationId, user.uid, item.id) }
    catch (err) { console.error(err); setError('تعذر إغلاق المهمة') }
  }

  const remove = async (item) => {
    if (!canManage && item.createdBy !== user?.uid) return
    if (!confirm('حذف هذه المهمة؟')) return
    try { await deleteActivity(organizationId, user.uid, item.id) }
    catch (err) { console.error(err); setError('تعذر حذف المهمة') }
  }

  return (
    <div className='page-shell'>
      <section className='hero'>
        <div>
          <span className='eyebrow'>Activity Center</span>
          <h1>المهام والمتابعات</h1>
          <p>مركز واحد للمكالمات والمتابعات والاجتماعات والمهام المرتبطة بدورة العميل.</p>
        </div>
        <div className='hero-actions'>
          <select className='status-select' value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value='open'>المفتوحة</option>
            <option value='today'>اليوم</option>
            <option value='overdue'>المتأخرة</option>
            <option value='all'>الكل</option>
          </select>
        </div>
      </section>

      {error && <div className='alert'>{error}</div>}
      {notice && <div className='activity-notice'>{notice}</div>}

      <section className='stat-grid activity-stats'>
        <Metric label='مفتوحة' value={stats.open} />
        <Metric label='متأخرة' value={stats.overdue} />
        <Metric label='اليوم' value={stats.today} />
        <Metric label='مكتملة' value={stats.done} />
      </section>

      <section className='dashboard-grid'>
        <form className='card activity-form' onSubmit={save}>
          <div className='section-head'><div><span className='eyebrow'>New Activity</span><h2>مهمة جديدة</h2></div></div>
          <input className='field' placeholder='عنوان المهمة *' value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <textarea className='field' rows={4} placeholder='تفاصيل أو ملاحظات' value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <div className='commercial-form-grid'>
            <select className='field' value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              {ACTIVITY_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <select className='field' value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              {ACTIVITY_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <input type='date' className='field' value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
          </div>
          <button className='btn btn-primary btn-block' disabled={saving} type='submit'>{saving ? '...جارٍ الحفظ' : '+ إضافة المتابعة'}</button>
        </form>

        <section className='card'>
          <div className='section-head'><div><span className='eyebrow'>My Queue</span><h2>قائمة التشغيل</h2></div><span className='mini-kpi'>{visible.length}</span></div>
          {loading ? <div className='loading-card'>جارٍ تحميل المهام...</div> : visible.length === 0 ? <div className='empty-state'>لا توجد مهام في العرض الحالي.</div> : (
            <div className='activity-list'>
              {visible.map((item) => {
                const overdue = isActivityOverdue(item)
                return (
                  <article className={'activity-row' + (overdue ? ' overdue' : '')} key={item.id}>
                    <div className='activity-main'>
                      <div className='activity-title-row'><strong>{item.title}</strong><span className={'activity-priority priority-' + item.priority}>{priorityLabel(item.priority)}</span></div>
                      <p>{item.description || 'بدون تفاصيل إضافية.'}</p>
                      <div className='activity-meta'>
                        <span>{typeLabel(item.type)}</span>
                        <span>{item.dueDate ? 'استحقاق: ' + item.dueDate : 'بدون موعد'}</span>
                        <span>{statusLabel(item.status)}</span>
                      </div>
                    </div>
                    <div className='activity-actions'>
                      {item.status !== 'done' && item.status !== 'cancelled' && <button type='button' className='btn btn-primary' onClick={() => markDone(item)}>إتمام</button>}
                      {item.status !== 'done' && item.status !== 'cancelled' && (
                        <select className='status-select' value={item.status} onChange={(event) => changeStatus(item, event.target.value)}>
                          {ACTIVITY_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                        </select>
                      )}
                      {(canManage || item.createdBy === user?.uid) && <button type='button' className='btn-danger-outline' onClick={() => remove(item)}>حذف</button>}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </section>
    </div>
  )
}

function Metric({ label, value }) {
  return <div className='stat-card activity-stat'><div className='stat-label'>{label}</div><div className='stat-value'>{value}</div><div className='stat-hint'>Activity Center</div></div>
}