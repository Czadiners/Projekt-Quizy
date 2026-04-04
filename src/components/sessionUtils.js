import { collection, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { auth, db } from "./Firebase";

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const createSession = async (quizId) => {
  const code = generateCode();

  // Pobierz tytuł quizu żeby wyświetlać go w historii
  const quizSnap = await getDoc(doc(db, "quizzes", quizId));
  const quizTitle = quizSnap.exists() ? quizSnap.data().title : "Quiz";

  const ref = await addDoc(collection(db, "sessions"), {
    quizId,
    quizTitle,
    hostId: auth.currentUser.uid,
    code,
    status: "waiting",
    createdAt: serverTimestamp(),
  });

  return { sessionId: ref.id, code };
};
