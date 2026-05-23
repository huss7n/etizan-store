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

  useEffect(() => {
    // Check for download token
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      setView('download');
      setAuthChecked(true);
      return;
    }

    // Initialize auth
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
        if (mounted) {
          setAuthChecked(true);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Show loading until auth is checked
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
          <div className="text-white/60 text-sm font-[Tajawal]">جاري التحميل...</div>
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

  return <Storefront onAdminAccess={() => setView('admin')} />;
}

// Storefront Component
function Storefront({ onAdminAccess }: { onAdminAccess: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SettingsType>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSettings();
  }, []);

  useEffect(() => {
    let filtered = [...products];
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => (a.price * (1 - a.discount_percent/100)) - (b.price * (1 - b.discount_percent/100)));
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => (b.price * (1 - b.discount_percent/100)) - (a.price * (1 - a.discount_percent/100)));
    } else {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Fetch products error:', e);
      setProducts([]);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data || {});
    } catch (e) {
      console.error('Fetch settings error:', e);
    }
  };

  const categories = [
    { id: 'all', name: 'الكل', icon: LayoutGrid },
    { id: 'books', name: 'كتب إلكترونية', icon: BookOpen },
    { id: 'courses', name: 'كورسات', icon: Video },
    { id: 'templates', name: 'قوالب وأدوات', icon: Package },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-IQ').format(price) + ' د.ع';
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-[Tajawal]" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#020617]/80 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">إتزان</h1>
                <p className="text-[10px] text-white/50 -mt-1">ETIZAN STORE</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-full p-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id 
                      ? 'bg-white text-black' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onAdminAccess}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                الإدارة
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-white/5 rounded-xl"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 bg-[#0f172a]"
            >
              <div className="px-4 py-3 flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setMobileMenuOpen(false); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      selectedCategory === cat.id 
                        ? 'bg-white text-black' 
                        : 'bg-white/5 text-white/70'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[200px] pointer-events-none" />
        
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs mb-6"
            >
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              متجر رقمي للسوق العراقي والعربي
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[56px] font-black leading-[1.1] tracking-tight mb-4"
            >
              منتجات رقمية
              <br />
              <span className="bg-gradient-to-l from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                بجودة إتزان
              </span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-white/60 mb-8 leading-relaxed"
            >
              كتب، كورسات، وقوالب احترافية — دفع محلي آمن عبر زين كاش وآسيا حوالة
            </motion.p>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative max-w-xl"
            >
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="ابحث عن كتاب، كورس، أو قالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[52px] pr-12 pl-4 bg-white/[0.03] border border-white/10 rounded-2xl text-[15px] placeholder-white/40 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
              />
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 px-3 bg-[#0f172a] border border-white/10 rounded-xl text-xs text-white/70 focus:outline-none cursor-pointer"
                >
                  <option value="newest">الأحدث</option>
                  <option value="price-low">السعر: الأقل</option>
                  <option value="price-high">السعر: الأعلى</option>
                </select>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[15px] font-medium text-white/80">
            {filteredProducts.length} منتج
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredProducts.map((product, index) => {
            const discountedPrice = product.price * (1 - product.discount_percent / 100);
            const hasDiscount = product.discount_percent > 0;
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group relative"
              >
                <div className="relative bg-[#0f172a]/50 backdrop-blur-sm border border-white/[0.07] rounded-[24px] overflow-hidden hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50">
                  {/* Cover */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#020617]">
                    <img
                      src={product.cover_image || 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg'}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-60" />
                    
                    {hasDiscount && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-red-500 text-white text-[11px] font-bold rounded-lg">
                        -{product.discount_percent}%
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium rounded-lg border border-white/10">
                      {product.category === 'books' ? 'كتاب' : product.category === 'courses' ? 'كورس' : 'قالب'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h4 className="font-bold text-[15px] leading-snug mb-1.5 line-clamp-1">{product.title}</h4>
                    <p className="text-[13px] text-white/50 line-clamp-2 leading-relaxed mb-3 min-h-[36px]">{product.description}</p>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[20px] font-black tracking-tight">{formatPrice(discountedPrice)}</span>
                          {hasDiscount && (
                            <span className="text-[12px] text-white/40 line-through">{formatPrice(product.price)}</span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => { setSelectedProduct(product); setShowCheckout(true); }}
                        className="h-9 px-4 bg-white text-black text-[13px] font-bold rounded-xl hover:bg-white/90 transition-all active:scale-95"
                      >
                        شراء
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="absolute inset-0 w-full h-full cursor-pointer"
                    aria-label="عرض التفاصيل"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <Search className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40">لا توجد منتجات مطابقة</p>
          </div>
        )}
      </section>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && !showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-[#0f172a] border border-white/10 rounded-[32px] shadow-2xl"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 left-4 z-10 w-9 h-9 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-xl hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative aspect-[4/3] md:aspect-auto md:h-full bg-[#020617]">
                  <img src={selectedProduct.cover_image} alt={selectedProduct.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="p-8">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg text-[11px] mb-4">
                    {selectedProduct.category === 'books' ? 'كتاب إلكتروني' : selectedProduct.category === 'courses' ? 'كورس تدريبي' : 'قالب جاهز'}
                  </div>
                  
                  <h2 className="text-[28px] font-black leading-tight mb-3">{selectedProduct.title}</h2>
                  <p className="text-[15px] leading-relaxed text-white/70 mb-6">{selectedProduct.description}</p>
                  
                  <div className="flex items-baseline gap-3 mb-8">
                    <span className="text-[32px] font-black">
                      {formatPrice(selectedProduct.price * (1 - selectedProduct.discount_percent/100))}
                    </span>
                    {selectedProduct.discount_percent > 0 && (
                      <>
                        <span className="text-[16px] text-white/40 line-through">{formatPrice(selectedProduct.price)}</span>
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded">وفر {selectedProduct.discount_percent}%</span>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full h-[48px] bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all active:scale-[0.98]"
                  >
                    شراء الآن — دفع محلي
                  </button>
                  
                  <div className="mt-6 pt-6 border-t border-white/5 space-y-2.5 text-[13px] text-white/50">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>تحميل فوري بعد تأكيد الدفع</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>دفع آمن عبر زين كاش وآسيا حوالة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>دعم فني خلال 24 ساعة</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && selectedProduct && (
          <CheckoutModal
            product={selectedProduct}
            settings={settings}
            onClose={() => { setShowCheckout(false); setSelectedProduct(null); }}
            onSuccess={() => { setShowCheckout(false); setSelectedProduct(null); }}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-white/40">
            <p>© 2025 إتزان — جميع الحقوق محفوظة</p>
            <p>الدفع عبر زين كاش • آسيا حوالة • مصرف الطيف</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Checkout Modal Component
function CheckoutModal({ product, settings, onClose, onSuccess }: { product: Product; settings: SettingsType; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    payment_method: 'zain_cash',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const discountedPrice = product.price * (1 - product.discount_percent / 100);
  const formatPrice = (price: number) => new Intl.NumberFormat('ar-IQ').format(price) + ' د.ع';

  const paymentMethods = [
    { id: 'zain_cash', name: 'زين كاش', number: settings.zain_cash_number || '0780 123 4567', color: 'from-orange-500 to-red-500' },
    { id: 'asia_hawala', name: 'آسيا حوالة', number: settings.asia_hawala_number || '0770 987 6543', color: 'from-blue-500 to-cyan-500' },
    { id: 'taif', name: 'مصرف الطيف', number: settings.taif_bank_number || '0054 3210 7896', color: 'from-emerald-500 to-teal-500' },
  ];

  const selectedMethod = paymentMethods.find(m => m.id === formData.payment_method)!;

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
      console.error(err);
      alert('حدث خطأ، حاول مرة أخرى');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[480px] bg-[#0f172a] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden"
      >
        <div className="h-[3px] bg-white/5">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        <div className="p-6 sm:p-8">
          <button onClick={onClose} className="absolute top-5 left-5 w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>

          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#020617]">
                  <img src={product.cover_image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{product.title}</h3>
                  <p className="text-sm text-emerald-400 font-bold">{formatPrice(discountedPrice)}</p>
                </div>
              </div>

              <h2 className="text-[22px] font-black mb-1">معلوماتك</h2>
              <p className="text-[13px] text-white/50 mb-6">سنرسل رابط التحميل إلى بريدك</p>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[12px] font-medium text-white/70 mb-1.5">الاسم الكامل</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-11 px-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                    placeholder="مثال: أحمد محمد"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-white/70 mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-11 px-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                    placeholder="example@mail.com"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-white/70 mb-1.5">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-11 px-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all"
                    placeholder="07XX XXX XXXX"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.email || !formData.phone}
                className="w-full h-12 mt-6 bg-white text-black font-bold rounded-xl hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                متابعة للدفع
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="text-[13px] text-white/60 hover:text-white mb-4 flex items-center gap-1">
                ← رجوع
              </button>

              <h2 className="text-[22px] font-black mb-1">اختر طريقة الدفع</h2>
              <p className="text-[13px] text-white/50 mb-5">حوّل المبلغ ثم ارفع الوصل</p>

              <div className="grid grid-cols-3 gap-2 mb-5">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setFormData({ ...formData, payment_method: method.id })}
                    className={`relative p-3 rounded-2xl border transition-all ${
                      formData.payment_method === method.id
                        ? 'border-white/30 bg-white/5'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-8 h-8 mx-auto mb-1.5 rounded-xl bg-gradient-to-br ${method.color} opacity-80`} />
                    <div className="text-[11px] font-medium">{method.name}</div>
                    {formData.payment_method === method.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-[#020617] border border-white/10 rounded-2xl mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-white/50">حوّل إلى</span>
                  <span className="text-[11px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-medium">انسخ الرقم</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{selectedMethod.name}</div>
                    <div className="text-[18px] font-mono tracking-wider mt-1" dir="ltr">{selectedMethod.number}</div>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedMethod.number)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-medium transition-colors"
                  >
                    نسخ
                  </button>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[12px] text-white/50">المبلغ المطلوب</span>
                  <span className="text-[18px] font-black text-emerald-400">{formatPrice(discountedPrice)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-white/70 mb-2">ارفع صورة الوصل *</label>
                <label className="relative block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                  <div className={`h-[88px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                    receiptFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/15 hover:border-white/25 hover:bg-white/[0.02]'
                  }`}>
                    {receiptFile ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1" />
                        <span className="text-[12px] font-medium text-emerald-400">{receiptFile.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-white/40 mb-1" />
                        <span className="text-[12px] text-white/60">اضغط لرفع صورة الوصل</span>
                      </>
                    )}
                  </div>
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!receiptFile || uploading}
                className="w-full h-12 mt-5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  'تأكيد الطلب'
                )}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              
              <h2 className="text-[24px] font-black mb-2">تم استلام طلبك!</h2>
              <p className="text-[14px] text-white/60 mb-6 leading-relaxed">
                رقم طلبك <span className="font-mono text-emerald-400">{orderNumber}</span>
                <br />
                سنراجع الدفع ونرسل لك رابط التحميل قريباً
              </p>

              <button
                onClick={onSuccess}
                className="w-full h-11 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all"
              >
                تم
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Admin Login - SIMPLIFIED
function AdminLogin({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password: password 
      });
      
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      
      if (data.user) {
        // Force page reload to ensure clean state
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-[Tajawal]" dir="rtl">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]" />
      </div>
      
      <div className="relative w-full max-w-[400px]">
        <button onClick={onBack} className="mb-6 flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white transition-colors">
          <Home className="w-4 h-4" />
          العودة للمتجر
        </button>

        <div className="bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-[28px] p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-black" />
            </div>
            <h1 className="text-[24px] font-black mb-1">لوحة تحكم إتزان</h1>
            <p className="text-[13px] text-white/50">سجل دخولك لإدارة المتجر</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-white/70 mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50 transition-all"
                dir="ltr"
                required
                autoComplete="email"
              />
            </div>
            
            <div>
              <label className="block text-[12px] font-medium text-white/70 mb-1.5">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50 transition-all"
                dir="ltr"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-white text-black font-bold rounded-xl hover:bg-white/90 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-[#0f172a] text-[11px] text-white/40">أو</span>
            </div>
          </div>

          <button
            onClick={() => signInWithGoogle('إتزان')}
            type="button"
            className="w-full h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-[14px] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            الدخول عبر Google
          </button>

          <div className="mt-6 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
            <p className="text-[11px] text-emerald-200/70 text-center leading-relaxed">
              <strong>بيانات الدخول:</strong><br />
              admin@etizan.com<br />
              Hussin7788$$
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Admin Dashboard
function AdminDashboard({ user, onLogout, onBack }: { user: any; onLogout: () => void; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SettingsType>({});
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchSettings();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data || {});
    } catch (e) {
      console.error(e);
    }
  };

  const handleOrderAction = async (orderId: number, status: 'approved' | 'rejected', notes?: string) => {
    await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status, admin_notes: notes }),
    });
    fetchOrders();
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    if (editingProduct) {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingProduct.id, ...productData }),
      });
    } else {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
    }
    fetchProducts();
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchProducts();
    }
  };

  const handleSaveSettings = async () => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    alert('تم حفظ الإعدادات');
  };

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.filter(o => o.status === 'approved').reduce((sum, o) => sum + o.amount_paid, 0);

  return (
    <div className="min-h-screen bg-[#020617] text-white font-[Tajawal]" dir="rtl">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#020617]/80 border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                  <ShoppingBag className="w-4.5 h-4.5 text-black" />
                </div>
                <div>
                  <h1 className="text-[15px] font-bold leading-none">إتزان</h1>
                  <p className="text-[10px] text-white/50">لوحة التحكم</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl">
                {[
                  { id: 'orders', label: 'الطلبات', icon: CreditCard, count: pendingOrders },
                  { id: 'products', label: 'المنتجات', icon: Package, count: products.length },
                  { id: 'settings', label: 'الإعدادات', icon: Settings, count: 0 },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative flex items-center gap-1.5 px-3.5 h-[30px] rounded-lg text-[13px] font-medium transition-all ${
                      activeTab === tab.id ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`px-1.5 h-[18px] flex items-center justify-center rounded-md text-[10px] font-bold ${
                        activeTab === tab.id ? 'bg-black/10 text-black' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={onBack} className="hidden sm:flex items-center gap-1.5 px-3 h-8 text-[12px] text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <Eye className="w-3.5 h-3.5" />
                عرض المتجر
              </button>
              <div className="h-6 w-px bg-white/10 hidden sm:block" />
              <div className="hidden sm:block text-right">
                <div className="text-[12px] font-medium leading-none">{user.email}</div>
                <div className="text-[10px] text-white/40">مدير</div>
              </div>
              <button onClick={onLogout} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors text-white/60 hover:text-white">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: 'طلبات معلقة', value: pendingOrders, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'طلبات مكتملة', value: orders.filter(o => o.status === 'approved').length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'إجمالي الإيرادات', value: new Intl.NumberFormat('ar-IQ').format(totalRevenue) + ' د.ع', icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'المنتجات النشطة', value: products.filter(p => p.is_active).length, icon: Package, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#0f172a]/50 backdrop-blur-sm border border-white/[0.07] rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-[22px] font-black tracking-tight">{stat.value}</div>
              <div className="text-[12px] text-white/50 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="md:hidden flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl mb-6">
          {[
            { id: 'orders', label: 'الطلبات', icon: CreditCard },
            { id: 'products', label: 'المنتجات', icon: Package },
            { id: 'settings', label: 'الإعدادات', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === tab.id ? 'bg-white text-black' : 'text-white/60'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'orders' && (
          <div className="bg-[#0f172a]/50 backdrop-blur-sm border border-white/[0.07] rounded-[24px] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-[16px] font-bold">إدارة الطلبات</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="text-right px-5 py-3 text-[11px] font-medium text-white/50 uppercase tracking-wider">الطلب</th>
                    <th className="text-right px-5 py-3 text-[11px] font-medium text-white/50 uppercase tracking-wider">العميل</th>
                    <th className="text-right px-5 py-3 text-[11px] font-medium text-white/50 uppercase tracking-wider">المنتج</th>
                    <th className="text-right px-5 py-3 text-[11px] font-medium text-white/50 uppercase tracking-wider">المبلغ</th>
                    <th className="text-right px-5 py-3 text-[11px] font-medium text-white/50 uppercase tracking-wider">الدفع</th>
                    <th className="text-right px-5 py-3 text-[11px] font-medium text-white/50 uppercase tracking-wider">الحالة</th>
                    <th className="text-right px-5 py-3 text-[11px] font-medium text-white/50 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono text-[12px] font-medium">{order.order_number}</div>
                        <div className="text-[11px] text-white/40 mt-0.5">{new Date(order.created_at).toLocaleDateString('ar-IQ')}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[13px] font-medium">{order.customer_name}</div>
                        <div className="text-[11px] text-white/50" dir="ltr">{order.customer_phone}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[13px]">{order.products?.title}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[13px] font-bold">{new Intl.NumberFormat('ar-IQ').format(order.amount_paid)} د.ع</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[12px]">{order.payment_method === 'zain_cash' ? 'زين كاش' : order.payment_method === 'asia_hawala' ? 'آسيا' : 'الطيف'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                          order.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                          order.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {order.status === 'pending' ? <Clock className="w-3 h-3" /> : order.status === 'approved' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {order.status === 'pending' ? 'معلق' : order.status === 'approved' ? 'مقبول' : 'مرفوض'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <a href={order.receipt_image} target="_blank" className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition-colors" title="عرض الوصل">
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                          {order.status === 'pending' && (
                            <>
                              <button onClick={() => handleOrderAction(order.id, 'approved')} className="w-7 h-7 flex items-center justify-center bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-lg transition-colors" title="موافقة">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleOrderAction(order.id, 'rejected', 'الرجاء إعادة إرسال وصل أوضح')} className="w-7 h-7 flex items-center justify-center bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg transition-colors" title="رفض">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {orders.length === 0 && (
                <div className="py-16 text-center text-white/40 text-[14px]">لا توجد طلبات بعد</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-bold">المنتجات الرقمية</h2>
              <button onClick={() => { setEditingProduct(null); setShowProductModal(true); }} className="h-9 px-4 bg-white text-black text-[13px] font-bold rounded-xl hover:bg-white/90 transition-all flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                منتج جديد
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => {
                const discounted = product.price * (1 - product.discount_percent / 100);
                return (
                  <div key={product.id} className="bg-[#0f172a]/50 backdrop-blur-sm border border-white/[0.07] rounded-2xl overflow-hidden group">
                    <div className="relative aspect-video bg-[#020617]">
                      <img src={product.cover_image} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingProduct(product); setShowProductModal(true); }} className="w-7 h-7 bg-black/70 backdrop-blur flex items-center justify-center rounded-lg hover:bg-black/90 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="w-7 h-7 bg-red-500/80 backdrop-blur flex items-center justify-center rounded-lg hover:bg-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-[14px] leading-snug">{product.title}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap ${product.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-white/50'}`}>
                          {product.is_active ? 'نشط' : 'مخفي'}
                        </span>
                      </div>
                      <p className="text-[12px] text-white/50 line-clamp-2 mb-3 min-h-[32px]">{product.description}</p>
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[16px] font-black">{new Intl.NumberFormat('ar-IQ').format(discounted)}</span>
                          <span className="text-[11px] text-white/40">د.ع</span>
                          {product.discount_percent > 0 && (
                            <span className="text-[11px] text-white/30 line-through">{new Intl.NumberFormat('ar-IQ').format(product.price)}</span>
                          )}
                        </div>
                        <span className="text-[11px] px-2 py-0.5 bg-white/5 rounded-md">{product.category === 'books' ? 'كتاب' : product.category === 'courses' ? 'كورس' : 'قالب'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl">
            <div className="bg-[#0f172a]/50 backdrop-blur-sm border border-white/[0.07] rounded-[24px] p-6">
              <h2 className="text-[16px] font-bold mb-6">إعدادات الدفع</h2>
              
              <div className="space-y-5">
                {[
                  { key: 'zain_cash_number', label: 'رقم زين كاش', placeholder: '0780 123 4567', icon: '🟠' },
                  { key: 'asia_hawala_number', label: 'رقم آسيا حوالة', placeholder: '0770 987 6543', icon: '🔵' },
                  { key: 'taif_bank_number', label: 'حساب مصرف الطيف', placeholder: '0054 3210 7896', icon: '🟢' },
                  { key: 'support_phone', label: 'هاتف الدعم الفني', placeholder: '0780 123 4567', icon: '📞' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="flex items-center gap-2 text-[12px] font-medium text-white/70 mb-1.5">
                      <span>{field.icon}</span>
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={(settings as any)[field.key] || ''}
                      onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                      className="w-full h-11 px-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50 transition-all"
                      placeholder={field.placeholder}
                      dir="ltr"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-8 pt-6 border-t border-white/5">
                <button onClick={handleSaveSettings} className="h-10 px-5 bg-emerald-500 text-black text-[13px] font-bold rounded-xl hover:bg-emerald-400 transition-all">
                  حفظ الإعدادات
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showProductModal && (
          <ProductModal
            product={editingProduct}
            onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
            onSave={handleSaveProduct}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductModal({ product, onClose, onSave }: { product: Product | null; onClose: () => void; onSave: (data: Partial<Product>) => void }) {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || 0,
    discount_percent: product?.discount_percent || 0,
    category: product?.category || 'books',
    cover_image: product?.cover_image || 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
    file_url: product?.file_url || '',
    file_name: product?.file_name || '',
    is_active: product?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-[520px] max-h-[90vh] overflow-auto bg-[#0f172a] border border-white/10 rounded-[24px] shadow-2xl">
        <div className="sticky top-0 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <h3 className="text-[16px] font-bold">{product ? 'تعديل المنتج' : 'منتج جديد'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-white/70 mb-1.5">عنوان المنتج</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full h-10 px-3 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50" required />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-white/70 mb-1.5">الوصف</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50 resize-none" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-white/70 mb-1.5">السعر (د.ع)</label>
              <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="w-full h-10 px-3 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50" required />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-white/70 mb-1.5">الخصم %</label>
              <input type="number" min="0" max="90" value={formData.discount_percent} onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })} className="w-full h-10 px-3 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50" />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-white/70 mb-1.5">الفئة</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full h-10 px-3 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50">
              <option value="books">كتب إلكترونية</option>
              <option value="courses">كورسات</option>
              <option value="templates">قوالب وأدوات</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-white/70 mb-1.5">رابط صورة الغلاف</label>
            <input type="url" value={formData.cover_image} onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })} className="w-full h-10 px-3 bg-white/[0.03] border border-white/10 rounded-xl text-[13px] focus:outline-none focus:border-emerald-500/50" dir="ltr" />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-white/70 mb-1.5">رابط الملف الرقمي</label>
            <input type="url" value={formData.file_url} onChange={(e) => setFormData({ ...formData, file_url: e.target.value })} className="w-full h-10 px-3 bg-white/[0.03] border border-white/10 rounded-xl text-[13px] focus:outline-none focus:border-emerald-500/50" placeholder="https://..." dir="ltr" required />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-white/70 mb-1.5">اسم الملف</label>
            <input type="text" value={formData.file_name} onChange={(e) => setFormData({ ...formData, file_name: e.target.value })} className="w-full h-10 px-3 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50" placeholder="my-ebook.pdf" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50" />
            <span className="text-[13px]">منتج نشط ومرئي في المتجر</span>
          </label>

          <div className="flex gap-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 h-10 bg-white/5 hover:bg-white/10 rounded-xl text-[13px] font-medium transition-colors">إلغاء</button>
            <button type="submit" className="flex-1 h-10 bg-white text-black rounded-xl text-[13px] font-bold hover:bg-white/90 transition-all">حفظ المنتج</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DownloadPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (!token) {
      setError('رابط غير صالح');
      setLoading(false);
      return;
    }

    fetch(`/api/download?token=${token}`)
      .then(res => res.json())
      .then(result => {
        if (result.error) {
          setError(result.error);
        } else {
          setData(result);
        }
      })
      .catch(() => setError('حدث خطأ'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-[Tajawal] text-white" dir="rtl">
      <div className="w-full max-w-[480px]">
        {loading ? (
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60">جاري التحقق...</p>
          </div>
        ) : error ? (
          <div className="bg-[#0f172a] border border-red-500/20 rounded-[24px] p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/15 flex items-center justify-center">
              <XCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-[20px] font-bold mb-2">خطأ في الرابط</h2>
            <p className="text-white/60 mb-6">{error}</p>
            <a href="/" className="inline-flex items-center gap-1.5 px-4 h-10 bg-white text-black rounded-xl text-[13px] font-bold hover:bg-white/90">
              العودة للمتجر
            </a>
          </div>
        ) : (
          <div className="bg-[#0f172a] border border-white/10 rounded-[24px] p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Download className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-[22px] font-black mb-1">جاهز للتحميل</h2>
            <p className="text-white/60 mb-6">{data.product_title}</p>
            
            <a
              href={data.file_url}
              download={data.file_name}
              className="w-full h-12 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 mb-4"
            >
              <Download className="w-4 h-4" />
              تحميل الملف الآن
            </a>
            
            <p className="text-[11px] text-white/40">
              صالح حتى {new Date(data.expires_at).toLocaleDateString('ar-IQ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Change Password Form Component
function ChangePasswordForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور الجديدة غير متطابقتين');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('كلمة المرور الجديدة يجب أن تكون ٨ أحرف على الأقل');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get current user email for verification
      const { data: { user } } = await supabase.auth.getUser();
      
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });
      
      if (signInError) {
        setError('كلمة المرور الحالية غير صحيحة');
        setLoading(false);
        return;
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setError(updateError.message || 'فشل في تغيير كلمة المرور');
      } else {
        onSuccess();
      }
    } catch (e: any) {
      setError(e.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
          {error}
        </div>
      )}
      <div>
        <label className="block text-[12px] font-medium text-white/70 mb-1.5">كلمة المرور الحالية</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full h-10 px-3 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50"
          required
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium text-white/70 mb-1.5">كلمة المرور الجديدة</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full h-10 px-3 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50"
          required
          minLength={8}
        />
      </div>
      <div>
        <label className="block text-[12px] font-medium text-white/70 mb-1.5">تأكيد كلمة المرور</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full h-10 px-3 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] focus:outline-none focus:border-emerald-500/50"
          required
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-10 bg-white/5 hover:bg-white/10 text-white text-[13px] font-medium rounded-xl transition-all"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 h-10 bg-emerald-500 text-black text-[13px] font-bold rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50"
        >
          {loading ? 'جارٍ...' : 'حفظ'}
        </button>
      </div>
    </form>
  );
}

export default App;