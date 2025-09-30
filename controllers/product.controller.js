const prisma = require("../prisma/client");

async function listProducts(req, res) {
  try {
    const { page = 1, limit = 20, storeId } = req.query;

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * take;

    let where = {};

    if (req.session.role === "USER") {
      // Store user can only see their own store’s products
      if (!req.session.storeId) {
        return res
          .status(403)
          .json({ error: "No store assigned to this user" });
      }
      where.storeId = req.session.storeId;
    } else {
      // Everyone else (ADMIN + other roles) → full access, optional store filter
      if (storeId) {
        where.storeId = storeId;
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          store: { select: { id: true, name: true, shopDomain: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      page: parseInt(page),
      limit: take,
      total,
      pages: Math.ceil(total / take),
      data: products,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
}

module.exports = { listProducts };
