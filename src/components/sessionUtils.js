import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./Firebase";

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bez mylących znaków 0/O/1/I
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createSession = async (quizId) => {
  const code = generateCode();
  const ref = await addDoc(collection(db, "sessions"), {
    quizId,
    hostId: auth.currentUser.uid,
    code,
    status: "waiting",
    createdAt: serverTimestamp(),
  });
  return { sessionId: ref.id, code };
};
