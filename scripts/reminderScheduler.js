/**
 * CAMERAMAN PRO — Automatic Booking Reminder Scheduler
 * Runs via GitHub Actions every 15 minutes.
 *
 * Flow:
 *  1. Get current IST HH:mm and date.
 *  2. Load all studioSettings; skip if remindersEnabled !== true.
 *  3. Exact-match currentTime against timings[].
 *  4. For matched studios: resolve owner UID + active member UIDs.
 *  5. Fetch FCM tokens from notificationTokens where userId IN [uids].
 *  6. De-duplicate: skip if reminder already sent today for this studio+timing+booking.
 *  7. Send FCM multicast via Firebase Admin Messaging.
 *  8. Record sent reminders in remindersSent collection.
 */

import admin from 'firebase-admin';

// ─── 1. Init ─────────────────────────────────────────────────────────────────

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is missing.');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db        = admin.firestore();
const messaging = admin.messaging();

// ─── 2. Helpers ───────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD in Asia/Kolkata timezone */
function getISTDate(date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  return fmt.format(date); // en-CA gives YYYY-MM-DD natively
}

/** Returns HH:mm in Asia/Kolkata timezone (24-hour) */
function getISTTime(date) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  return fmt.format(date); // en-GB gives HH:mm natively
}

/** Returns h:mm AM/PM in Asia/Kolkata for display */
function getISTTimeDisplay(date) {
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

/** Split array into chunks of `size` (needed for Firestore `in` query limit of 30) */
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ─── 3. Main ──────────────────────────────────────────────────────────────────

async function runReminderScheduler() {
  const now = new Date();

  // Allow overriding time for testing: FORCE_IST_TIME=HH:mm  FORCE_IST_DATE=YYYY-MM-DD
  const todayStr    = process.env.FORCE_IST_DATE || getISTDate(now);
  const currentTime = process.env.FORCE_IST_TIME || getISTTime(now);

  console.log('═══════════════════════════════════════════════════════');
  console.log('📸  Cameraman Pro — Reminder Scheduler');
  console.log(`⏰  Current IST: ${currentTime}   📅 Date: ${todayStr}`);
  console.log('═══════════════════════════════════════════════════════');

  // ── 3a. Load all studioSettings ──────────────────────────────────────────
  const settingsSnap = await db.collection('studioSettings').get();
  console.log(`\n📋 Total studio settings documents: ${settingsSnap.size}`);

  const matchedStudios = [];

  settingsSnap.forEach(docSnap => {
    const data     = docSnap.data();
    const studioId = docSnap.id;

    // Skip if reminders not enabled
    if (data.remindersEnabled !== true) {
      console.log(`  ⏭️  Studio ${studioId}: remindersEnabled=false — skipped`);
      return;
    }

    // Skip if no timings
    if (!Array.isArray(data.timings) || data.timings.length === 0) {
      console.log(`  ⏭️  Studio ${studioId}: no timings configured — skipped`);
      return;
    }

    // Exact HH:mm match — Bug 2 Fix
    const matchedTiming = data.timings.find(t => t.trim() === currentTime);
    if (!matchedTiming) {
      return; // no match at this minute
    }

    console.log(`\n  ✅ Studio ${studioId} MATCHED`);
    console.log(`     timings[]: ${data.timings.join(', ')}`);
    console.log(`     matched:   ${matchedTiming}`);
    matchedStudios.push({ studioId, matchedTiming, ...data });
  });

  if (matchedStudios.length === 0) {
    console.log(`\nℹ️  No studios have a reminder scheduled at ${currentTime}. Exiting.`);
    return;
  }

  console.log(`\n🔔 ${matchedStudios.length} studio(s) matched for time ${currentTime}`);

  let grandTotalSent   = 0;
  let grandTotalFailed = 0;

  // ── 3b. Process each matched studio ──────────────────────────────────────
  for (const studio of matchedStudios) {
    const { studioId, matchedTiming } = studio;
    console.log(`\n${'─'.repeat(55)}`);
    console.log(`🏢 Processing Studio: ${studioId}  (timing: ${matchedTiming})`);

    // ── Get today's bookings for this studio ─────────────────────────────
    const bookingsSnap = await db.collection('bookings')
      .where('studioId', '==', studioId)
      .where('status', 'in', ['confirmed', 'pending'])
      .get();

    if (bookingsSnap.empty) {
      console.log(`  📭 No confirmed/pending bookings for this studio.`);
      continue;
    }

    const todaysBookings = [];
    bookingsSnap.forEach(docSnap => {
      const b           = docSnap.data();
      const mainDate    = b.eventDate?.toDate ? getISTDate(b.eventDate.toDate()) : null;
      const subDates    = (b.subEvents || []).map(se => se.date);

      if (mainDate === todayStr || subDates.includes(todayStr)) {
        todaysBookings.push({ id: docSnap.id, ...b });
      }
    });

    if (todaysBookings.length === 0) {
      console.log(`  📅 No bookings with events on ${todayStr}.`);
      continue;
    }
    console.log(`  📆 ${todaysBookings.length} booking(s) scheduled for today.`);

    // ── Resolve owner + active member UIDs (Bug 1 Fix) ──────────────────
    const studioDocSnap = await db.collection('studios').doc(studioId).get();
    const ownerId       = studioDocSnap.exists ? studioDocSnap.data().ownerId : null;

    const membersSnap = await db.collection('workspaces')
      .doc(studioId)
      .collection('members')
      .get();

    const recipientUids = new Set();

    if (ownerId) {
      recipientUids.add(ownerId);
      console.log(`  👑 Owner UID: ${ownerId}`);
    } else {
      console.warn(`  ⚠️  No ownerId found in studios/${studioId}`);
    }

    membersSnap.forEach(memberDoc => {
      const md   = memberDoc.data();
      const isActive = !md.status || md.status === 'active';
      if (isActive) {
        const uid = memberDoc.id || md.uid || md.userId;
        if (uid) {
          recipientUids.add(uid);
        }
      }
    });

    const userIds = Array.from(recipientUids);
    console.log(`  👥 Total recipients: ${userIds.length}  UIDs: [${userIds.join(', ')}]`);

    if (userIds.length === 0) {
      console.warn(`  ⚠️  No active recipients found. Skipping.`);
      continue;
    }

    // ── Fetch FCM tokens from notificationTokens by userId ───────────────
    const fcmTokens = [];
    const chunks    = chunkArray(userIds, 30); // Firestore `in` limit = 30

    for (const chunk of chunks) {
      const tokensSnap = await db.collection('notificationTokens')
        .where('userId', 'in', chunk)
        .get();

      tokensSnap.forEach(tDoc => {
        const td = tDoc.data();
        if (td.token) {
          fcmTokens.push(td.token);
        }
      });
    }

    const uniqueTokens = [...new Set(fcmTokens)];
    console.log(`  📱 FCM tokens fetched: ${uniqueTokens.length}`);

    if (uniqueTokens.length === 0) {
      console.warn(`  ⚠️  No FCM tokens found for these users. Skipping.`);
      continue;
    }

    // ── Process each booking ─────────────────────────────────────────────
    for (const booking of todaysBookings) {
      const bookingId  = booking.id;
      const clientName = booking.clientName  || 'Client';
      const eventType  = booking.eventType   || 'Event';
      const venue      = booking.venue       || 'Unknown Location';

      // Determine event display time
      let displayTime = 'TBD';
      const subEvent  = (booking.subEvents || []).find(se => se.date === todayStr);
      if (subEvent?.time) {
        displayTime = subEvent.time;
      } else if (booking.eventDate?.toDate) {
        displayTime = getISTTimeDisplay(booking.eventDate.toDate());
      }

      // ── Duplicate prevention ─────────────────────────────────────────
      // Key: date_studioId_timing_bookingId
      const historyId  = `${todayStr}_${studioId}_${matchedTiming}_${bookingId}`.replace(/:/g, '-');
      const historyRef = db.collection('remindersSent').doc(historyId);
      const historyDoc = await historyRef.get();

      if (historyDoc.exists) {
        console.log(`  🔁 Already sent: booking ${bookingId} at ${matchedTiming} today. Skipping.`);
        continue;
      }

      // ── Build notification body ──────────────────────────────────────
      const template = studio.customMessage ||
        'Aaj {clientName} ki {eventType} Booking hai.\n\n📍 Location: {location}\n🕒 Time: {eventTime}\n\nPlease prepare equipment.';

      const body = template
        .replace(/{clientName}/g, clientName)
        .replace(/{eventType}/g,  eventType)
        .replace(/{location}/g,   venue)
        .replace(/{eventTime}/g,  displayTime);

      console.log(`\n  📤 Sending reminder for booking: ${bookingId}`);
      console.log(`     Client : ${clientName}`);
      console.log(`     Event  : ${eventType} @ ${venue}`);
      console.log(`     Time   : ${displayTime}`);
      console.log(`     Tokens : ${uniqueTokens.length}`);

      // ── Send FCM multicast ───────────────────────────────────────────
      const message = {
        tokens: uniqueTokens,
        notification: {
          title: '📸 Cameraman Pro Reminder',
          body,
        },
        data: {
          type:      'reminder',
          bookingId: bookingId,
          studioId:  studioId,
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
      };

      try {
        const fcmResponse = await messaging.sendEachForMulticast(message);
        const sent   = fcmResponse.successCount;
        const failed = fcmResponse.failureCount;

        console.log(`  ✅ FCM result: ${sent} sent, ${failed} failed`);
        grandTotalSent   += sent;
        grandTotalFailed += failed;

        // ── Clean up stale tokens ────────────────────────────────────
        if (failed > 0) {
          const staleTokens = [];
          fcmResponse.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const code = resp.error?.code;
              console.warn(`     ⚠️  Token[${idx}] failed: ${code}`);
              if (
                code === 'messaging/invalid-registration-token' ||
                code === 'messaging/registration-token-not-registered'
              ) {
                staleTokens.push(uniqueTokens[idx]);
              }
            }
          });

          if (staleTokens.length > 0) {
            console.log(`  🧹 Removing ${staleTokens.length} stale token(s) from Firestore...`);
            for (const badToken of staleTokens) {
              const staleSnap = await db.collection('notificationTokens')
                .where('token', '==', badToken)
                .get();
              staleSnap.forEach(d => d.ref.delete());
            }
          }
        }

        // ── Record in remindersSent (duplicate guard) ────────────────
        await historyRef.set({
          studioId,
          bookingId,
          clientName,
          date:         todayStr,
          timing:       matchedTiming,
          tokensSent:   sent,
          tokensFailed: failed,
          sentAt:       admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`  💾 Recorded in remindersSent/${historyId}`);

      } catch (err) {
        console.error(`  ❌ FCM multicast error for booking ${bookingId}:`, err.message);
        grandTotalFailed += uniqueTokens.length;
      }
    }
  }

  console.log(`\n${'═'.repeat(55)}`);
  console.log(`🏁 Scheduler complete.`);
  console.log(`   ✅ Total FCM sent  : ${grandTotalSent}`);
  console.log(`   ❌ Total FCM failed: ${grandTotalFailed}`);
  console.log(`${'═'.repeat(55)}`);
}

runReminderScheduler().catch(err => {
  console.error('💀 Fatal Error:', err);
  process.exit(1);
});
