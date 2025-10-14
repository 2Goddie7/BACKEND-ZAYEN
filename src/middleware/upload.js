import multer from 'multer'
import { CloudinaryStorage } from '@fluidjs/multer-cloudinary'
import cloudinary from '../config/cloudinary.js'

// Configuración de almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: 'museo_orces',
      resource_type: file.mimetype.startsWith('audio') ? 'video' : 'image', 
      allowed_formats: ['jpg', 'png', 'jpeg', 'mp3', 'wav', 'webm', 'mp4', 'ogg']
    }
  }
})

const upload = multer({ storage })

export default upload
