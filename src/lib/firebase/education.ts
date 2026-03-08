import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./client";

export interface EducationVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  videoUrl: string; // YouTube or Vimeo URL
  thumbnail: string; // emoji or image URL
  order: number;
}

export interface VideoProgress {
  videoId: string;
  completed: boolean;
  completedAt: any;
}

export async function getEducationContent(): Promise<EducationVideo[]> {
  const ref = collection(db, "education_content");
  const q = query(ref, orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as EducationVideo[];
}

export async function getUserVideoProgress(userId: string): Promise<Record<string, boolean>> {
  const ref = collection(db, "user_video_progress", userId, "videos");
  const snapshot = await getDocs(ref);
  const progress: Record<string, boolean> = {};
  snapshot.docs.forEach((d) => {
    const data = d.data();
    if (data.completed) {
      progress[d.id] = true;
    }
  });
  return progress;
}

export async function markVideoComplete(userId: string, videoId: string) {
  const ref = doc(db, "user_video_progress", userId, "videos", videoId);
  await setDoc(ref, {
    completed: true,
    completedAt: serverTimestamp(),
  });
}

export async function markVideoIncomplete(userId: string, videoId: string) {
  const ref = doc(db, "user_video_progress", userId, "videos", videoId);
  await deleteDoc(ref);
}
