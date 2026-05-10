import admin from 'firebase-admin';
import { format } from 'date-fns';

/**
 * CAMERAMAN PRO - Automated Booking Reminders
 * This script runs in GitHub Actions to send notifications on the Free Plan.
 */

// 1. Initialize Firebase Admin
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("❌ Error: FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

async function sendReminders() {
  console.log("🚀 Starting Booking Reminders check...");
  
  // Calculate current time in IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffset);
  
  const currentHourStr = format(istNow, "HH:00");
  const todayStr = format(istNow, 'yyyy-MM-dd');
  
  // For Firestore Timestamp queries
  const startOfDay = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());
  const endOfDay = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate(), 23, 59, 59, 999);

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

  console.log(`✅ Found ${activeStudios.length} studios scheduled for this hour.`);

  // 3. Process each studio
  for (const studio of activeStudios) {
      console.log(`\n--- Studio: ${studio.studioId} ---`);
      
      // Get all active bookings for this studio
      const bookingsSnapshot = await db.collection("bookings")
          .where("studioId", "==", studio.studioId)
          .where("status", "in", ["confirmed", "pending"])
          .get();

      if (bookingsSnapshot.empty) {
          console.log(`  No active bookings found.`);
          continue;
      }

      // Filter bookings that have an event TODAY (Main or Sub-event)
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

      // Get FCM tokens for the studio owner/staff
      const tokensSnapshot = await db.collection("notificationTokens")
          .where("userId", "==", studio.studioId)
          .get();
          
      if (tokensSnapshot.empty) {
          console.log(`  ⚠️ No notification tokens found. Cannot send messages.`);
          continue;
      }

      const tokens = [];
      tokensSnapshot.forEach(doc => tokens.push(doc.data().token));

      // 4. Send Reminders for each booking found
      for (const booking of todaysBookings) {
          const clientName = booking.clientName || 'Client';
          const eventType = booking.eventType || 'Event';
          const venue = booking.venue || 'Unknown Location';
          
          // Determine the time to show (Sub-event time takes priority)
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

          try {
              const response = await messaging.sendEachForMulticast({
                  notification: {
                      title: "📸 Cameraman Pro Reminder",
                      body: customBody,
                  },
                  tokens: tokens,
                  android: { 
                      priority: "high",
                      notification: {
                          channelId: "booking_reminders",
                          priority: "max"
                      }
                  },
              });
              console.log(`  ✅ Notification sent for ${clientName} (${eventType}): ${response.successCount} ok, ${response.failureCount} fail.`);
          } catch (e) {
              console.error(`  ❌ Failed to send notification:`, e.message);
          }
      }
  }
  
  console.log("\n🏁 Reminder check complete.");
}

sendReminders().catch(err => {
    console.error("💀 Fatal Error:", err);
    process.exit(1);
});
