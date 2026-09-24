import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const AuthContext = createContext(null)

async function ensureProfile(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    const data = snap.data()
    if (data.organizationId && data.role) return data

    const patch = {
      organizationId: data.organizationId || firebaseUser.uid,
      role: data.role || 'owner',
      updatedAt: serverTimestamp(),
    }
    await setDoc(ref, patch, { merge: true })
    return { ...data, ...patch }
  }

  const profileData = {
    email: firebaseUser.email || '',
    organizationId: firebaseUser.uid,
    role: 'owner',
    createdAt: serverTimestamp(),
  }
  await setDoc(ref, profileData)
  return profileData
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [platformAdmin, setPlatformAdmin] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (!firebaseUser) {
        setProfile(null)
        setPlatformAdmin(false)
        setLoading(false)
        return
      }

      try {
        const profileData = await ensureProfile(firebaseUser)
        setProfile(profileData)
        const platformAdminSnap = await getDoc(doc(db, 'platformAdmins', firebaseUser.uid))
        setPlatformAdmin(platformAdminSnap.exists() && platformAdminSnap.data()?.enabled === true)
      } catch (err) {
        console.error('تعذر تحميل/إنشاء ملف تعريف المستخدم', err)
        setProfile(null)
        setPlatformAdmin(false)
      } finally {
        setLoading(false)
      }
    })

    return unsub
  }, [])

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password)
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        organizationId: profile?.organizationId ?? null,
        role: profile?.role ?? null,
        platformAdmin,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
