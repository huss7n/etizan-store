import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, X, Check, Upload, Eye, Edit, Trash2, LogOut, Settings, Package, CreditCard, Download, Clock, CheckCircle2, XCircle, Menu, Home, BookOpen, Video, LayoutGrid } from 'lucide-react';
import { supabase } from './lib/supabase';
import { handleGoogleRedirect, signInWithGoogle } from './lib/googleAuth';

handleGoogleRedirect();

type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  discount_percent: number;
  category: string;
  cover_image: string;
  file_url: string;
  file_name: string;
  is_active: boolean;
  created_at: string;
};

type Order = {
  id: number;
  order_number: string;
  product_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: string;
  receipt_image: string;
  amount_paid: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  approved_at?: string;
  download_token?: string;
  products?: { title: string; price: number };
};

type SettingsType = {
  zain_cash_number?: string;
  asia_hawala_number?: string;
  taif_bank_number?: string;
  support_phone?: string;
  store_name?: string;
};

function App() {
  const [view, setView] = useState<'store' | 'admin' | 'download'>('store');
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showTrackOrder, setShowTrackOrder] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      setView('download');
      setAuthChecked(true);
      return;
    }

    let mounted = true;
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setAuthChecked(true);
        }
      } catch (e) {
        console.error('Auth init error:', e);
        if (mounted) setAuthChecked(true);
      }
    };

    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
          <div className="text-white/60 text-sm">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (view === 'download') {
    return <DownloadPage />;
  }

  if (view === 'admin') {
    if (!user) {
      return <AdminLogin onBack={() => setView('store')} />;
    }
    return <AdminDashboard user={user} onLogout={async () => { await supabase.auth.signOut(); setUser(null); setView('store'); }} onBack={() => setView('store')} />;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-[Tajawal]" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">إتزان</h1>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <button onClick={() => setView('store')} className="px-4 h-9 rounded-lg text-[14px] font-medium hover:bg-white/5 transition-colors">المتجر</button>
            <button onClick={() => setShowTrackOrder(true)} className="px-4 h-9 rounded-lg text-[14px] font-medium hover:bg-white/5 transition-colors">تتبع الطلب</button>
            <button onClick={() => setView('admin')} className="px-4 h-9 rounded-lg text-[14px] font-medium hover:bg-white/5 transition-colors">لوحة التحكم</button>
          </nav>

          <button onClick={() => setView('admin')} className="md:hidden w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-black leading-[1.1] tracking-tight mb-4">
              متجرك الرقمي<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">بين يديك</span>
            </h2>
            <p className="text-lg text-white/60 mb-8">اكتشف مجموعتنا من الكتب والكورسات والقوالب الرقمية</p>
            <button onClick={() => setShowTrackOrder(true)} className="h-12 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all">
              تتبع طلبك
            </button>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <ProductsGrid onProductSelect={(p) => { setSelectedProduct(p); setShowCheckout(true); }} />

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-[1400px] mx-auto px-4 text-center text-[13px] text-white/40">
          <p>© 2025 إتزان — جميع الحقوق محفوظة</p>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {selectedProduct && !showCheckout && (
          <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onBuy={() => setShowCheckout(true)} />
        )}
        {showCheckout && selectedProduct && (
          <CheckoutModal product={selectedProduct} onClose={() => { setShowCheckout(false); setSelectedProduct(null); }} onSuccess={() => { setShowCheckout(false); setSelectedProduct(null); }} />
        )}
        {showTrackOrder && (
          <TrackOrderModal onClose={() => setShowTrackOrder(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Products Grid
function ProductsGrid({ onProductSelect }: { onProductSelect: (p: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data.filter((p: Product) => p.is_active) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-white/40">جاري التحميل...</div>;

  return (
    <section className="py-12 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} onClick={() => onProductSelect(product)} />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const discounted = product.price * (1 - product.discount_percent / 100);
  const formatPrice = (price: number) => new Intl.NumberFormat('ar-IQ').format(price);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group bg-[#0f172a]/50 backdrop-blur-sm border border-white/[0.07] rounded-2xl overflow-hidden cursor-pointer hover:border-white/20 transition-all"
    >
      <div className="relative aspect-[4/3] bg-[#020617]">
        <img src={product.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        {product.discount_percent > 0 && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white text-[11px] font-bold rounded-lg">
            خصم {product.discount_percent}%
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-[15px] mb-2 line-clamp-1">{product.title}</h3>
        <p className="text-[12px] text-white/50 line-clamp-2 mb-3 min-h-[36px]">{product.description}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-[20px] font-black tracking-tight">{formatPrice(discounted)}</span>
          <span className="text-[13px] text-white/40">د.ع</span>
          {product.discount_percent > 0 && (
            <span className="text-[12px] text-white/30 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Product Modal
function ProductModal({ product, onClose, onBuy }: { product: Product; onClose: () => void; onBuy: () => void }) {
  const formatPrice = (price: number) => new Intl.NumberFormat('ar-IQ').format(price);
  const discounted = product.price * (1 - product.discount_percent / 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-4xl bg-[#0f172a] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 left-4 z-10 w-9 h-9 flex items-center justify-center bg-black/60 backdrop-blur rounded-xl hover:bg-black/80"><X className="w-5 h-5" /></button>
        <div className="grid md:grid-cols-2">
          <div className="aspect-[4/3] md:aspect-auto bg-[#020617]">
            <img src={product.cover_image} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="p-8">
            <span className="inline-block px-2.5 py-1 bg-white/5 rounded-lg text-[11px] mb-4">{product.category === 'books' ? 'كتاب إلكتروني' : product.category === 'courses' ? 'كورس تدريبي' : 'قالب جاهز'}</span>
            <h2 className="text-[28px] font-black mb-3">{product.title}</h2>
            <p className="text-[15px] text-white/70 mb-6">{product.description}</p>
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-[32px] font-black">{formatPrice(discounted)} د.ع</span>
              {product.discount_percent > 0 && <span className="text-[16px] text-white/40 line-through">{formatPrice(product.price)} د.ع</span>}
            </div>
            <button onClick={onBuy} className="w-full h-[48px] bg-white text-black font-bold rounded-2xl hover:bg-white/90">شراء الآن</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Checkout Modal
function CheckoutModal({ product, onClose, onSuccess }: { product: Product; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', payment_method: 'zain_cash' });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const discountedPrice = product.price * (1 - product.discount_percent / 100);
  const formatPrice = (price: number) => new Intl.NumberFormat('ar-IQ').format(price) + ' د.ع';

  const handleSubmit = async () => {
    if (!receiptFile) return;
    setUploading(true);
    try {
      const receiptUrl = URL.createObjectURL(receiptFile);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          payment_method: formData.payment_method,
          receipt_image: receiptUrl,
          amount_paid: discountedPrice,
        }),
      });
      const order = await res.json();
      setOrderNumber(order.order_number);
      setStep(3);
    } catch (err) {
      alert('حدث خطأ، حاول مرة أخرى');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="w-full max-w-[480px] bg-[#0f172a] border border-white/10 rounded-[28px] p-6 sm:p-8">
        {step === 3 ? (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/15 flex items-center justify-center"><CheckCircle2 className="w-8 h-8 text-emerald-400" /></div>
            <h2 className="text-[24px] font-black mb-2">تم استلام طلبك!</h2>
            <p className="text-[14px] text-white/60 mb-6">رقم طلبك: <span className="font-mono text-emerald-400">{orderNumber}</span></p>
            <button onClick={onSuccess} className="w-full h-11 bg-white text-black font-bold rounded-xl">تم</button>
          </div>
        ) : (
          <>
            <div className="h-[3px] bg-white/5 mb-6"><div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${(step/3)*100}%` }} /></div>
            <button onClick={onClose} className="absolute top-5 left-5"><X className="w-4 h-4" /></button>
            
            {step === 1 ? (
              <div>
                <h2 className="text-[22px] font-black mb-6">معلوماتك</h2>
                <div className="space-y-3.5">
                  <input type="text" placeholder="الاسم الكامل" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-11 px-3.5 bg-white/[0.03] border border-white/10 rounded-xl" />
                  <input type="email" placeholder="البريد الإلكتروني" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full h-11 px-3.5 bg-white/[0.03] border border-white/10 rounded-xl" dir="ltr" />
                  <input type="tel" placeholder="رقم الهاتف" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full h-11 px-3.5 bg-white/[0.03] border border-white/10 rounded-xl" dir="ltr" />
                </div>
                <button onClick={() => setStep(2)} disabled={!formData.name || !formData.email || !formData.phone} className="w-full h-12 mt-6 bg-white text-black font-bold rounded-xl disabled:opacity-30">متابعة</button>
              </div>
            ) : (
              <div>
                <h2 className="text-[22px] font-black mb-1">اختر طريقة الدفع</h2>
                <p className="text-white/50 mb-5">حوّل المبلغ ثم ارفع الوصل</p>
                <div className="p-4 bg-[#020617] border border-white/10 rounded-2xl mb-5">
                  <p className="text-emerald-400 font-bold text-[24px]">{formatPrice(discountedPrice)}</p>
                </div>
                <label className="block mb-5">
                  <input type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="hidden" />
                  <div className="h-[88px] border-2 border-dashed border-white/15 rounded-2xl flex flex-col items-center justify-center cursor-pointer">
                    {receiptFile ? <><CheckCircle2 className="w-6 h-6 text-emerald-400" /><span>{receiptFile.name}</span></> : <><Upload className="w-5 h-5 text-white/40" /><span className="text-white/60 text-[12px]">اضغط لرفع صورة الوصل</span></>}
                  </div>
                </label>
                <button onClick={handleSubmit} disabled={!receiptFile || uploading} className="w-full h-12 bg-emerald-500 text-black font-bold rounded-xl disabled:opacity-30">{uploading ? 'جاري الإرسال...' : 'تأكيد الطلب'}</button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// Track Order Modal - تتبع الطلبات
function TrackOrderModal({ onClose }: { onClose: () => void }) {
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch('/api/orders');
      const orders = await res.json();
      const found = orders.find((o: any) => o.order_number === orderNumber.trim());
      if (found) {
        setOrder(found);
      } else {
        setError('لم يتم العثور على الطلب. تأكد من رقم الطلب.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء البحث.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-[480px] bg-[#0f172a] border border-white/10 rounded-[28px] p-6 sm:p-8">
        <button onClick={onClose} className="absolute top-5 left-5"><X className="w-4 h-4 text-white/60" /></button>
        
        <div className="text-center mb-6">
          <Package className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-[24px] font-black mb-2">تتبع طلبك</h2>
          <p className="text-white/50 text-[14px]">أدخل رقم الطلب لمعرفة حالته</p>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="ETZ-ABC123"
            className="flex-1 h-12 px-4 bg-white/[0.03] border border-white/10 rounded-xl uppercase"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} disabled={loading} className="h-12 px-5 bg-emerald-500 text-black font-bold rounded-xl">
            {loading ? <Clock className="w-5 h-5 animate-spin" /> : 'بحث'}
          </button>
        </div>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center mb-4">{error}</div>}

        {order && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
              <div>
                <p className="text-white/40 text-[12px]">رقم الطلب</p>
                <p className="text-[18px] font-bold font-mono">{order.order_number}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${
                order.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                order.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {order.status === 'approved' ? 'مكتمل' : order.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
              </span>
            </div>
            <div className="space-y-3">
              <p><span className="text-white/40">المنتج:</span> {order.products?.title || '-'}</p>
              <p><span className="text-white/40">المبلغ:</span> {order.amount_paid?.toLocaleString()} د.ع</p>
              <p><span className="text-white/40">التاريخ:</span> {new Date(order.created_at).toLocaleDateString('ar-IQ')}</p>
            </div>
            {order.status === 'approved' && (
              <button className="w-full mt-4 h-11 bg-emerald-500 text-black font-bold rounded-xl flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                تحميل المنتج
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Admin Login
function AdminLogin({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-[#0f172a] border border-white/10 rounded-[28px] p-8">
        <button onClick={onBack} className="mb-6 flex items-center gap-2 text-white/60"><Home className="w-4 h-4" /> العودة</button>
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-[24px] font-black">لوحة تحكم إتزان</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full h-11 px-3.5 bg-white/[0.03] border border-white/10 rounded-xl" dir="ltr" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full h-11 px-3.5 bg-white/[0.03] border border-white/10 rounded-xl" dir="ltr" required />
          {error && <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400 text-center">{error}</div>}
          <button type="submit" disabled={loading} className="w-full h-11 bg-white text-black font-bold rounded-xl">{loading ? 'جاري الدخول...' : 'تسجيل الدخول'}</button>
        </form>
        <button onClick={() => signInWithGoogle('إتزان')} className="w-full mt-4 h-11 bg-white/5 border border-white/10 rounded-xl font-medium flex items-center justify-center gap-2">
          الدخول عبر Google
        </button>
      </div>
    </div>
  );
}

// Admin Dashboard
function AdminDashboard({ user, onLogout, onBack }: { user: any; onLogout: () => void; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products')
      ]);
      setOrders(await ordersRes.json());
      setProducts(await productsRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleOrderAction = async (orderId: number, status: 'approved' | 'rejected') => {
    await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status }),
    });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">لوحة التحكم</h1>
            <div className="hidden md:flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl">
              <button onClick={() => setActiveTab('orders')} className={`px-3 h-[30px] rounded-lg text-[13px] ${activeTab === 'orders' ? 'bg-white text-black' : 'text-white/60'}`}>الطلبات</button>
              <button onClick={() => setActiveTab('products')} className={`px-3 h-[30px] rounded-lg text-[13px] ${activeTab === 'products' ? 'bg-white text-black' : 'text-white/60'}`}>المنتجات</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[12px] text-white/40">{user.email}</span>
            <button onClick={onLogout} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-6">
        {activeTab === 'orders' ? (
          <div className="bg-[#0f172a]/50 border border-white/[0.07] rounded-[24px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/5 text-white/50">
                  <th className="text-right px-5 py-3">الطلب</th>
                  <th className="text-right px-5 py-3">العميل</th>
                  <th className="text-right px-5 py-3">المنتج</th>
                  <th className="text-right px-5 py-3">المبلغ</th>
                  <th className="text-right px-5 py-3">الحالة</th>
                  <th className="text-right px-5 py-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-mono">{order.order_number}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-[11px] text-white/40">{order.customer_phone}</div>
                    </td>
                    <td className="px-5 py-3 text-white/70">{order.products?.title}</td>
                    <td className="px-5 py-3 font-medium text-emerald-400">{order.amount_paid?.toLocaleString()} د.ع</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                        order.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' :
                        order.status === 'rejected' ? 'bg-red-500/15 text-red-400' :
                        'bg-amber-500/15 text-amber-400'
                      }`}>
                        {order.status === 'approved' ? 'مكتمل' : order.status === 'rejected' ? 'مرفوض' : 'معلق'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {order.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleOrderAction(order.id, 'approved')} className="w-7 h-7 bg-emerald-500/15 text-emerald-400 rounded-lg"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleOrderAction(order.id, 'rejected')} className="w-7 h-7 bg-red-500/15 text-red-400 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-[#0f172a]/50 border border-white/[0.07] rounded-2xl p-4">
                <h3 className="font-bold mb-2">{product.title}</h3>
                <p className="text-white/50 text-[12px]">{product.price.toLocaleString()} د.ع</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Download Page
function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">صفحة التحميل</h1>
        <p className="text-white/60">جاري التحقق من الطلب...</p>
      </div>
    </div>
  );
}

export default App;