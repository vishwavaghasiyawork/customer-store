import axios from 'axios';
import { config } from '../config/env.js';

class ShopifyService {
  constructor() {
    const graphQLEndpoint = config.shopify.graphQLEndpoint(
      config.shopify.storeUrl
    );

    if (!graphQLEndpoint) {
      throw new Error('Shopify GraphQL endpoint is not configured.');
    }

    if (!config.shopify.accessToken) {
      throw new Error('Shopify Admin access token is not configured.');
    }
    
    this.client = axios.create({
      baseURL: graphQLEndpoint, // e.g. https://aurevia-dev-store.myshopify.com/admin/api/latest/graphql.json
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',              // IMPORTANT
        'X-Shopify-Access-Token': config.shopify.accessToken,
      },
    });
  }

  async createCustomer(customerInput) {
    const mutation = `
      mutation CreateCustomer($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer {
            id
            firstName
            lastName
            defaultEmailAddress {
              emailAddress
            }
            defaultPhoneNumber {
              phoneNumber
            }
            tags
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    try {
      const response = await this.client.post('', {
        query: mutation,
        variables: {
          input: customerInput,
        },
      });

      console.log({accessTokens: config.shopify.accessToken});

      console.log('HTTP status:', response.status);
      console.log('HTTP headers:', response.headers);
      console.log('GraphQL data:', JSON.stringify(response.data, null, 2));

      const { data, errors } = response.data || {};

      if (errors && errors.length > 0) {
        throw new Error(
          `GraphQL errors: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      if (!data || !data.customerCreate) {
        throw new Error(
          `Unexpected Shopify response structure: ${JSON.stringify(
            response.data
          )}`
        );
      }

      const result = data.customerCreate;

      if (result.userErrors && result.userErrors.length > 0) {
        throw new Error(
          `Shopify validation errors: ${result.userErrors
            .map((e) => `${e.field?.join('.') || 'field'}: ${e.message}`)
            .join(', ')}`
        );
      }

      return result.customer;
    } catch (error) {
      if (error.response) {
        console.error('HTTP error status:', error.response.status);
        console.error('HTTP error headers:', error.response.headers);
        console.error('HTTP error data:', error.response.data);
        throw new Error(
          `Shopify API error: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        );
      }
      throw error;
    }
  }
}

export default new ShopifyService();