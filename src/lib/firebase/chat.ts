import {
  collection,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./client";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Timestamp | null;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  updatedAt: Timestamp | null;
  status: string;
}

export async function getOrCreateConversation(
  userId1: string,
  userId2: string,
  participantNames?: Record<string, string>
): Promise<string> {
  // Check if conversation already exists between these two users
  const convRef = collection(db, "conversations");
  const q = query(
    convRef,
    where("participants", "array-contains", userId1)
  );
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (
      data.participants.length === 2 &&
      data.participants.includes(userId2)
    ) {
      return docSnap.id;
    }
  }

  // Create new conversation
  const newConv = await addDoc(convRef, {
    participants: [userId1, userId2],
    participantNames: participantNames || {},
    updatedAt: serverTimestamp(),
    status: "active",
  });

  return newConv.id;
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
) {
  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );
  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: serverTimestamp(),
  });

  // Update conversation timestamp
  const convDoc = doc(db, "conversations", conversationId);
  await setDoc(convDoc, { updatedAt: serverTimestamp() }, { merge: true });
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
) {
  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Message[];
    callback(messages);
  });
}

export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
) {
  const convRef = collection(db, "conversations");
  const q = query(
    convRef,
    where("participants", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Conversation[];
    callback(conversations);
  }, (error) => {
    console.error("subscribeToConversations error:", error);
    callback([]);
  });
}
