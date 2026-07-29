export async function sendEmailNotification({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  console.log("Email notification would be sent to", to, subject, body);
}

export async function sendSlackNotification({
  webhookUrl,
  message,
}: {
  webhookUrl: string;
  message: string;
}) {
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });
}
