import PageHeader from '../components/PageHeader'
import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, query, updateDoc, where, doc } from 'firebase/firestore'
import { useAuth } from '../services/AuthContext'
import { db } from '../services/firebase'
import { MANAGEABLE_ROLES, ROLE_LABELS, ROLES, canManageTeam } from '../constants/roles'

export default function Team() {
  const { organizationId, role: currentRole, user } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const canManage = canManageTeam(currentRole)

  const loadMembers = async () => {
    if (!organizationId || !canManage) {
      setMembers([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const q = query(
        collection(db, 'users'),
        where('organizationId', '==', organizationId)
      )
      const snapshot = await getDocs(q)
      setMembers(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => (a.email || '').localeCompare(b.email || ''))
      )
    } catch (err) {
      console.error(err)
      setError('تعذر تحميل أعضاء الفريق')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [organizationId, canManage])

  const visibleMembers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return members
    return members.filter((member) => (member.email || '').toLowerCase().includes(term))
  }, [members, search])

  const handleRoleChange = async (memberId, nextRole) => {
    setSavingId(memberId)
    setError('')

    try {
      await updateDoc(doc(db, 'users', memberId), { role: nextRole })
      setMembers((items) => items.map((member) => (
        member.id === memberId ? { ...member, role: nextRole } : member
      )))
    } catch (err) {
      console.error(err)
      setError('تعذر تحديث صلاحية العضو')
    } finally {
      setSavingId('')
    }
  }

  if (!canManage) {
    return (
      <div className="page-shell">
        <div className="card">
          <h2>الفريق والصلاحيات</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            هذه الصفحة متاحة للمالك والمدير فقط.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <PageHeader
        icon="team"
        eyebrow="Workspace Administration"
        title="الفريق والصلاحيات"
        description="إدارة أعضاء المؤسسة والأدوار والصلاحيات التشغيلية."
      />

      <div className="card" style={{ marginBottom: 16 }}>
        <input
          className="field"
          placeholder="ابحث بالبريد الإلكتروني"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
          إدارة الصلاحيات متاحة للحسابات المسجلة بالفعل في نفس المنظمة.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <div className="card loading-card">جارٍ تحميل أعضاء الفريق...</div>
      ) : visibleMembers.length === 0 ? (
        <div className="card empty-state">لا يوجد أعضاء مطابقون.</div>
      ) : (
        <div className="card">
          {visibleMembers.map((member) => {
            const isCurrentUser = member.id === user?.uid
            const isOwner = member.role === ROLES.OWNER

            return (
              <div className="team-row" key={member.id}>
                <div>
                  <strong>{member.email || 'بدون بريد'}</strong>
                  <div className="subtitle">
                    {isCurrentUser ? 'حسابك الحالي · ' : ''}
                    {ROLE_LABELS[member.role] || member.role}
                  </div>
                </div>

                <select
                  className="field team-role-select"
                  value={member.role || ROLES.SALES}
                  disabled={isCurrentUser || isOwner || savingId === member.id}
                  onChange={(event) => handleRoleChange(member.id, event.target.value)}
                >
                  <option value={ROLES.OWNER}>{ROLE_LABELS[ROLES.OWNER]}</option>
                  {MANAGEABLE_ROLES.map((role) => (
                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}

      <div className="card" style={{ marginTop: 16 }}>
        <strong>الأدوار الحالية</strong>
        <div className="role-grid">
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <div className="role-chip" key={key}>
              <span>{label}</span>
              <small>{key}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
