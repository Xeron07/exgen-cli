const path = require("path");
const { writeFile } = require("../fsHelpers");

function createAppFile(root, useTS) {
  const fileName = useTS ? "app.ts" : "app.js";
  const content = `
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import productRoutes from "./api/routes/product.routes";
import { connectToDatabase } from "./database/connection";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/products", productRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: "Server Error" });
});

connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
  });
});
  `;
  writeFile(path.join(root, "src", fileName), content);
}
module.exports = { createAppFile };