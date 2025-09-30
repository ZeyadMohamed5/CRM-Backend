const express = require("express");
const router = express.Router();

// Controllers
const { addStore } = require("../controllers/store.controllers");

const {
  createRule,
  updateRule,
  listRules,
  deleteRule,
} = require("../controllers/productTypeRule.controllers");

// ----- Store Management -----
router.post("/stores", addStore); // POST /admin/stores

// ----- Product Type Rules -----
router.post("/rules", createRule); // POST /admin/rules
router.put("/rules/:id", updateRule); // PUT /admin/rules/:id
router.get("/rules", listRules); // GET /admin/rules
router.delete("/rules/:id", deleteRule); // DELETE /admin/rules/:id

module.exports = router;
