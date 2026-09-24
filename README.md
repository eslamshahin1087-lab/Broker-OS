# Broker OS — Step 1 (MVP Scaffold)

هذا أول إصدار من هيكل المشروع: React + Vite + Firebase (Auth + Firestore + Hosting)، مع أول شاشتين فعليتين: **Login** و **Home (Dashboard)**، وباقي شاشات الـ Bottom Nav كـ placeholders جاهزة للبناء عليها.

## الخطوات اللي محتاج تعملها إنت (تحتاج حسابك الشخصي)

### 1. GitHub Repository
1. روح على github.com وسجّل دخول.
2. اعمل New Repository باسم `broker-os` (خليه Private في البداية).
3. من جهازك، بعد ما تفك ضغط الملفات دي:
   ```bash
   cd broker-os
   git init
   git add .
   git commit -m "Initial scaffold: auth + dashboard shell"
   git branch -M main
   git remote add origin https://github.com/<username>/broker-os.git
   git push -u origin main
   ```

### 2. Firebase Project
1. روح على console.firebase.google.com.
2. Add project → اسمه مثلاً `broker-os`.
3. من داخل المشروع: Build → Authentication → Get started → فعّل **Email/Password**.
4. Build → Firestore Database → Create database → ابدأ في **test mode** مؤقتًا (هنرفعله بعد كده بالـ rules اللي في `firestore.rules`).
5. Project settings (⚙️) → Your apps → Add app → Web (</>) → هياديك بيانات الـ config.
6. انسخ الملف `.env.example` باسم `.env` واملأ فيه القيم من الخطوة اللي فاتت.

### 3. تشغيل المشروع محليًا
```bash
npm install
npm run dev
```
هيفتحلك على `http://localhost:5173`.

### 4. النشر (Free — Firebase Hosting)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # اختار المشروع اللي عملته، ولو سألك عن الملفات اختار "no" عشان firebase.json موجود بالفعل
npm run deploy
```

## هيكل المشروع
```
src/
  layouts/MainLayout.jsx     ← Bottom Navigation (Home, Clients, Opportunities, Policies, Finance, More)
  pages/                     ← كل شاشة رئيسية (Home جاهزة، الباقي placeholder)
  services/firebase.js       ← تهيئة Firebase
  services/AuthContext.jsx   ← إدارة تسجيل الدخول في كل التطبيق
  components/RequireAuth.jsx ← حماية الصفحات من غير تسجيل دخول
firestore.rules              ← صلاحيات قاعدة البيانات (Multi-tenant بـ organizationId)
```

## الخطوة الجاية
بعد ما تعمل الـ push والـ Firebase project، أقترح نبدأ بـ:
- **Clients module**: نموذج بيانات Firestore + شاشة إضافة/عرض عميل (Client 360°)
- أو **Leads Pipeline**: نفس الفكرة بس للـ leads

قولّي أنهي واحدة تحب تبدأ بيها وهكمل معاك خطوة بخطوة.
