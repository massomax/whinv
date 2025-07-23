const axios = require('axios');
const FormData = require('form-data');

class ImgurService {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.imgur.com/3/',
      headers: {
        Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
      },
    });
  }

  async uploadImage(buffer, filename) {
    const formData = new FormData();
    formData.append('image', buffer, {
      filename: filename,
      contentType: this.getContentType(filename)
    });

    try {
      const response = await this.client.post('image', formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync()
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.data.error || 'Ошибка загрузки');
      }

      return {
        url: response.data.data.link,
        deleteHash: response.data.data.deletehash
      };
    } catch (error) {
      const errMessage = error.response?.data?.data?.error || error.message;
      throw new Error(`Ошибка загрузки: ${errMessage}`);
    }
  }

  

  getContentType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp'
    };
    return types[ext] || 'application/octet-stream';
  }

  async deleteImage(deleteHash) {
    try {
      await this.client.delete(`image/${deleteHash}`);
    } catch (error) {
      console.error('Ошибка удаления:', error.response?.data?.data?.error);
    }
  }
  async uploadImageFromUrl(imageUrl) {
    try {
      const response = await this.client.post('image', {
        image: imageUrl,
        type: 'url'
      });

      if (!response.data.success) {
        throw new Error(response.data.data.error || 'Ошибка загрузки');
      }

      return {
        url: response.data.data.link,
        deleteHash: response.data.data.deletehash
      };
    } catch (error) {
      const errMessage = error.response?.data?.data?.error || error.message;
      throw new Error(`Ошибка загрузки: ${errMessage}`);
    }
  }
}

module.exports = new ImgurService();