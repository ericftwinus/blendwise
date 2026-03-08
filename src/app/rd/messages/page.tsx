"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Video } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  subscribeToConversations,
  Conversation,
} from "@/lib/firebase/chat";
import ChatWindow from "@/components/ChatWindow";
import VideoRoom from "@/components/VideoRoom";

export default function RdMessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const unsub = subscribeToConversations(user.uid, (convs) => {
      setConversations(convs);
      setLoading(false);
      if (!selectedConvId && convs.length > 0) {
        setSelectedConvId(convs[0].id);
      }
    });

    return () => unsub();
  }, [user?.uid]);

  if (authLoading || loading) {
    return (
      <div className="text-center py-16 text-gray-400">
        Loading messages...
      </div>
    );
  }

  if (!user) return null;

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const remoteUserId = selectedConv?.participants.find(
    (p) => p !== user.uid
  );
  const remoteName = remoteUserId
    ? selectedConv?.participantNames?.[remoteUserId] || "Patient"
    : "Patient";

  function getOtherName(conv: Conversation) {
    const otherId = conv.participants.find((p) => p !== user!.uid);
    return otherId
      ? conv.participantNames?.[otherId] || "Patient"
      : "Patient";
  }

  if (showVideo && remoteUserId) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <VideoRoom
          currentUserId={user.uid}
          remoteUserId={remoteUserId}
          remoteName={remoteName}
          onClose={() => setShowVideo(false)}
        />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          No conversations yet
        </h2>
        <p className="text-gray-500 text-sm">
          Visit a patient&apos;s profile and open the Messages tab to start a conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Conversation list */}
      <div className="w-72 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConvId(conv.id)}
              className={`w-full px-4 py-3 text-left border-b border-gray-50 transition ${
                selectedConvId === conv.id
                  ? "bg-accent-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {getOtherName(conv)}
              </p>
              {conv.updatedAt && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {conv.updatedAt.toDate().toLocaleDateString()}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedConvId ? (
          <>
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {remoteName}
              </span>
              {remoteUserId && (
                <button
                  onClick={() => setShowVideo(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-accent-600 text-white rounded-lg font-medium hover:bg-accent-700 transition"
                >
                  <Video className="w-3.5 h-3.5" />
                  Video Call
                </button>
              )}
            </div>
            <div className="flex-1 min-h-0">
              <ChatWindow
                conversationId={selectedConvId}
                currentUserId={user.uid}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
