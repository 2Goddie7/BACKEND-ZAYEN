import app from "./server.js";
import connection from "./config/database.js";

// Conectar a la base de datos
connection();

// Iniciar el servidor
app.listen(app.get("port"), () => {
  console.log(`Servidor corriendo en el puerto ${app.get("port")}`);
});
