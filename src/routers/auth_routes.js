router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    if (!req.user) {
      return res.status(403).json({ msg: "Correo no autorizado. Debes registrarte primero." });
    }

    const token = generarToken(req.user._id, "pasante");

    res.json({
      msg: "Login con Google exitoso",
      token,
      pasante: {
        id: req.user._id,
        nombre: req.user.nombre,
        email: req.user.email,
        fotoPerfil: req.user.fotoPerfil,
      },
    });
  }
);
