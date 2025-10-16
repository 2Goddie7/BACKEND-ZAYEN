import multer from 'multer';
import { CloudinaryStorage } from '@fluidjs/multer-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Configuración de almacenamiento en Cloudinary para fotos de perfil
const storageProfile = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'museo_orces/perfiles',
      resource_type: 'image',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 500, height: 500, crop: 'limit' }]
    };
  }
});

// Configuración de almacenamiento en Cloudinary para archivos generales
const storageGeneral = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'museo_orces/archivos',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'mp3', 'wav', 'mp4']
    };
  }
});

// Filtro para validar solo imágenes
const fileFilterImages = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

// Middleware para subir foto de perfil
export const uploadProfile = multer({
  storage: storageProfile,
  fileFilter: fileFilterImages,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

// Middleware para subir archivos generales
export const uploadGeneral = multer({
  storage: storageGeneral,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

export default uploadProfile;