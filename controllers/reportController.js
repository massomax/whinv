const ExcelJS = require('exceljs');
const Warehouse = require('../models/Warehouse');
const { getProductModel } = require('./dynamicModels');

module.exports = {
  exportProductReportToExcel: async (req, res) => {
    try {
      const warehouses = await Warehouse.find();

      let allProducts = [];

      for (const warehouse of warehouses) {
        const ProductModel = await getProductModel(warehouse._id);

        const products = await ProductModel.find();

        allProducts = allProducts.concat(products);
      }

      const productReport = allProducts.reduce((acc, product) => {
        if (acc[product.name]) {
          acc[product.name] += product.quantity;
        } else {
          acc[product.name] = product.quantity;
        }
        return acc;
      }, {});

      const report = Object.keys(productReport).map(name => ({
        name,
        totalQuantity: productReport[name]
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Отчет по продуктам');

      worksheet.columns = [
        { header: 'Название позиции', key: 'name', width: 30 },
        { header: 'Общее количество', key: 'totalQuantity', width: 15 }
      ];

      worksheet.addRows(report);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=product_report.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
