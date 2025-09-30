const prisma = require("../prisma/client");

// Create new product type rule
async function createRule(req, res) {
  try {
    const { name, isPod } = req.body;
    if (!name) return res.status(400).send("Missing rule name");

    const rule = await prisma.productTypeRule.create({
      data: {
        name: name.trim(),
        isPod: !!isPod,
      },
    });

    // Re-classify existing products matching this type
    await prisma.product.updateMany({
      where: { productType: rule.name },
      data: { isPod: rule.isPod },
    });

    return res.status(201).json(rule);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
}

// Update existing rule
async function updateRule(req, res) {
  try {
    const { id } = req.params;
    const { name, isPod } = req.body;

    const rule = await prisma.productTypeRule.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(typeof isPod === "boolean" && { isPod }),
      },
    });

    // Re-classify products if rule changed
    await prisma.product.updateMany({
      where: { productType: rule.name },
      data: { isPod: rule.isPod },
    });

    return res.json(rule);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
}

// List rules
async function listRules(req, res) {
  try {
    const rules = await prisma.productTypeRule.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(rules);
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
}

// Optional: Delete rule
async function deleteRule(req, res) {
  try {
    const { id } = req.params;

    const rule = await prisma.productTypeRule.delete({
      where: { id },
    });

    // When deleting a rule, you might want to reset products to default (stock)
    await prisma.product.updateMany({
      where: { productType: rule.name },
      data: { isPod: false },
    });

    return res.json({ message: "Rule deleted", rule });
  } catch (err) {
    console.error(err);
    return res.status(500).send("server error");
  }
}

module.exports = {
  createRule,
  updateRule,
  listRules,
  deleteRule,
};
