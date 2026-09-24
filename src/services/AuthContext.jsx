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

// بينشئ مستند users/{uid} لو مش موجود (broker مستقل بمنظمته الخاصة)
async function ensureProfile(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return snap.data()

  const profileData = {
    email: firebaseUser.email,
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const profileData = await ensureProfile(u)
          setProfile(profileData)
        } catch (err) {
          console.error('تعذر تحميل/إنشاء ملف تعريف المستخدم', err)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
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
