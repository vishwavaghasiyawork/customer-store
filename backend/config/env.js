import dotenv from 'dotenv';

dotenv.config();

export const config = {
  shopify: {
    storeUrl: process.env.SHOPIFY_STORE_URL,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    apiVersion: '2026-04',
    
    // config.shopify.graphQLEndpoint
    graphQLEndpoint: (storeUrl) => {
      const cleanStoreUrl = storeUrl
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');

  // 'latest' automatically becomes 2026-04 for this store, per your headers
  return `https://${cleanStoreUrl}/admin/api/2026-04/graphql.json`;
},
  },
  server: {
    port: process.env.PORT || 3001
  }
};

export const validateConfig = () => {
  if (!config.shopify.storeUrl || !config.shopify.accessToken) {
    throw new Error('Missing required Shopify configuration. Please check your .env file.');
  }
};
