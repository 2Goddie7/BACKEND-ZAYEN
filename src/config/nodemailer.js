import nodemailer from "nodemailer"
import dotenv from 'dotenv'

dotenv.config()

const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
    }
})

// Verificar conexion con el servicio de correo
transporter.verify(function (error, success) {
    if (error) {
        console.log('Error conectando a SendGrid:', error);
    } else {
        console.log('SendGrid está listo para enviar correos');
    }
});

const sendMailToRegister = (userMail, token) => {
    const mailOptions = {
        from: '"Museo Gustavo Orcés" <registro@museogustavoorces.online>',
        to: userMail,
        subject: "Museo Gustavo Orcés - Confirmación de cuenta 🏛️",
        text: `Bienvenido/a al Museo Gustavo Orcés. Para activar tu cuenta, ingresa al siguiente enlace: ${process.env.URL_FRONTEND}/confirmar/${token}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Bienvenido/a al Museo Gustavo Orcés</h2>
                <p>Gracias por registrarte en nuestra plataforma. Para activar tu cuenta, por favor haz clic en el siguiente enlace:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.URL_FRONTEND}/confirmar/${token}" 
                       style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Confirmar mi cuenta
                    </a>
                </div>
                <p style="color: #7f8c8d; font-size: 12px;">
                    Si no solicitaste esta cuenta, puedes ignorar este correo.
                </p>
                <hr style="border: 1px solid #ecf0f1; margin: 20px 0;">
                <footer style="color: #95a5a6; font-size: 12px;">
                    El equipo del Museo Gustavo Orcés agradece tu interés en formar parte de nuestra comunidad educativa.
                </footer>
            </div>
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
    const mailOptions = {
        from: '"Museo Gustavo Orcés" <soporte@museogustavoorces.online>',
        to: userMail,
        subject: "Museo Gustavo Orcés - Recuperación de contraseña 🔑",
        text: `Hemos recibido una solicitud para restablecer tu contraseña. Ingresa al siguiente enlace: ${process.env.URL_FRONTEND}/reset/${token}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Recuperación de Contraseña</h2>
                <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
                <p>Haz clic en el siguiente enlace para continuar:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.URL_FRONTEND}/reset/${token}"
                       style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Restablecer mi contraseña
                    </a>
                </div>
                <p style="color: #e74c3c; font-weight: bold;">
                    Este enlace expirará en 24 horas.
                </p>
                <p style="color: #7f8c8d; font-size: 12px;">
                    Si no solicitaste este cambio, ignora este mensaje y tu contraseña permanecerá sin cambios.
                </p>
                <hr style="border: 1px solid #ecf0f1; margin: 20px 0;">
                <footer style="color: #95a5a6; font-size: 12px;">
                    Gracias por usar la plataforma del Museo Gustavo Orcés.
                </footer>
            </div>
        `
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Correo de recuperación enviado:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error al enviar correo de recuperación:", error);
        throw error;
    }
}

export {
    sendMailToRegister,
    sendMailToRecoveryPassword
}