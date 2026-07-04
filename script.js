/* ==================================================
   script.js - Super Creative Hub AEC (V9 - Jadwal Ganda & Notif Restored)
   ================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

enableIndexedDbPersistence(db).catch((err) => { console.warn("Mode offline gagal:", err.code); });

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => { console.log('Mesin PWA Aktif.'); }).catch((err) => { console.log('Mesin PWA Gagal: ', err); });
    });
}

export const mentorData = {
    "anam": { pin: "1111", julukan: "Mr. Anam" }, "rizal": { pin: "2222", julukan: "Mr. Rizal" },
    "budi": { pin: "3333", julukan: "Mr. Budi" }, "nandika": { pin: "4444", julukan: "Mr. Nandika" },
    "huda": { pin: "5555", julukan: "Mr. Huda" }, "afif": { pin: "6666", julukan: "Mr. Afif" },
    "sup": { pin: "7777", julukan: "Mr. Sup" }
};

export function startClock(clockId, dateId) {
    function update() {
        const now = new Date();
        if (document.getElementById(clockId)) document.getElementById(clockId).innerText = now.toLocaleTimeString('id-ID');
        if (document.getElementById(dateId)) document.getElementById(dateId).innerText = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    setInterval(update, 1000); update();
}

export function listenToGlobalInfo(callback) {
    onSnapshot(doc(db, "settings", "global_info"), (docSnap) => {
        // UPDATE V9: Menambahkan jadwalHarian, goal, dan briefing yang sempat hilang!
        callback(docSnap.exists() ? docSnap.data() : { 
            jadwal: "-", jadwalHarian: "-", briefing: "-", goal: "-", catatan: "-", 
            kurikulum: { vocab: [], speaking: [], grammar: [] },
            masterSiswa: "", hariKe: "" 
        });
    });
}

export async function updateGlobalInfo(dataData) {
    await setDoc(doc(db, "settings", "global_info"), { ...dataData, waktuUpdate: serverTimestamp() });
    return await addDoc(collection(db, "riwayat_info"), { ...dataData, waktu: serverTimestamp() });
}

export async function sendLogbook(mentorId, namaMentor, kelas, jamKe, materiGroup, flatMateri, laporanSiswa, catatanKendala, arraySiswa, tugasSiswa) {
    return await addDoc(collection(db, "logbooks"), { mentorId, nama: namaMentor, kelas, jamKe, materiGroup: materiGroup || { vocab:[], speaking:[], grammar:[] }, materi: flatMateri || [], laporanSiswa, catatanKendala, dataSiswa: arraySiswa || [], tugasSiswa: tugasSiswa || "", waktu: serverTimestamp() });
}

export async function updateLogbook(docId, dataBaru) { return await updateDoc(doc(db, "logbooks", docId), dataBaru); }
export async function deleteLogbook(docId) { return await deleteDoc(doc(db, "logbooks", docId)); }

export function listenToLogbooks(callback) {
    onSnapshot(query(collection(db, "logbooks"), orderBy("waktu", "desc")), { includeMetadataChanges: true }, (snap) => {
        let list = []; snap.forEach(doc => { list.push({ id: doc.id, ...doc.data(), isPending: doc.metadata.hasPendingWrites }); }); callback(list);
    });
}

export async function sendTugasWA(targetKelas, linkGambar, instruksi) { return await addDoc(collection(db, "tugas_wa"), { targetKelas, linkGambar, instruksi, waktu: serverTimestamp() }); }
export async function deleteTugasWA(docId) { return await deleteDoc(doc(db, "tugas_wa", docId)); }
export function listenToTugasWA(callback) {
    onSnapshot(query(collection(db, "tugas_wa"), orderBy("waktu", "desc")), (snap) => { let list = []; snap.forEach(doc => list.push({ id: doc.id, ...doc.data() })); callback(list); });
}
