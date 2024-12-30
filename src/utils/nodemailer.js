import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_APP_USERNAME,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export const sendMailFunction = async (mail, token) => {
    const tokenLink = `${process.env.BACKEND_URL}/api/v1/users/token/verify/${token}`;
    const mailOptions = {
        from: process.env.GMAIL_APP_USERNAME,
        to: mail,
        subject: "Verification Of Chat App Account",
        text: "Verification",
        html: `
                <h1>Verify Your Mail</h1>
                <a>${tokenLink}</a>
                <p>Click On the above link, If it is unclickable , Copy and paste it in your browser. Or Mark this mail not as spam.</p>
              `,
    };

    try {
        const res = await transporter.sendMail(mailOptions);
        return res;
    } catch (error) {
        return error;
    }
}
