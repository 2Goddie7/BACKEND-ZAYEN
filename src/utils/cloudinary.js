import cloudinary from '../config/cloudinary.js'

export const deleteFileFromCloudinary = async (public_id, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(public_id, { resource_type: resourceType })
    return result
  } catch (error) {
    console.error('Error al eliminar archivo de Cloudinary:', error)
    throw error
  }
}
