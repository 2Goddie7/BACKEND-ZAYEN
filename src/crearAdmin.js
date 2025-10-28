import mongoose from 'mongoose';
import Administrador from './models/Administrador.js'; 

async function crearAdministrador() {
  try {
    await mongoose.connect(process.env.MONGODB_URI_ATLAS);

    // Crea una instancia del modelo
    const admin = new Administrador({
      nombre: 'Diego Mullo',
      email: 'diego.mullo@epn.edu.ec',
      rol: 'administrador',
      celular:'0999999998',
    });
  
    // Cifra la contraseña usando el método del esquema
    admin.password = await admin.encrypPassword('123456789');

    // Guarda en la base de datos
    await admin.save();

    console.log('Administrador creado exitosamente');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creando administrador:', error);
  }
}

crearAdministrador();
// Commit