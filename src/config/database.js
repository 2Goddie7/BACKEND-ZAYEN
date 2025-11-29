import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

mongoose.set("strictQuery", true);

if(!process.env.MONGODB_URI_ATLAS){
  console.error('Configura la URI de Mongo en tu .env');
}

const connection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI_ATLAS);
    console.log("Base de datos conectada exitosamente");
  } catch (error) {
    console.log(error);
  }
};

export default connection;