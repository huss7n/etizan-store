import { useState, useEffect } from 'react';
import { MessageCircle, X, Phone, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export function WhatsAppButton({ 
  phoneNumber = '',
  message = 'السلام عليكم، أحتاج إلى المساعدة',
  position = 'bottom-left'
}: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    // Fetch settings to get WhatsApp number
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  const whatsappNumber = phoneNumber || settings?.whatsapp_number || settings?.support_phone;
  
  if (!whatsappNumber) return null;

  // Clean number (remove non-digits)
  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 sm:right-6' 
    : 'left-4 sm:left-6';

  return (
    <>
      {/* Main Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-50 w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-2xl flex items-center justify-center transition-shadow`}
        aria-label="WhatsApp"
      >
        {isOpen ? (
          <X className="w-6 h-6 sm:w-7 sm:h-7" />
        ) : (
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
        )}
      </motion.button>

      {/* Popup Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-20 sm:bottom-24 ${positionClasses} z-40 bg-white rounded-2xl shadow-2xl p-4 w-72`}
          >
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">الدعم عبر الواتساب</h4>
                <p className="text-xs text-gray-500">نجوبك في خدمتك مجاناً</p>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">دردشة واتساب</span>
              </a>
              
              <a
                href={`tel:${whatsappNumber}`}
                className="flex items-center gap-3 p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Phone className="w-5 h-5" />
                <span className="font-medium">اتصال هاتفي</span>
              </a>
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">
              الاستجابة أسرع عبر الواتساب
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default WhatsAppButton;