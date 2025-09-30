const { encrypt } = require("../lib/crypto");
const { fetchAllProductsGraphql } = require("../services/shopifyServices");
const prisma = require("../prisma/client");

async function addStore(req, res) {
  try {
    const { shopDomain, name, accessToken, apiSecret } = req.body;
    if (!shopDomain || !accessToken) {
      return res.status(400).send("missing shopDomain or accessToken");
    }

    const tokenEnc = encrypt(accessToken);
    const secretEnc = apiSecret ? encrypt(apiSecret) : null;

    // Upsert store (create if new, update if existing)
    const store = await prisma.store.upsert({
      where: { shopDomain },
      create: {
        shopDomain,
        name,
        accessToken: tokenEnc,
        apiSecret: secretEnc,
      },
      update: {
        name,
        accessToken: tokenEnc,
        apiSecret: secretEnc,
      },
    });

    // Fetch and upsert products directly (sync mode)
    try {
      await fetchAllProductsGraphql(shopDomain, accessToken, async (page) => {
        for (const p of page) {
          await prisma.product.upsert({
            where: {
              shopifyId_storeId: {
                shopifyId: String(p.id),
                storeId: store.id,
              },
            },
            create: {
              shopifyId: String(p.id),
              storeId: store.id,
              title: p.title || "",
              productType: p.productType || null,
              imgUrl: p.media?.nodes?.[0]?.image?.url || null, // map image URL
              isPod: false,
            },
            update: {
              title: p.title || "",
              productType: p.productType || null,
              imgUrl: p.media?.nodes?.[0]?.image?.url || null, // update image URL
            },
          });
        }
      });
    } catch (err) {
      console.error("product sync failed", err?.message || err);
      return res.status(500).send("failed to sync products");
    }

    return res.status(201).json({ id: store.id, shopDomain: store.shopDomain });
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
}

async function listStores(req, res) {
  try {
    const stores = await prisma.store.findMany({
      select: {
        storeId: true,
        name: true,
        shopDomain: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(stores);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
}

module.exports = { addStore, listStores };
