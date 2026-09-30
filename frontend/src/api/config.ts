// Add runtime config type definition
declare global {
  interface Window {
    RUNTIME_CONFIG?: {
      API_URL: string;
    };
  }
}

const getBaseUrl = () => {
  // First check runtime configuration (from runtime-config.js)
  if (typeof window !== 'undefined' && window.RUNTIME_CONFIG?.API_URL) {
    console.log('Using runtime config API_URL:', window.RUNTIME_CONFIG.API_URL);
    return window.RUNTIME_CONFIG.API_URL;
  }
  
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  const protocolToUse = protocol.includes('https') ? 'https' : 'http';
  const codespaceName = process.env.CODESPACE_NAME;
  
  if (codespaceName) {
    const url = `https://${codespaceName}-3000.app.github.dev`;
    console.log(`Using Codespace-derived URL: ${url}`);
    return url;
  }

  const url = `${protocolToUse}://localhost:3000`;
  console.log(`Using default URL: ${url}`);
  return url;
};

export const API_BASE_URL = getBaseUrl();

export const api = {
  baseURL: API_BASE_URL,
  endpoints: {
    products: '/api/products',
    suppliers: '/api/suppliers',
    orders: '/api/orders',
    branches: '/api/branches',
    headquarters: '/api/headquarters',
    deliveries: '/api/deliveries',
    orderDetails: '/api/order-details',
    orderDetailDeliveries: '/api/order-detail-deliveries',
    productReviews: '/api/product-reviews',
  },
};
