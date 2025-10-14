import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import Pasante from "../models/Pasante.js";

dotenv.config();

const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${backendUrl}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // Verificar si ya existe en la base de datos
        const pasante = await Pasante.findOne({ email });

        if (!pasante) {
          // Bloquear acceso si el correo no está registrado
          return done(null, false, { message: "Correo no autorizado. Contacta al administrador." });
        }

        // Si existe, dejarlo pasar
        return done(null, pasante);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const pasante = await Pasante.findById(id);
  done(null, pasante);
});

export default passport;
