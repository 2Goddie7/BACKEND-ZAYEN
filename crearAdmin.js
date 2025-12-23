import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Administrador from './src/models/Administrador.js';
import { sendMailToRegister } from './src/config/nodemailer.js';

dotenv.config();

async function crearAdministrador() {

  console.log("URI MONGO → ", process.env.MONGODB_URI_ATLAS)
  try {
    if (!process.env.MONGODB_URI_ATLAS) {
      console.error('Configura la URI de Mongo en tu .env');
    }

    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI_ATLAS);
    console.log('Conectado a MongoDB!');

    const admin = new Administrador({
      nombre: 'Administrador Principal Prueba',
      email: 'admin.prueba@museoprueba.com',
      rol: 'administrador',
      celular: '0999999998',
      confirmEmail: true,
    });
  
    admin.password = await admin.encrypPassword('PruebaPassword123');
    admin.token = admin.crearToken();
    await admin.save();
    
    /*try {
      await sendMailToRegister(admin.email, admin.token);
      console.log('Administrador creado exitosamente');
      console.log('Revisa tu correo enviado a:', admin.email," para confirmar y activar tu cuenta.");
    } catch (emailError) {
      console.warn('Administrador creado, pero hubo un error al enviar el correo:');
      console.warn(emailError.message);
    }
*/
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  } catch (error) {
    console.error('Error al intentar crear el administrador:', error);
    process.exit(1);
  }
}

crearAdministrador();