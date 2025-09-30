require("dotenv").config();

const express = require("express");

const cookieSession = require("cookie-session");

const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const storeRoutes = require("./routes/storeRoutes");
const productRoutes = require("./routes/productRoutes");

const {
  authWithRefresh,
  requireRole,
} = require("./middleware/AuthMiddlewares");

const app = express();

app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.SESSION_SECURE === "true",
    sameSite: "strict",
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL, // your Vite frontend
    credentials: true, // allow cookies
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use(authWithRefresh);

app.use("/api/stores", storeRoutes);

app.use("/api/products", productRoutes);

app.use("/api/admin", requireRole("ADMIN"), adminRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
