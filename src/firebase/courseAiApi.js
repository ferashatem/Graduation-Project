import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebaseConfig";

const AI_CONVERSATIONS_COLLECTION = "ai_conversations";

// Use a deterministic id so each professor gets one conversation per course.
export const buildCourseAiConversationId = (professorId, courseDocId) =>
  `${professorId}_${courseDocId}`;

export const ensureCourseAiConversation = async ({
  professorId,
  courseDocId,
}) => {
  if (!professorId || !courseDocId) {
    throw new Error("professorId and courseDocId are required.");
  }

  const conversationId = buildCourseAiConversationId(professorId, courseDocId);
  const conversationRef = doc(db, AI_CONVERSATIONS_COLLECTION, conversationId);
  const snapshot = await getDoc(conversationRef);

  if (!snapshot.exists()) {
    await setDoc(conversationRef, {
      professorId,
      courseDocId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(conversationRef, { updatedAt: serverTimestamp() });
  }

  return { id: conversationId, ref: conversationRef };
};

export const listenCourseAiMessages = (conversationId, onChange, onError) => {
  if (!conversationId) return () => {};
  const messagesRef = collection(
    db,
    AI_CONVERSATIONS_COLLECTION,
    conversationId,
    "messages"
  );
  const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));
  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      if (onChange) onChange(items);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

export const createCourseAiMessagePair = async ({
  conversationId,
  professorId,
  courseDocId,
  content,
}) => {
  if (!conversationId || !professorId || !courseDocId) {
    throw new Error("Missing identifiers for creating messages.");
  }
  if (!content) {
    throw new Error("Message content is required.");
  }

  const conversationRef = doc(db, AI_CONVERSATIONS_COLLECTION, conversationId);
  const messagesRef = collection(conversationRef, "messages");

  // 1) Save professor message.
  const professorMessageRef = await addDoc(messagesRef, {
    role: "professor",
    content,
    status: "sent",
    createdAt: serverTimestamp(),
  });

  // 2) Add placeholder AI message with processing status.
  const aiMessageRef = await addDoc(messagesRef, {
    role: "ai",
    content: "",
    status: "processing",
    createdAt: serverTimestamp(),
  });

  // 3) Touch conversation updatedAt for activity sorting.
  await updateDoc(conversationRef, { updatedAt: serverTimestamp() });

  return {
    professorMessageId: professorMessageRef.id,
    aiMessageId: aiMessageRef.id,
  };
};

export const updateCourseAiMessage = async ({
  conversationId,
  messageId,
  payload,
}) => {
  if (!conversationId || !messageId) {
    throw new Error("Missing identifiers for updating message.");
  }
  const messageRef = doc(
    db,
    AI_CONVERSATIONS_COLLECTION,
    conversationId,
    "messages",
    messageId
  );
  await updateDoc(messageRef, payload);
};

export const callCourseAiAssistant = async ({
  conversationId,
  courseDocId,
  responseMessageId,
  recentMessages,
}) => {
  const fn = httpsCallable(functions, "courseAiAssistant");
  const result = await fn({
    conversationId,
    courseDocId,
    responseMessageId,
    recentMessages,
  });
  return result?.data;
};
