# 📦 حزمة تسليم منصة إتزان | ETIZAN
## المالك: ytrytrytr098@gmail.com
## تاريخ التسليم: 18 مايو 2025

---

## 🎯 نظرة عامة

منصة إتزان هي متجر إلكتروني متكامل لبيع المنتجات الرقمية (كتب، كورسات، قوالب) مخصص للسوق العراقي والعربي، مع نظام دفع محلي (زين كاش، آسيا حوالة، مصرف الطيف).

---

## 🔑 بيانات الوصول الحالية

### Supabase (قاعدة البيانات)
```
Project URL: https://gufeacwtjliyrqoislbu.supabase.co
Project ID: gufeacwtjliyrqoislbu
Anon Key: sb_publishable_f1CMmdGCCKNxUwedH4CyNQ_NMVD9z-b
Service Role: sb_secret_sxG6v0RZsm0NIAbKrEQpWw_pksUu6fb
```

**للوصول:**
1. اذهب إلى https://supabase.com
2. سجل دخول بـ ytrytrytr098@gmail.com
3. اطلب مني إضافتك كـ Owner (سأرسل دعوة)

### Vercel (الاستضافة)
```
Project: etizan
Framework: Vite
```

**للوصول:**
1. اذهب إلى https://vercel.com
2. سجل دخول بـ ytrytrytr098@gmail.com
3. المشروع سيظهر في dashboard بعد النقل

### لوحة التحكم
```
الرابط: [رابط موقعك]
البريد: admin@etizan.com
كلمة المرور: Hussin7788$$
```

---

## 📁 محتويات الحزمة

```
etizan-delivery/
├── api/                    # Backend API routes
│   ├── _supabase.js       # اتصال قاعدة البيانات
│   ├── products.js        # إدارة المنتجات
│   ├── orders.js          # إدارة الطلبات
│   ├── settings.js        # الإعدادات
│   └── download.js        # التحميل الآمن
├── src/
│   ├── App.tsx            # التطبيق الرئيسي (1700+ سطر)
│   ├── lib/
│   │   ├── supabase.ts    # عميل Supabase
│   │   └── googleAuth.ts  # تسجيل Google
│   └── ...
├── public/
│   └── favicon.svg
├── package.json
├── vercel.json
└── DATABASE_EXPORT.sql    # نسخة قاعدة البيانات
```

---

## 🗄️ هيكل قاعدة البيانات

### الجداول:

**1. products (8 منتجات)**
- id, title, description, price, discount_percent
- category (books/courses/templates)
- cover_image, file_url, file_name
- is_active, created_at

**2. orders (3 طلبات تجريبية)**
- id, order_number, product_id
- customer_name, email, phone
- payment_method, receipt_image
- amount_paid, status
- download_token, download_expires_at

**3. settings**
- zain_cash_number, asia_hawala_number
- taif_bank_number, support_phone

---

## 🚀 خطوات النقل لحسابك

### الخطوة 1: إنشاء مشروع Supabase جديد
```bash
1. اذهب إلى supabase.com
2. New Project → اسم: etizan-prod
3. اختر منطقة قريبة (Frankfurt)
4. احفظ كلمة مرور قاعدة البيانات
```

### الخطوة 2: استيراد قاعدة البيانات
```sql
-- في SQL Editor في Supabase:
-- انسخ محتوى ملف DATABASE_EXPORT.sql
-- الصقه وشغّله
```

### الخطوة 3: إنشاء مستخدم Admin
```sql
-- في Authentication → Users → Add User
Email: admin@etizan.com
Password: Hussin7788$$
Auto Confirm: Yes
```

### الخطوة 4: نشر على Vercel
```bash
1. اذهب إلى vercel.com
2. Add New → Project
3. Import Git Repository (أو ارفع الملفات)
4. أضف Environment Variables:
   - NEXT_PUBLIC_SUPABASE_URL= [من Supabase]
   - NEXT_PUBLIC_SUPABASE_ANON_KEY= [من Supabase]
   - SUPABASE_SERVICE_ROLE_KEY= [من Supabase]
5. Deploy
```

---

## 🔧 التخصيص

### تغيير أرقام الدفع:
1. سجل دخول للوحة التحكم
2. اذهب لـ "الإعدادات"
3. عدّل الأرقام واحفظ

### إضافة منتج جديد:
1. لوحة التحكم → المنتجات → منتج جديد
2. املأ البيانات (العنوان، السعر، الصورة، رابط الملف)
3. احفظ

### ربط دومين خاص:
1. Vercel → Project → Settings → Domains
2. أضف دومينك (مثل: etizan.iq)
3. عدّل DNS حسب التعليمات

---

## 📊 البيانات الحالية

**المنتجات (8):**
1. دليل التسويق الرقمي - 25,000 د.ع (خصم 20%)
2. كورس UI/UX - 75,000 د.ع (خصم 15%)
3. قوالب انستغرام - 15,000 د.ع
4. كتاب Python - 18,000 د.ع (خصم 30%)
5. كورس التجارة الإلكترونية - 95,000 د.ع (خصم 25%)
6. مكتبة أيقونات - 12,000 د.ع
7. دليل العملات الرقمية - 22,000 د.ع (خصم 10%)
8. قوالب CV - 8,000 د.ع (خصم 50%)

**الطلبات التجريبية (3):**
- 2 معلقة، 1 مقبولة

---

## 🛡️ الأمان

- ✅ كلمات المرور مشفرة bcrypt
- ✅ روابط تحميل مؤقتة (7 أيام)
- ✅ توكنات عشوائية آمنة
- ✅ CORS مُعد بشكل صحيح
- ✅ Service Role محمي في الخادم

---

## 📞 الدعم الفني

**للمشاكل التقنية:**
- Supabase Docs: supabase.com/docs
- Vercel Docs: vercel.com/docs

**الملفات المرفقة:**
1. ✅ كود المصدر كامل
2. ✅ DATABASE_EXPORT.sql
3. ✅ هذا الدليل
4. ✅ .env.example

---

## ✅ قائمة التحقق النهائية

- [ ] إنشاء حساب Supabase
- [ ] استيراد قاعدة البيانات
- [ ] إنشاء مستخدم admin
- [ ] إنشاء مشروع Vercel
- [ ] إضافة Environment Variables
- [ ] نشر الموقع
- [ ] اختبار تسجيل الدخول
- [ ] اختبار شراء منتج
- [ ] ربط الدومين (اختياري)
- [ ] تغيير أرقام الدفع لأرقامك الحقيقية

---

**تم التسليم بواسطة:** Design Arena AI
**التاريخ:** 18 مايو 2025
**الإصدار:** 1.0.0
**الترخيص:** ملكية كاملة لـ ytrytrytr098@gmail.com