import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from './firebase'

const AuthContext = createContext(null)

async function ensureProfile(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    const data = snap.data()

    if (data.organizationId && data.role) {
      return data
    }

    const patch = {
      organizationId: data.organizationId || firebaseUser.uid,
      ownerId: data.ownerId || firebaseUser.uid,
      role: data.role || 'owner',
      displayName: data.displayName || firebaseUser.displayName || '',
      updatedAt: serverTimestamp(),
    }

    try {
      await setDoc(ref, patch, { merge: true })
      return { ...data, ...patch }
    } catch (error) {
      console.error('تعذر إصلاح ملف المستخدم القديم', error)
      return data
    }
  }

  const profileData = {
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    organizationId: firebaseUser.uid,
    ownerId: firebaseUser.uid,
    role: 'owner',
    status: 'active',
    profileCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (!firebaseUser) {
        setProfile(null)
        setPlatformAdmin(false)
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        const profileData = await ensureProfile(firebaseUser)
        setProfile(profileData)

        const platformAdminSnap = await getDoc(
          doc(db, 'platformAdmins', firebaseUser.uid)
        )

        setPlatformAdmin(
          platformAdminSnap.exists() &&
          platformAdminSnap.data()?.enabled === true
        )
      } catch (error) {
        console.error('تعذر تحميل/إنشاء ملف تعريف المستخدم', error)
        setProfile(null)
        setPlatformAdmin(false)
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email.trim(), password)

  const register = async (registration) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      registration.email.trim(),
      registration.password
    )

    const displayName = registration.fullName.trim()

    try {
      if (displayName) {
        await updateProfile(credential.user, { displayName })
      }

      const userRef = doc(db, 'users', credential.user.uid)
      const organizationRef = doc(db, 'organizations', credential.user.uid)

      const profileData = {
        email: credential.user.email || '',
        displayName,
        phone: registration.phone.trim(),
        jobTitle: registration.jobTitle.trim(),
        brokerageName: registration.brokerageName.trim(),
        brokerageType: registration.brokerageType,
        city: registration.city.trim(),
        address: registration.address.trim(),
        whatsapp: registration.whatsapp.trim(),
        website: registration.website.trim(),
        licenseNumber: registration.licenseNumber.trim(),
        yearsInBusiness: Number(registration.yearsInBusiness) || 0,
        teamSize: registration.teamSize,
        specializations: registration.specializations || [],
        organizationId: credential.user.uid,
        ownerId: credential.user.uid,
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
        ownerUserId: credential.user.uid,
        plan: 'free',
        status: 'active',
        industry: 'insurance-brokerage',
        city: registration.city.trim(),
        address: registration.address.trim(),
        website: registration.website.trim(),
        licenseNumber: registration.licenseNumber.trim(),
        brokerageType: registration.brokerageType,
        yearsInBusiness: Number(registration.yearsInBusiness) || 0,
        teamSize: registration.teamSize,
        specializations: registration.specializations || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const batch = writeBatch(db)
      batch.set(userRef, profileData, { merge: true })
      batch.set(organizationRef, organizationData, { merge: true })
      await batch.commit()

      setProfile(profileData)
      return credential
    } catch (error) {
      console.error('فشل تجهيز حساب Broker OS بعد إنشاء Firebase Auth', error)

      try {
        await deleteUser(credential.user)
      } catch (cleanupError) {
        console.error('تعذر حذف حساب Auth غير المكتمل', cleanupError)
        try {
          await signOut(auth)
        } catch (signOutError) {
          console.error('تعذر تسجيل الخروج بعد فشل التسجيل', signOutError)
        }
      }

      throw error
    }
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
