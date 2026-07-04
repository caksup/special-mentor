/* ==================================================
   script.js - AEC HUB V15 (God Mode & Auto-Assignment)
   ================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, onSnapshot, updateDoc, deleteDoc, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCgXGAww1dMu4eWzA1clUiOQht1DzxHl4A",
    authDomain: "special-mentor.firebaseapp.com",
    projectId: "special-mentor",
    storageBucket: "special-mentor.firebasestorage.app",
    messagingSenderId: "1075582532703",
    appId: "1:1075582532703:web:969365cefff8999335efea"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(err => console.warn(err));

// LOGIN - Nggowo assignedSchool langsung
export async function verifyLogin(username, pin) {
    const userDoc = await getDoc(doc(db, "users", username));
    if (userDoc.exists()) {
        const data = userDoc.data();
        if(data.status !== "aktif") throw new Error("Akses Ditolak: Akun dinonaktifkan!");
        if(data.pin !== pin) throw new Error("PIN Keamanan salah!");
        return data; 
    }
    throw new Error("Username tidak terdaftar!");
}

// SEKOLAHAN
export function listenToSchools(callback) { 
    return onSnapshot(collection(db, "schools"), (snap) => { 
        let list = []; snap.forEach(doc => { if(doc.data().status !== 'archived') list.push({ id: doc.id, ...doc.data() }); }); callback(list); 
    }); 
}

export function listenToSingleSchool(schoolId, callback) {
    if(!schoolId) return null;
    return onSnapshot(doc(db, "schools", schoolId), (docSnap) => { callback(docSnap.exists() ? docSnap.data() : null); });
}

// LOGBOOK (Anti Bocor)
export function listenToLogbooks(schoolId, callback) { 
    if(!schoolId) return null;
    const q = query(collection(db, "logbooks"), where("schoolId", "==", schoolId));
    return onSnapshot(q, (snap) => { 
        let list = []; snap.forEach(doc => { list.push({ id: doc.id, ...doc.data() }); }); 
        list.sort((a, b) => (b.waktu?.toMillis() || 0) - (a.waktu?.toMillis() || 0)); callback(list); 
    }); 
}

export async function sendLogbook(schoolId, mentorId, namaMentor, kelas, jamKe, materiGroup, flatMateri, laporanSiswa, arraySiswa, tugasSiswa) { 
    return await addDoc(collection(db, "logbooks"), { schoolId, mentorId, nama: namaMentor, kelas, jamKe, materiGroup, materi: flatMateri, laporanSiswa, dataSiswa: arraySiswa, tugasSiswa, waktu: serverTimestamp() }); 
}

export function deleteLogbook(docId) { return deleteDoc(doc(db, "logbooks", docId)); }

// CHAT
export function listenToChats(schoolId, callback) {
    if(!schoolId) return null;
    const q = query(collection(db, "chats"), where("schoolId", "==", schoolId));
    return onSnapshot(q, (snap) => { 
        let list = []; snap.forEach(doc => list.push({ id: doc.id, ...doc.data() })); 
        list.sort((a, b) => (a.waktu?.toMillis() || 0) - (b.waktu?.toMillis() || 0)); callback(list); 
    });
}
export async function sendGlobalChat(schoolId, dariNama, isiPesan, roleSender) { return await addDoc(collection(db, "chats"), { schoolId, sender: dariNama, message: isiPesan, waktu: serverTimestamp(), type: 'global', role: roleSender }); }
export async function sendJapri(schoolId, dariNama, keUsername, isiPesan, roleSender) { return await addDoc(collection(db, "chats"), { schoolId, sender: dariNama, receiver: keUsername, message: isiPesan, waktu: serverTimestamp(), type: 'private', role: roleSender }); }
export function deleteChat(chatId) { return deleteDoc(doc(db, "chats", chatId)); }

// TUGAS WA
export function listenToTugasWA(schoolId, callback) { 
    if(!schoolId) return null;
    const q = query(collection(db, "tugas_wa"), where("schoolId", "==", schoolId));
    return onSnapshot(q, (snap) => { 
        let list = []; snap.forEach(doc => list.push({ id: doc.id, ...doc.data() })); 
        callback(list); 
    }); 
}
export async function sendTugasWA(schoolId, targetKelas, linkGambar, instruksi) { return await addDoc(collection(db, "tugas_wa"), { schoolId, targetKelas, linkGambar, instruksi, waktu: serverTimestamp() }); }
export function deleteTugasWA(docId) { return deleteDoc(doc(db, "tugas_wa", docId)); }

export function startClock(clockId, dateId) {
    setInterval(() => { 
        const now = new Date(); 
        if (document.getElementById(clockId)) document.getElementById(clockId).innerText = now.toLocaleTimeString('id-ID'); 
        if (document.getElementById(dateId)) document.getElementById(dateId).innerText = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); 
    }, 1000);
}
