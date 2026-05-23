import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

interface Product {
  id: number;
  title: string;
  price: number;
  discount_percent: number;
  cover_image: string;
  category: string;
  is_active?: boolean;
}

interface RelatedProductsProps {
  currentProductId: number;
  category: string;
  onProductClick: (product: Product) => void;
}

export function RelatedProducts({ currentProductId, category, onProductClick }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedProducts();
  }, [currentProductId, category]);

  const fetchRelatedProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      
      // Filter: same category, exclude current product, limit to 3
      const related = data
        .filter((p: Product) => 
          p.category === category && 
          p.id !== currentProductId &&
          p.is_active !== false
        )
        .slice(0, 3);
      
      setProducts(related);
    } catch (err) {
      console.error('Failed to fetch related products:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-12">
        <h3 className="text-xl font-bold text-white mb-4">منتجات ذات صلة</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" />
        منتجات ذات صلة
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {products.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/20 transition-all"
            onClick={() => onProductClick(product)}
          >
            <div className="aspect-video relative overflow-hidden">
              <img
                src={product.cover_image}
                alt={product.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
              {product.discount_percent > 0 && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                  خصم {product.discount_percent}%
                </div>
              )}
            </div>
            <div className="p-4">
              <h4 className="text-white font-medium line-clamp-1 mb-2">{product.title}</h4>
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold">
                  {Math.round(product.price * (1 - product.discount_percent / 100)).toLocaleString()} د.ع
                </span>
                <button className="text-white/60 hover:text-white flex items-center gap-1 text-sm">
                  عرض
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default RelatedProducts;