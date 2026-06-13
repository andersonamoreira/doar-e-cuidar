const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const BASE_URL = process.env.BASE_URL || 'https://doarecuidar.com.br';

const ESTILO = `font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;color:#1A1A16`;
const BTN    = `display:inline-block;background:#1B7A4A;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;margin:24px 0`;
const RODAPE = `color:#aaa;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:16px`;

async function enviarEmailReset(para, nome, token) {
  const link = `${BASE_URL}/?acao=resetar&token=${token}`;
  await transporter.sendMail({
    from: `"Doar é Cuidar" <${process.env.SMTP_USER}>`,
    to: para,
    subject: 'Redefinição de senha — Doar é Cuidar',
    html: `<div style="${ESTILO}">
      <h2 style="color:#1B7A4A">Redefinir sua senha</h2>
      <p>Olá, <strong>${nome}</strong>!</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
      <a href="${link}" style="${BTN}">Redefinir minha senha</a>
      <p style="color:#888;font-size:13px">O link expira em <strong>1 hora</strong>. Se você não solicitou isso, ignore este e-mail.</p>
      <div style="${RODAPE}">🌱 Doar é Cuidar — doarecuidar.com.br</div>
    </div>`,
  });
}

async function enviarEmailVerificacao(para, nome, token) {
  const link = `${BASE_URL}/?acao=verificar&token=${token}`;
  await transporter.sendMail({
    from: `"Doar é Cuidar" <${process.env.SMTP_USER}>`,
    to: para,
    subject: 'Confirme seu e-mail — Doar é Cuidar',
    html: `<div style="${ESTILO}">
      <h2 style="color:#1B7A4A">Confirme seu e-mail</h2>
      <p>Olá, <strong>${nome}</strong>! Bem-vindo(a) à plataforma Doar é Cuidar 🌱</p>
      <p>Clique no botão abaixo para confirmar seu endereço de e-mail e ativar sua conta:</p>
      <a href="${link}" style="${BTN}">Confirmar meu e-mail</a>
      <p style="color:#888;font-size:13px">O link expira em <strong>24 horas</strong>.</p>
      <div style="${RODAPE}">🌱 Doar é Cuidar — doarecuidar.com.br</div>
    </div>`,
  });
}

module.exports = { enviarEmailReset, enviarEmailVerificacao };
