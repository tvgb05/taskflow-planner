import { timingSafeEqual } from "node:crypto";

import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

function authorized(request: Request) {
  const expected = process.env.NODEMAILER_INTERNAL_KEY;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!expected || !supplied) return false;

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);

  return expectedBuffer.length === suppliedBuffer.length
    && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

function emailContent(to: string, code: string) {
  return {
    subject: "Your TaskFlow Planner verification code",
    text: `Your TaskFlow Planner verification code is ${code}. It expires in 10 minutes.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h1 style="font-size:20px;margin:0 0 12px">Verify your TaskFlow Planner email</h1>
      <p>This code was requested for <strong>${escapeHtml(to)}</strong>.</p>
      <p>Enter this verification code in TaskFlow Planner:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:18px 0">${escapeHtml(code)}</p>
      <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
    </div>`,
  };
}

async function sendWithResend(to: string, content: ReturnType<typeof emailContent>) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    throw new Error("Resend is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], ...content }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Resend API returned HTTP ${response.status}: ${body.slice(0, 300)}`);
  }

  const result = JSON.parse(body) as { id?: string };
  return result.id;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let payload: { to?: unknown; code?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 422 });
  }

  const to = typeof payload.to === "string" ? payload.to.trim() : "";
  const code = String(payload.code ?? "");
  if (!/^\S+@\S+\.\S+$/.test(to) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ message: "Invalid recipient or OTP." }, { status: 422 });
  }

  const content = emailContent(to, code);

  if (process.env.RESEND_API_KEY) {
    try {
      const messageId = await sendWithResend(to, content);
      return NextResponse.json({ messageId, provider: "resend" });
    } catch (error) {
      console.error("Resend OTP delivery failed:", error instanceof Error ? error.message : "Unknown error");
      return NextResponse.json({ message: "Unable to deliver the OTP email." }, { status: 502 });
    }
  }

  const smtpUser = process.env.NODEMAILER_USER;
  const smtpPassword = process.env.NODEMAILER_APP_PASSWORD;
  if (!smtpUser || !smtpPassword) {
    return NextResponse.json({ message: "Email delivery is not configured." }, { status: 503 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.NODEMAILER_HOST || "smtp.gmail.com",
      port: Number(process.env.NODEMAILER_PORT || 465),
      secure: process.env.NODEMAILER_SECURE !== "false",
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      auth: { user: smtpUser, pass: smtpPassword },
    });
    const info = await transporter.sendMail({
      from: `"${process.env.NODEMAILER_FROM_NAME || "TaskFlow Planner"}" <${smtpUser}>`,
      to,
      ...content,
    });

    return NextResponse.json({ messageId: info.messageId, provider: "smtp" });
  } catch (error) {
    console.error("Nodemailer OTP delivery failed:", error instanceof Error ? error.message : "Unknown error");

    return NextResponse.json({ message: "Unable to deliver the OTP email." }, { status: 502 });
  }
}
