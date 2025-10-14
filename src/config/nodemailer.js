import nodemailer from "nodemailer"
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.HOST_MAILTRAP,
    port: process.env.PORT_MAILTRAP,
    auth: {
        user: process.env.USER_MAILTRAP,
        pass: process.env.PASS_MAILTRAP,
    }
})

const sendMailToRegister = (userMail, token) => {
    const mailOptions = {
        from: 'registro@museogustavorces.com',
        to: userMail,
        subject: "Museo Gustavo Orcés - Confirmación de cuenta 🏛️",
        html: `
            <h2>Bienvenido/a al Museo Gustavo Orcés</h2>
            <p>Gracias por registrarte en nuestra plataforma. Para activar tu cuenta, por favor haz clic en el siguiente enlace:</p>
            <p><a href="${process.env.URL_FRONTEND}/confirmar/${token}">Confirmar mi cuenta</a></p>
            <hr>
            <footer>El equipo del Museo Gustavo Orcés agradece tu interés en formar parte de nuestra comunidad educativa.</footer>
        `
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error al enviar el correo:", error)
        } else {
            console.log("Correo de confirmación enviado:", info.messageId)
        }
    })
}

const sendMailToRecoveryPassword = async (userMail, token) => {
    const info = await transporter.sendMail({
        from: 'soporte@museogustavorces.com',
        to: userMail,
        subject: "Museo Gustavo Orcés - Recuperación de contraseña 🔒",
        html: `
            <h2>Recuperación de Contraseña</h2>
            <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
            <p>Haz clic en el siguiente enlace para continuar:</p>
            <a href="${process.env.URL_FRONTEND}/reset/${token}">Restablecer mi contraseña</a>
            <hr>
            <footer>Si no solicitaste este cambio, ignora este mensaje. Gracias por usar la plataforma del Museo Gustavo Orcés.</footer>
        `
    })

    console.log("Correo de recuperación enviado:", info.messageId)
}

export {
    sendMailToRegister,
    sendMailToRecoveryPassword
}
