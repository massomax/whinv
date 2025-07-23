const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const productController = require("../controllers/productController");

router.post(
  "/:warehouseId",
  authMiddleware(["Менеджер"]),
  upload.single("photo"),
  productController.createProduct
);

router.get("/:warehouseId", authMiddleware([]), productController.getProducts);

router.put(
  "/:warehouseId/:id",
  authMiddleware(["Менеджер", "Сотрудник"]),
  upload.single("photo"),
  productController.updateProduct
);

router.delete(
  "/:warehouseId/:id",
  authMiddleware(["Менеджер"]),
  productController.deleteProduct
);

router.patch(
  "/:id/quantity",
  authMiddleware(["Менеджер", "Сотрудник"]),
  productController.updateQuantity
);

router.post(
  "/upload/:warehouseId",
  authMiddleware(["Менеджер"]),
  upload.single("file"),
  productController.uploadProducts
);

router.get(
  "/:warehouseId/download",
  authMiddleware(["Менеджер", "Сотрудник"]),
  productController.downloadProducts
);

module.exports = router;
