const axios = require("axios");

const API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-04";

// GraphQL query to get products (first page)
const PRODUCTS_QUERY = `
query products($cursor: String) {
  products(first: 50, after: $cursor, query: "status:active") {
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        id
        title
        productType
        status
        media(first: 1) {
          nodes {
            ... on MediaImage {
              image {
                url
              }
            }
          }
        }
        variants(first: 1) {
          edges {
            node {
              sku
            }
          }
        }
      }
    }
  }
}
`;


async function graphqlRequest(shopDomain, accessToken, query, variables = {}) {
  const url = `https://${shopDomain}/admin/api/${API_VERSION}/graphql.json`;
  const res = await axios.post(
    url,
    { query, variables },
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      timeout: 120000,
    }
  );
  if (res.data.errors) throw new Error(JSON.stringify(res.data.errors));
  return res.data.data;
}

async function fetchAllProductsGraphql(shopDomain, accessToken, onPage = null) {
  let cursor = null;
  let all = [];
  while (true) {
    const data = await graphqlRequest(shopDomain, accessToken, PRODUCTS_QUERY, {
      cursor,
    });
    const products = data.products.edges.map((e) => e.node);
    if (onPage) await onPage(products);
    all.push(...products);
    if (!data.products.pageInfo.hasNextPage) break;
    cursor = data.products.pageInfo.endCursor;
  }
  return all;
}

module.exports = { fetchAllProductsGraphql, graphqlRequest };
