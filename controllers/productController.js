const { 
  getProductModel,
  getOrderModel,
  getLogModel 
} = require('./dynamicModels');
const imgurService = require('../services/imgur');
const ExcelJS = require('exceljs');
const csv = require('csv-parser');

module.exports = {
  createProduct: async (req, res) => {
    let photoData = null;
    try {
      const { name, quantity, criticalValue, category } = req.body;
      const warehouseId = req.params.warehouseId;
  
      if (!name || !quantity || !criticalValue) {
        return res.status(400).json({ error: 'Не все обязательные поля заполнены (name, quantity, criticalValue)' });
      }
  
      const Product = await getProductModel(warehouseId);
      
      if (req.file) {
        try {
          photoData = await imgurService.uploadImage(
            req.file.buffer,
            req.file.originalname
          );
        } catch (uploadError) {
          return res.status(500).json({ 
            error: `Ошибка загрузки фото: ${uploadError.message}` 
          });
        }
      }
  
      const product = new Product({
        name,
        quantity,
        criticalValue,
        category,
        ...(photoData && { photo: photoData })
      });
  
      await product.save();
  
      if (photoData) {
        product._imgurDeleteHash = photoData.deleteHash;
      }
  
      res.status(201).json(product);
    } catch (err) {
      if (photoData?.deleteHash) {
        await imgurService.deleteImage(photoData.deleteHash)
          .catch(e => console.error('Ошибка отката фото:', e));
      }
      
      res.status(500).json({ 
        error: err.message || 'Ошибка при создании товара' 
      });
    }
  },

  getProducts: async (req, res) => {
    try {
      const Product = await getProductModel(req.params.warehouseId);
      const products = await Product.find();
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateProduct: async (req, res) => {
    try {
      const Product = await getProductModel(req.params.warehouseId);
      const product = await Product.findById(req.params.id);
  
      if (!product) {
        return res.status(404).json({ error: 'Товар не найден' });
      }
  
      if (req.file) {
        const { url, deleteHash } = await imgurService.uploadImage(
          req.file.buffer,
          req.file.originalname
        );
  
        if (product.photo?.deleteHash) {
          await imgurService.deleteImage(product.photo.deleteHash);
        }
  
        product.photo = { url, deleteHash };
      }
  
      Object.assign(product, req.body);
      await product.save();
  
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteProduct: async (req, res) => {
    try {
      const Product = await getProductModel(req.params.warehouseId);
      const product = await Product.findByIdAndDelete(req.params.id);
      
      if (!product) return res.status(404).json({ error: 'Товар не найден' });
  
      if (product.photo?.deleteHash) {
        try {
          await imgurService.deleteImage(product.photo.deleteHash);
        } catch (error) {
          console.error('Ошибка удаления фото:', error.message);
        }
      }
  
      res.json({ message: 'Товар удален' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateQuantity: async (req, res) => {
    try {
      const { action, value, warehouseId } = req.body;
      const { id } = req.params;
      
      const ProductModel = await getProductModel(warehouseId);
      const OrderModel = await getOrderModel(warehouseId);
      const LogModel = await getLogModel(warehouseId);
  
      const product = await ProductModel.findById(id);
      if (!product) return res.status(404).json({ error: 'Товар не найден' });
  
      const oldQuantity = product.quantity;
      let newQuantity = product.quantity;
      
      switch (action) {
        case 'set': newQuantity = value; break;
        case 'add': newQuantity += value; break;
        case 'sub': newQuantity -= value; break;
        default: return res.status(400).json({ error: 'Неверное действие' });
      }
  
      if (newQuantity < 0) {
        return res.status(400).json({ error: 'Количество не может быть отрицательным' });
      }
  
      product.quantity = newQuantity;
      await product.save();
  
      // Логирование
      try {
        await new LogModel({
          warehouse: warehouseId,
          productId: product._id,
          action,
          oldQuantity,
          newQuantity,
          user: req.user.id
        }).save();
      } catch (logError) {
        console.error('Ошибка записи лога:', logError);
      }
  
      // Обработка заказов
      if (newQuantity <= product.criticalValue) {
        const existingOrder = await OrderModel.findOne({ 
          productName: product.name, 
          warehouse: warehouseId 
        });
  
        if (!existingOrder) {
          await new OrderModel({
            productName: product.name,
            warehouse: warehouseId,
            status: 'Ожидает Заказа'
          }).save();
        }
      } else {
        await OrderModel.deleteMany({ 
          productName: product.name, 
          warehouse: warehouseId 
        });
      }
  
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  uploadProducts: async (req, res) => {
    try {
      const { warehouseId } = req.params;
      const { updateType } = req.body; // 'add' или 'replace'
      const ProductModel = await getProductModel(warehouseId);
      
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
      }
  
      const results = [];
      const errors = [];
      
      if (req.file.mimetype === 'text/csv') {
        await new Promise((resolve, reject) => {
          const bufferStream = require('stream').Readable.from(req.file.buffer);
          
          bufferStream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', resolve)
            .on('error', reject);
        });
      }
      else if (req.file.mimetype.includes('spreadsheetml')) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        
        const worksheet = workbook.worksheets[0];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return; 
          
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[worksheet.getRow(1).getCell(colNumber).value] = cell.value;
          });
          results.push(rowData);
        });
      } else {
        return res.status(400).json({ error: 'Неподдерживаемый формат файла' });
      }
  
      for (const [index, row] of results.entries()) {
        try {
          if (!row.name || row.quantity === undefined || row.quantity === null || row.quantity === '') {
            throw new Error('Отсутствуют обязательные поля (name, quantity)');
          }
  
          let photoUrl = '';
          const rawPhotoValue = row.photoUrl;
          if (typeof rawPhotoValue === 'object' && rawPhotoValue.hyperlink) {
            photoUrl = rawPhotoValue.hyperlink;
          } else if (typeof rawPhotoValue === 'string') {
            photoUrl = rawPhotoValue.trim();
          }
  
          const category = row.category ? row.category.trim() : 'Общая';
  
          let product = await ProductModel.findOne({ name: row.name.trim() });
          let photoData = null;
          if (photoUrl) {
            try {
              photoData = await imgurService.uploadImageFromUrl(photoUrl);
            } catch (uploadError) {
              throw new Error(`Ошибка загрузки фото: ${uploadError.message}`);
            }
          }
  
          if (product) {
            if (updateType === 'replace') {
              product.quantity = Number(row.quantity);
              product.category = category;
              if (photoUrl) {
                if (product.photo?.deleteHash) {
                  await imgurService.deleteImage(product.photo.deleteHash);
                }
                product.photo = photoData;
              }
            } else {
              product.quantity += Number(row.quantity);
            }
          } else {
            product = new ProductModel({
              name: row.name.trim(),
              quantity: Number(row.quantity),
              criticalValue: row.criticalValue || 0,
              category,
              ...(photoData && { photo: photoData })
            });
          }
  
          await product.save();
        } catch (err) {
          errors.push({
            line: index + 1,
            error: err.message,
            data: row
          });
        }
      }
  
      res.json({
        message: `Успешно обработано ${results.length - errors.length} записей`,
        errors
      });
  
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  

  downloadProducts: async (req, res) => {
    try {
      const { warehouseId } = req.params;
      const ProductModel = await getProductModel(warehouseId);
      const products = await ProductModel.find().lean();

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Продукты');
      
      worksheet.columns = [
        { header: 'Название', key: 'name', width: 30 },
        { header: 'Количество', key: 'quantity', width: 15 },
        { header: 'Критический уровень', key: 'criticalValue', width: 20 },
        { header: 'Ссылка на фото', key: 'photoUrl', width: 50 }
      ];

      worksheet.addRows(products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        criticalValue: p.criticalValue,
        photoUrl: p.photo?.url || 'Нет фото'
      })));

      // Делаем ссылки кликабельными
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        
        const photoCell = row.getCell('photoUrl');
        if (photoCell.value && photoCell.value !== 'Нет фото') {
          photoCell.value = {
            text: photoCell.value,
            hyperlink: photoCell.value
          };
          photoCell.font = { color: { argb: 'FF0000FF' }, underline: true };
        }
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=products_${warehouseId}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
