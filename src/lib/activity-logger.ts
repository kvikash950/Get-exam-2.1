
'use client';

import { collection, serverTimestamp, addDoc, Firestore } from 'firebase/firestore';

export async function logActivity(
  db: Firestore, 
  centerId: string, 
  centerName: string, 
  action: string, 
  details: string
) {
  if (!db) return;
  try {
    const logsRef = collection(db, 'activity_logs');
    await addDoc(logsRef, {
      centerId,
      centerName,
      action,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
