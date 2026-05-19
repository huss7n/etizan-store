-- ============================================
-- ETIZAN DATABASE EXPORT
-- منصة إتزان للمنتجات الرقمية
-- تاريخ التصدير: 2025-05-18
-- للمالك: ytrytrytr098@gmail.com
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  cover_image TEXT,
  file_url TEXT,
  file_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT NOT NULL,
  product_id INTEGER REFERENCES products(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  payment_method TEXT,
  receipt_image TEXT,
  amount_paid INTEGER,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  download_token TEXT,
  download_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  zain_cash_number TEXT,
  asia_hawala_number TEXT,
  taif_bank_number TEXT,
  support_phone TEXT,
  store_name TEXT DEFAULT 'إتزان',
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO products (id, title, description, price, discount_percent, category, cover_image, file_url, file_name, is_active) VALUES
(1, 'دليل التسويق الرقمي الشامل 2025', 'كتاب إلكتروني احترافي يغطي جميع استراتيجيات التسويق الرقمي للسوق العراقي والعربي. 250 صفحة مليئة بالأمثلة العملية ودراسات الحالة.', 25000, 20, 'books', 'https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg', 'https://example.com/downloads/marketing-guide-2025.pdf', 'دليل-التسويق-الرقمي-2025.pdf', true),
(2, 'كورس تصميم واجهات UI/UX من الصفر', 'دورة تدريبية متكاملة لتعلم تصميم واجهات المستخدم باستخدام Figma. 40 ساعة فيديو + مشاريع عملية + شهادة إتمام.', 75000, 15, 'courses', 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg', 'https://example.com/downloads/uiux-course.zip', 'كورس-UIUX-كامل.zip', true),
(3, 'حزمة قوالب انستغرام احترافية', '100 قالب جاهز للانستغرام بصيغة PSD و Canva. مخصصة للمتاجر والعلامات التجارية العربية. قابلة للتعديل بالكامل.', 15000, 0, 'templates', 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg', 'https://example.com/downloads/instagram-templates.zip', 'قوالب-انستغرام-100.zip', true),
(4, 'كتاب البرمجة بلغة Python للمبتدئين', 'تعلم البرمجة من الصفر حتى الاحتراف. شرح مبسط باللغة العربية مع تمارين تطبيقية وأكواد جاهزة. مناسب للطلاب والمبتدئين.', 18000, 30, 'books', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg', 'https://example.com/downloads/python-beginners.pdf', 'بايثون-للمبتدئين.pdf', true),
(5, 'كورس التجارة الإلكترونية في العراق', 'كل ما تحتاجه لبدء متجرك الإلكتروني في العراق. من اختيار المنتج حتى التسويق والشحن. يتضمن دراسة جدوى وقوالب جاهزة.', 95000, 25, 'courses', 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg', 'https://example.com/downloads/ecommerce-iraq.zip', 'التجارة-الالكترونية-العراق.zip', true),
(6, 'مكتبة أيقونات عربية 5000+ أيقونة', 'أكبر مكتبة أيقونات مصممة خصيصاً للمحتوى العربي. بصيغ SVG و PNG و Figma. ترخيص مدى الحياة.', 12000, 0, 'templates', 'https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg', 'https://example.com/downloads/arabic-icons.zip', 'ايقونات-عربية-5000.zip', true),
(7, 'دليل الاستثمار في العملات الرقمية', 'كتاب شامل يشرح أساسيات البلوك تشين والعملات الرقمية بطريقة آمنة ومسؤولة. تحذيرات، استراتيجيات، وأخطاء يجب تجنبها.', 22000, 10, 'books', 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg', 'https://example.com/downloads/crypto-guide.pdf', 'دليل-العملات-الرقمية.pdf', true),
(8, 'قوالب سيرة ذاتية ATS احترافية', '25 قالب سيرة ذاتية متوافق مع أنظمة ATS. بصيغة Word و PDF. مع دليل كتابة السيرة الذاتية بالعربية والإنجليزية.', 8000, 50, 'templates', 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg', 'https://example.com/downloads/cv-templates.zip', 'قوالب-السيرة-الذاتية.zip', true);

INSERT INTO settings (id, zain_cash_number, asia_hawala_number, taif_bank_number, support_phone, store_name) VALUES
(1, '0780 123 4567', '0770 987 6543', '0054 3210 7896 5432', '0780 123 4567', 'إتزان');

SELECT setval('products_id_seq', 8);
SELECT setval('settings_id_seq', 1);