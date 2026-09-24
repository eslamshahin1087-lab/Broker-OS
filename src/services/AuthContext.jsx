import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
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
      displayName: data.displayName || firebaseUser.displayName || '',
      updatedAt: serverTimestamp(),
    }
    await setDoc(ref, patch, { merge: true })
    return { ...data, ...patch }
  }

  const profileData = {
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    organizationId: firebaseUser.uid,
    role: 'owner',
    status: 'active',
    profileCompleted: false,
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

  const register = async (registration) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      registration.email.trim(),
      registration.password
    )

    const displayName = registration.fullName.trim()
    const userRef = doc(db, 'users', credential.user.uid)
    const organizationRef = doc(db, 'organizations', credential.user.uid)

    if (displayName) {
      await updateProfile(credential.user, { displayName })
    }

    const profileData = {
      email: credential.user.email || '',
      displayName,
      phone: registration.phone.trim(),
      jobTitle: registration.jobTitle.trim(),
      brokerageName: registration.brokerageName.trim(),
      brokerageType: registration.brokerageType,
      city: registration.city.trim(),
      licenseNumber: registration.licenseNumber.trim(),
      organizationId: credential.user.uid,
      role: 'owner',
      status: 'active',
      profileCompleted: true,
      onboardingStage: 'completed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const organizationData = {
      organizationId: credential.user.uid,
      name: registration.brokerageName.trim() || displayName,
      ownerId: credential.user.uid,
      plan: 'free',
      status: 'active',
      industry: 'insurance-brokerage',
      city: registration.city.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(userRef, profileData, { merge: true })
    await setDoc(organizationRef, organizationData, { merge: true })

    setProfile(profileData)
    return credential
  }

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
