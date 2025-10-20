import { Router } from "express";
import passport from "../config/passport-google.js";
import { generarToken } from "../middleware/jwt.js";

const router = Router();

// ==================== AUTENTICACIÓN CON GOOGLE (Pasantes) ====================

// Ruta para iniciar autenticación con Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false
  })
);

// Callback de Google OAuth
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    session: false, 
    failureRedirect: `${process.env.URL_FRONTEND}/login?error=unauthorized` 
  }),
  (req, res) => {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.URL_FRONTEND}/login?error=unauthorized`);
      }

      // Generar token JWT
      const token = generarToken(req.user._id, "pasante");

      // Redirigir al frontend con el token
      res.redirect(`${process.env.URL_FRONTEND}/auth/callback?token=${token}`);
    } catch (error) {
      console.error("Error en callback de Google:", error);
      res.redirect(`${process.env.URL_FRONTEND}/login?error=server`);
    }
  }
);

// Ruta alternativa para respuesta JSON (útil para testing)
router.get(
  "/google/callback/json",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    if (!req.user) {
      return res.status(403).json({ 
        msg: "Correo no autorizado. Debes registrarte primero como pasante." 
      });
    }

    const token = generarToken(req.user._id, "pasante");

    res.json({
      msg: "Login con Google exitoso",
      token,
      pasante: {
        id: req.user._id,
        nombre: req.user.nombre,
        email: req.user.email,
        facultad: req.user.facultad,
        horasDePasantia: req.user.horasDePasantia,
        celular: req.user.celular,
        fotoPerfil: req.user.fotoPerfil
      }
    });
  }
);

export default router;