import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase/client";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export async function createCall(
  callerId: string,
  calleeId: string,
  localStream: MediaStream
): Promise<{ pc: RTCPeerConnection; callId: string }> {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  // Add local tracks to connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Create call document
  const callDoc = doc(collection(db, "calls"));
  const callId = callDoc.id;

  // Collect ICE candidates
  const callerCandidatesRef = collection(
    db,
    "calls",
    callId,
    "callerCandidates"
  );

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addDoc(callerCandidatesRef, event.candidate.toJSON());
    }
  };

  // Create and set offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await setDoc(callDoc, {
    offer: { type: offer.type, sdp: offer.sdp },
    callerId,
    calleeId,
    status: "ringing",
    createdAt: serverTimestamp(),
  });

  // Listen for answer
  onSnapshot(callDoc, (snapshot) => {
    const data = snapshot.data();
    if (data?.answer && !pc.currentRemoteDescription) {
      pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  });

  // Listen for callee ICE candidates
  const calleeCandidatesRef = collection(
    db,
    "calls",
    callId,
    "calleeCandidates"
  );
  onSnapshot(calleeCandidatesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      }
    });
  });

  return { pc, callId };
}

export async function answerCall(
  callId: string,
  localStream: MediaStream
): Promise<RTCPeerConnection> {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  // Add local tracks
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  const callDoc = doc(db, "calls", callId);
  const callData = (await getDoc(callDoc)).data();

  if (!callData?.offer) {
    throw new Error("No offer found for this call");
  }

  // Collect ICE candidates
  const calleeCandidatesRef = collection(
    db,
    "calls",
    callId,
    "calleeCandidates"
  );

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addDoc(calleeCandidatesRef, event.candidate.toJSON());
    }
  };

  // Set remote description (offer) and create answer
  await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  await updateDoc(callDoc, {
    answer: { type: answer.type, sdp: answer.sdp },
    status: "connected",
  });

  // Listen for caller ICE candidates
  const callerCandidatesRef = collection(
    db,
    "calls",
    callId,
    "callerCandidates"
  );
  onSnapshot(callerCandidatesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      }
    });
  });

  return pc;
}

export async function endCall(
  callId: string,
  pc: RTCPeerConnection,
  localStream: MediaStream
) {
  // Stop all local tracks
  localStream.getTracks().forEach((track) => track.stop());

  // Close the peer connection
  pc.close();

  // Update Firestore
  const callDoc = doc(db, "calls", callId);
  await updateDoc(callDoc, { status: "ended" });
}

export function subscribeToCallStatus(
  callId: string,
  callback: (status: string) => void
) {
  const callDoc = doc(db, "calls", callId);
  return onSnapshot(callDoc, (snapshot) => {
    const data = snapshot.data();
    if (data?.status) {
      callback(data.status);
    }
  });
}

export function subscribeToIncomingCalls(
  userId: string,
  callback: (call: { callId: string; callerId: string }) => void
) {
  const callsRef = collection(db, "calls");
  const q = query(
    callsRef,
    where("calleeId", "==", userId),
    where("status", "==", "ringing")
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        callback({ callId: change.doc.id, callerId: data.callerId });
      }
    });
  }, (error) => {
    console.error("subscribeToIncomingCalls error:", error);
  });
}
