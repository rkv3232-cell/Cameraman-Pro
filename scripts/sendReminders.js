import admin from 'firebase-admin';
import { format } from 'date-fns';
import fetch from 'node-fetch';

/**
 * CAMERAMAN PRO - Automated Booking Reminders (OneSignal Version)
 * This script runs in GitHub Actions to send notifications via OneSignal.
 */

// 1. Initialize Firebase Admin (for Firestore access)
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("❌ Error: FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "dace33a2-e5b8-4316-a91f-dfb37046113e";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

if (!ONESIGNAL_REST_API_KEY) {
    console.error("❌ Error: ONESIGNAL_REST_API_KEY environment variable is missing.");
    process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function sendReminders() {
  console.log("🚀 Starting OneSignal Booking Reminders check...");
  
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  
  const currentHourStr = format(istNow, "HH:00");
  const todayStr = format(istNow, 'yyyy-MM-dd');

  console.log(`⏰ Current Time (IST): ${format(istNow, "HH:mm")}`);
  console.log(`📅 Search Date: ${todayStr}`);
  console.log(`🔔 Target Hour: ${currentHourStr}`);

  // 2. Fetch studios that have reminders scheduled for this hour
  const settingsSnapshot = await db.collection("studioSettings").get();
  const activeStudios = [];
  
  settingsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.remindersEnabled && data.timings && data.timings.includes(currentHourStr)) {
          activeStudios.push({ studioId: doc.id, ...data });
      }
  });

  if (activeStudios.length === 0) {
      console.log("ℹ️ No studios scheduled for reminders at this hour.");
      return;
  }

  // 3. Process each studio
  for (const studio of activeStudios) {
      console.log(`\n--- Studio: ${studio.studioId} ---`);
      
      const bookingsSnapshot = await db.collection("bookings")
          .where("studioId", "==", studio.studioId)
          .where("status", "in", ["confirmed", "pending"])
          .get();

      if (bookingsSnapshot.empty) {
          console.log(`  No active bookings found.`);
          continue;
      }

      const todaysBookings = [];
      bookingsSnapshot.forEach(doc => {
          const booking = doc.data();
          const mainDate = booking.eventDate?.toDate();
          const mainDateStr = mainDate ? format(mainDate, 'yyyy-MM-dd') : null;
          const subEventDates = booking.subEvents?.map(se => se.date) || [];
          
          if (mainDateStr === todayStr || subEventDates.includes(todayStr)) {
              todaysBookings.push({ id: doc.id, ...booking });
          }
      });

      if (todaysBookings.length === 0) {
          console.log(`  No events scheduled for today.`);
          continue;
      }

      // 4. Send Reminders via OneSignal API
      for (const booking of todaysBookings) {
          const clientName = booking.clientName || 'Client';
          const eventType = booking.eventType || 'Event';
          const venue = booking.venue || 'Unknown Location';
          
          let displayTime = 'TBD';
          const subEvent = booking.subEvents?.find(se => se.date === todayStr);
          if (subEvent) {
              displayTime = subEvent.time;
          } else if (booking.eventDate) {
              displayTime = format(booking.eventDate.toDate(), "hh:mm a");
          }

          let customBody = studio.customMessage || "Aaj {clientName} ki {eventType} Booking hai.\n\n📍 Location: {location}\n🕒 Time: {eventTime}\n\nPlease prepare equipment.";
          customBody = customBody.replace(/{clientName}/g, clientName)
                                 .replace(/{eventType}/g, eventType)
                                 .replace(/{location}/g, venue)
                                 .replace(/{eventTime}/g, displayTime);

          const notificationPayload = {
              app_id: ONESIGNAL_APP_ID,
              include_external_user_ids: [studio.studioId], // We linked OneSignal User to Firebase UID
              contents: { "en": customBody },
              headings: { "en": "📸 Cameraman Pro Reminder" },
              url: `https://cameraman-pro-2aa2b.web.app/bookings`
          };

          try {
              const response = await fetch('https://onesignal.com/api/v1/notifications', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
                  },
                  body: JSON.stringify(notificationPayload)
              });
              const result = await response.json();
              console.log(`  ✅ OneSignal sent for ${clientName}:`, result);
          } catch (e) {
              console.error(`  ❌ Failed to send OneSignal notification:`, e.message);
          }
      }
  }
  
  console.log("\n🏁 Reminder check complete.");
}

sendReminders().catch(err => {
    console.error("💀 Fatal Error:", err);
    process.exit(1);
});
