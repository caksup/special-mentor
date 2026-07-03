/* ==================================================
   script.js - Pusat Data & Logika Firebase
   ================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Konfigurasi Firebase Proyek Anda
const firebaseConfig = {
    apiKey: "AIzaSyCgXGAww1dMu4eWzA1clUiOQht1DzxHl4A",
    authDomain: "special-mentor.firebaseapp.com",
    projectId: "special-mentor",
    storageBucket: "special-mentor.firebasestorage.app",
    messagingSenderId: "1075582532703",
    appId: "1:1075582532703:web:969365cefff8999335efea"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// 2. Database Kunci PIN Rahasia (Hanya Superadmin yang tahu)
export const userPins = {
    "anam": "1111",
    "rizal": "2222",
    "budi": "3333",
    "afif": "4444",
    "sup": "5555" // Ini PIN Superadmin
};

// 3. Fungsi Jam Digital Real-time untuk Halaman Utama & Dashboard
export function startClock(clockId, dateId) {
    function update() {
        const now = new Date();
        const jam = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const tgl = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        
        if (document.getElementById(clockId)) document.getElementById(clockId).innerText = jam;
        if (document.getElementById(dateId)) document.getElementById(dateId).innerText = tgl;
    }
    setInterval(update, 1000);
    update();
}

// 4. Fungsi Mengambil Info Global (Jadwal, Briefing, Catatan, Goal) dari Superadmin
export function listenToGlobalInfo(callback) {
    const infoRef = doc(db, "settings", "global_info");
    onSnapshot(infoRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        } else {
            callback({
                jadwal: "Belum ada jadwal hari ini.",
                briefing: "Belum ada instruksi briefing.",
                catatan: "Tidak ada catatan penting.",
                goal: "Belum ditentukan."
            });
        }
    });
}

// 5. Fungsi Superadmin untuk Update Info Global ke Database
export async function updateGlobalInfo(dataData) {
    const infoRef = doc(db, "settings", "global_info");
    return await setDoc(infoRef, {
        ...dataData,
        waktuUpdate: serverTimestamp()
    });
}

// 6. Fungsi Mentor untuk Mengirim Logbook
export async function sendLogbook(namaMentor, materiArray, catatanTeks) {
    return await addDoc(collection(db, "logbooks"), {
        nama: namaMentor,
        materi: materiArray,
        catatan: catatanTeks,
        waktu: serverTimestamp()
    });
}

// 7. Fungsi Sinkronisasi Data Logbook Bersama (Real-time)
export function listenToLogbooks(callback) {
    const q = query(collection(db, "logbooks"), orderBy("waktu", "desc"));
    onSnapshot(q, (snap) => {
        let listData = [];
        snap.forEach(doc => {
            listData.push(doc.data());
        });
        callback(listData);
    });
}
