// LocalStorage utilities for preserving checkout state
// Critical for Iraqi customers who switch to banking apps during payment

const STORAGE_KEYS = {
  CART: 'etizan_cart',
  CHECKOUT_DATA: 'etizan_checkout_data',
  CHECKOUT_STEP: 'etizan_checkout_step',
  CHECKOUT_TIMESTAMP: 'etizan_checkout_timestamp'
};

// Types
export interface CheckoutData {
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod?: string;
  couponCode?: string;
  discountAmount?: number;
}

// Save checkout data
export function saveCheckoutData(data: CheckoutData) {
  try {
    const payload = {
      ...data,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.CHECKOUT_DATA, JSON.stringify(payload));
    localStorage.setItem(STORAGE_KEYS.CHECKOUT_TIMESTAMP, Date.now().toString());
    return true;
  } catch (e) {
    console.error('Failed to save checkout data:', e);
    return false;
  }
}

// Get checkout data
export function getCheckoutData(): (CheckoutData & { savedAt: string }) | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHECKOUT_DATA);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    
    // Check if data is expired (24 hours)
    const timestamp = localStorage.getItem(STORAGE_KEYS.CHECKOUT_TIMESTAMP);
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age > 24 * 60 * 60 * 1000) {
        clearCheckoutData();
        return null;
      }
    }
    
    return parsed;
  } catch (e) {
    console.error('Failed to get checkout data:', e);
    return null;
  }
}

// Save checkout step
export function saveCheckoutStep(step: number) {
  try {
    localStorage.setItem(STORAGE_KEYS.CHECKOUT_STEP, step.toString());
  } catch (e) {
    console.error('Failed to save checkout step:', e);
  }
}

// Get checkout step
export function getCheckoutStep(): number {
  try {
    const step = localStorage.getItem(STORAGE_KEYS.CHECKOUT_STEP);
    return step ? parseInt(step) : 1;
  } catch (e) {
    return 1;
  }
}

// Clear all checkout data
export function clearCheckoutData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CHECKOUT_DATA);
    localStorage.removeItem(STORAGE_KEYS.CHECKOUT_STEP);
    localStorage.removeItem(STORAGE_KEYS.CHECKOUT_TIMESTAMP);
    localStorage.removeItem(STORAGE_KEYS.CART);
  } catch (e) {
    console.error('Failed to clear checkout data:', e);
  }
}

// Save cart items
export function saveCart(cart: any[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  } catch (e) {
    console.error('Failed to save cart:', e);
  }
}

// Get cart items
export function getCart(): any[] {
  try {
    const cart = localStorage.getItem(STORAGE_KEYS.CART);
    return cart ? JSON.parse(cart) : [];
  } catch (e) {
    return [];
  }
}

// Listen for storage changes (for cross-tab sync)
export function onStorageChange(callback: (key: string, value: any) => void) {
  const handler = (e: StorageEvent) => {
    if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
      callback(e.key, e.newValue);
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}