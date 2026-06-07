import admin from 'firebase-admin';

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

function formatInIST(date) {
    if (!date) return null;
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    const parts = formatter.formatToParts(date);
    const partsMap = {};
    parts.forEach(p => {
        partsMap[p.type] = p.value;
    });
    return `${partsMap.year}-${partsMap.month}-${partsMap.day}`;
}

function formatTimeInIST(date) {
    if (!date) return null;
    return date.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

async function sendReminders() {
  console.log("🚀 Starting OneSignal Booking Reminders check...");
  
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  const partsMap = {};
  parts.forEach(p => {
      partsMap[p.type] = p.value;
  });
  
  const todayStr = `${partsMap.year}-${partsMap.month}-${partsMap.day}`;
  const currentTimeStr = `${partsMap.hour}:${partsMap.minute}`;
  const currentHourStr = `${partsMap.hour}:00`;

  console.log(`⏰ Current Time (IST): ${currentTimeStr}`);
  console.log(`📅 Search Date: ${todayStr}`);
  console.log(`🔔 Matching timings: ${currentTimeStr} or ${currentHourStr}`);

  // 2. Fetch studios that have reminders scheduled for this time
  const settingsSnapshot = await db.collection("studioSettings").get();
  const activeStudios = [];
  
  settingsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.remindersEnabled && data.timings) {
          // Match if any saved timing is within 5 minutes of current time
          const currentTotalMins = Number(partsMap.hour) * 60 + Number(partsMap.minute);
          const isMatch = data.timings.some(t => {
              const [h, m] = t.split(':').map(Number);
              const savedTotalMins = h * 60 + (m || 0);
              return Math.abs(currentTotalMins - savedTotalMins) <= 5;
          });
          if (isMatch) {
              activeStudios.push({ studioId: doc.id, ...data });
              console.log(`  ✅ Studio ${doc.id} matched! Timings: ${data.timings.join(', ')}`);
          }
      }
  });

  if (activeStudios.length === 0) {
      console.log("ℹ️ No studios scheduled for reminders at this time.");
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
          const mainDateStr = formatInIST(mainDate);
          const subEventDates = booking.subEvents?.map(se => se.date) || [];
          
          if (mainDateStr === todayStr || subEventDates.includes(todayStr)) {
              todaysBookings.push({ id: doc.id, ...booking });
          }
      });

      if (todaysBookings.length === 0) {
          console.log(`  No events scheduled for today.`);
          continue;
      }

      // Fetch the studio owner and active workspace members from Firestore
      console.log(`  Fetching recipients for studio ${studio.studioId}...`);
      const studioDoc = await db.collection("studios").doc(studio.studioId).get();
      const ownerId = studioDoc.exists ? studioDoc.data().ownerId : null;

      const membersSnap = await db.collection("workspaces")
          .doc(studio.studioId)
          .collection("members")
          .get();

      const recipientUids = new Set();
      if (ownerId) {
          recipientUids.add(ownerId);
      }

      membersSnap.forEach(memberDoc => {
          const memberData = memberDoc.data();
          // Target active members
          if (!memberData.status || memberData.status === 'active') {
              const mUid = memberDoc.id || memberData.uid || memberData.userId;
              if (mUid) {
                  recipientUids.add(mUid);
              }
          }
      });

      const externalUserIds = Array.from(recipientUids);
      console.log(`  👥 Recipients (Firebase UIDs): ${externalUserIds.join(', ')}`);
      
      if (externalUserIds.length === 0) {
          console.log(`  ⚠️ No active recipients (owner/members) found. Skipping notifications.`);
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
              displayTime = formatTimeInIST(booking.eventDate.toDate());
          }

          let customBody = studio.customMessage || "Aaj {clientName} ki {eventType} Booking hai.\n\n📍 Location: {location}\n🕒 Time: {eventTime}\n\nPlease prepare equipment.";
          customBody = customBody.replace(/{clientName}/g, clientName)
                                 .replace(/{eventType}/g, eventType)
                                 .replace(/{location}/g, venue)
                                 .replace(/{eventTime}/g, displayTime);

          const notificationPayload = {
              app_id: ONESIGNAL_APP_ID,
              include_external_user_ids: externalUserIds,
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
