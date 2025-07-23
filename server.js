const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reportRoutes = require("./routes/reportRoutes");
const logRoutes = require("./routes/logRoutes");

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  // Разрешаем любой Origin
  res.header("Access-Control-Allow-Origin", "*");
  // Разрешаем любые методы
  res.header(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
  );
  // Разрешаем любые заголовки
  res.header("Access-Control-Allow-Headers", "*");

  // Если это preflight-запрос — сразу высылаем HTTP 200
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});
app.options("*", cors());

mongoose
  .connect(
    "mongodb+srv://massocode:WwA5UXZdOkSUcLEh@cluster0.84rdk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {}
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use("/auth", authRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/logs", logRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
