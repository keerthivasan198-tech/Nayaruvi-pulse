import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB2Ihe-7EovwE2ltQAZW3gawTJuAlx1Zag",
  authDomain: "pulse-ec78b.firebaseapp.com",
  projectId: "pulse-ec78b",
  storageBucket: "pulse-ec78b.firebasestorage.app",
  messagingSenderId: "290022533964",
  appId: "1:290022533964:web:6f8c366b1e3c799ed3fde9",
  databaseURL: "https://pulse-ec78b-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCollection(collectionName) {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  console.log(`Found ${snapshot.size} documents in ${collectionName}`);
  
  let count = 0;
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, docSnap.id));
    count++;
  }
  console.log(`Deleted ${count} documents from ${collectionName}`);
}

async function main() {
  console.log("Starting DB clear...");
  try {
    await clearCollection("tasks");
    await clearCollection("projects");
    await clearCollection("users");
    console.log("DB clear complete.");
  } catch(e) {
    console.error("Error clearing DB:", e);
  }
  process.exit(0);
}

main();
