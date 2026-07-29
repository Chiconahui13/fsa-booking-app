import { google } from "googleapis";

const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const calendarId = process.env.GOOGLE_CALENDAR_ID;

if (!serviceAccountKey) {
  throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_KEY");
}

if (!calendarId) {
  throw new Error("Missing GOOGLE_CALENDAR_ID");
}

const keyData = JSON.parse(serviceAccountKey);
const auth = new google.auth.JWT({
  email: keyData.client_email,
  key: keyData.private_key,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const calendar = google.calendar({ version: "v3", auth });

export async function createCalendarEvent({
  summary,
  description,
  start,
  end,
}: {
  summary: string;
  description: string;
  start: string;
  end: string;
}) {
  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: start },
      end: { dateTime: end },
      reminders: { useDefault: true },
    },
  });

  if (!response.data.id) {
    throw new Error("Failed to create Google Calendar event");
  }

  return response.data.id;
}

export async function updateCalendarEvent({
  eventId,
  summary,
  description,
  start,
  end,
}: {
  eventId: string;
  summary: string;
  description: string;
  start: string;
  end: string;
}) {
  const response = await calendar.events.update({
    calendarId,
    eventId,
    requestBody: {
      summary,
      description,
      start: { dateTime: start },
      end: { dateTime: end },
    },
  });

  if (!response.data.id) {
    throw new Error("Failed to update Google Calendar event");
  }

  return response.data.id;
}

export async function deleteCalendarEvent(eventId: string) {
  await calendar.events.delete({
    calendarId,
    eventId,
  });
}
