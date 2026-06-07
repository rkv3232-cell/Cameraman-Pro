import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, serverTimestamp, onSnapshot, Unsubscribe,
  runTransaction, limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import type { StaffMember, StaffEvent, AttendanceRecord, StaffNotification } from '../types/staff';

// ─── Employee ID Generator ───────────────────────────────────────────────────
export const generateEmployeeId = async (studioId: string): Promise<string> => {
  const counterRef = doc(db, 'studios', studioId, 'counters', 'employeeId');
  
  let newId = 'CP-1001';
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? (snap.data().value as number) : 1000;
    const next = current + 1;
    tx.set(counterRef, { value: next });
    newId = `CP-${next}`;
  });
  return newId;
};

// ─── Staff CRUD ───────────────────────────────────────────────────────────────
export const addStaffMember = async (
  studioId: string,
  data: Omit<StaffMember, 'id' | 'employeeId' | 'createdAt'>
): Promise<string> => {
  const employeeId = await generateEmployeeId(studioId);
  const docRef = await addDoc(collection(db, 'staff'), {
    ...data,
    employeeId,
    studioId,
    idCardEnabled: true,
    isVerified: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateStaffMember = async (
  staffId: string,
  data: Partial<StaffMember>
): Promise<void> => {
  const ref = doc(db, 'staff', staffId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
};

export const deleteStaffMember = async (staffId: string): Promise<void> => {
  await deleteDoc(doc(db, 'staff', staffId));
};

export const getStaffMember = async (staffId: string): Promise<StaffMember | null> => {
  const snap = await getDoc(doc(db, 'staff', staffId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as StaffMember;
};

export const getStaffByEmployeeId = async (employeeId: string): Promise<StaffMember | null> => {
  const q = query(collection(db, 'staff'), where('employeeId', '==', employeeId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as StaffMember;
};

// No orderBy → no composite index needed. Sort in-memory instead.
export const subscribeToStaff = (
  studioId: string,
  callback: (staff: StaffMember[]) => void
): Unsubscribe => {
  if (!studioId) {
    console.warn('subscribeToStaff called without studioId');
    return () => {};
  }
  const q = query(
    collection(db, 'staff'),
    where('studioId', '==', studioId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const members = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffMember));
      // Sort newest first in memory
      members.sort((a, b) => {
        const tA = (a.createdAt as any)?.toMillis?.() ?? 0;
        const tB = (b.createdAt as any)?.toMillis?.() ?? 0;
        return tB - tA;
      });
      callback(members);
    },
    (error) => {
      console.error('subscribeToStaff error:', error);
    }
  );
};

// ─── Photo Upload ─────────────────────────────────────────────────────────────
export const uploadStaffPhoto = async (
  staffId: string,
  file: File
): Promise<string> => {
  const storageRef = ref(storage, `staff-photos/${staffId}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// ─── Events ───────────────────────────────────────────────────────────────────
export const addStaffEvent = async (
  data: Omit<StaffEvent, 'id' | 'createdAt'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'staffEvents'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  // Update lastEventDate on the staff member
  await updateDoc(doc(db, 'staff', data.staffId), {
    lastEventDate: data.eventDate,
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

// No orderBy → no composite index needed.
export const getStaffEvents = async (staffId: string): Promise<StaffEvent[]> => {
  const q = query(
    collection(db, 'staffEvents'),
    where('staffId', '==', staffId)
  );
  const snap = await getDocs(q);
  const events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffEvent));
  return events.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
};

// No orderBy → no composite index needed.
export const subscribeToStaffEvents = (
  staffId: string,
  callback: (events: StaffEvent[]) => void
): Unsubscribe => {
  if (!staffId) {
    console.warn('subscribeToStaffEvents called without staffId');
    return () => {};
  }
  const q = query(
    collection(db, 'staffEvents'),
    where('staffId', '==', staffId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const events = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffEvent));
      callback(events.sort((a, b) => b.eventDate.localeCompare(a.eventDate)));
    },
    (error) => {
      console.error('subscribeToStaffEvents error:', error);
    }
  );
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const recordAttendance = async (
  data: Omit<AttendanceRecord, 'id' | 'createdAt'>
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'attendance'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// No orderBy → no composite index needed.
export const getStaffAttendance = async (
  staffId: string,
  month?: string // "YYYY-MM"
): Promise<AttendanceRecord[]> => {
  const q = query(
    collection(db, 'attendance'),
    where('staffId', '==', staffId)
  );
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
  all.sort((a, b) => b.date.localeCompare(a.date));
  if (month) return all.filter((r) => r.date.startsWith(month));
  return all;
};

export const getStudioAttendance = async (
  studioId: string,
  month?: string // "YYYY-MM"
): Promise<AttendanceRecord[]> => {
  const q = query(
    collection(db, 'attendance'),
    where('studioId', '==', studioId)
  );
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
  all.sort((a, b) => b.date.localeCompare(a.date));
  if (month) return all.filter((r) => r.date.startsWith(month));
  return all;
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const createNotification = async (
  data: Omit<StaffNotification, 'id' | 'createdAt' | 'isRead'>
): Promise<void> => {
  await addDoc(collection(db, 'staffNotifications'), {
    ...data,
    isRead: false,
    createdAt: serverTimestamp(),
  });
};

// No orderBy → no composite index needed.
export const subscribeToNotifications = (
  staffId: string,
  callback: (notes: StaffNotification[]) => void
): Unsubscribe => {
  if (!staffId) {
    console.warn('subscribeToNotifications called without staffId');
    return () => {};
  }
  const q = query(
    collection(db, 'staffNotifications'),
    where('staffId', '==', staffId),
    limit(20)
  );
  return onSnapshot(
    q,
    (snap) => {
      const notes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffNotification));
      notes.sort((a, b) => {
        const tA = (a.createdAt as any)?.toMillis?.() ?? 0;
        const tB = (b.createdAt as any)?.toMillis?.() ?? 0;
        return tB - tA;
      });
      callback(notes);
    },
    (error) => {
      console.error('subscribeToNotifications error:', error);
    }
  );
};

export const markNotificationRead = async (notifId: string): Promise<void> => {
  await updateDoc(doc(db, 'staffNotifications', notifId), { isRead: true });
};

// ─── Analytics helpers ────────────────────────────────────────────────────────
export const getStaffAnalytics = async (studioId: string) => {
  const [staffSnap, eventSnap, attendSnap] = await Promise.all([
    getDocs(query(collection(db, 'staff'), where('studioId', '==', studioId))),
    getDocs(query(collection(db, 'staffEvents'), where('studioId', '==', studioId))),
    getDocs(query(collection(db, 'attendance'), where('studioId', '==', studioId))),
  ]);

  const staff = staffSnap.docs.map((d) => d.data() as StaffMember);

  return {
    total: staff.length,
    active: staff.filter((s) => s.status === 'active').length,
    busy: staff.filter((s) => s.status === 'busy').length,
    onEvent: staff.filter((s) => s.status === 'on_event').length,
    offline: staff.filter((s) => s.status === 'offline').length,
    suspended: staff.filter((s) => s.status === 'suspended').length,
    totalEvents: eventSnap.size,
    totalAttendance: attendSnap.size,
    byRole: staff.reduce((acc, s) => {
      acc[s.role] = (acc[s.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
};
