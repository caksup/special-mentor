/* ==================================================
   script.js - Super Creative Hub AEC (V4 - Sistem Nilai & Absensi)
   ================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, setDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

export const userPins = { "anam": "1111", "rizal": "2222", "budi": "3333", "afif": "4444", "sup": "5555" };

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
        callback(docSnap.exists() ? docSnap.data() : { jadwal: "-", briefing: "-", catatan: "-", goal: "-", masterMateri: [], masterSiswa: "" });
    });
}

export function listenToRiwayatInfo(callback) {
    onSnapshot(query(collection(db, "riwayat_info"), orderBy("waktu", "desc")), (snap) => {
        let list = []; snap.forEach(doc => list.push({ id: doc.id, ...doc.data() })); callback(list);
    });
}

export async function updateGlobalInfo(dataData) {
    await setDoc(doc(db, "settings", "global_info"), { ...dataData, waktuUpdate: serverTimestamp() });
    return await addDoc(collection(db, "riwayat_info"), { ...dataData, waktu: serverTimestamp() });
}

// UPDATE: Tambahan parameter arraySiswa untuk Absensi & Penilaian
export async function sendLogbook(mentorId, namaMentor, kelas, jamKe, materiArray, laporanSiswa, catatanKendala, arraySiswa) {
    return await addDoc(collection(db, "logbooks"), {
        mentorId, nama: namaMentor, kelas, jamKe, materi: materiArray, 
        laporanSiswa, catatanKendala, dataSiswa: arraySiswa || [], waktu: serverTimestamp()
    });
}

// UPDATE: Update logbook juga bisa mengedit nilai
export async function updateLogbook(docId, dataBaru) {
    return await updateDoc(doc(db, "logbooks", docId), dataBaru);
}

export async function deleteLogbook(docId) { return await deleteDoc(doc(db, "logbooks", docId)); }

export function listenToLogbooks(callback) {
    onSnapshot(query(collection(db, "logbooks"), orderBy("waktu", "desc")), (snap) => {
        let list = []; snap.forEach(doc => list.push({ id: doc.id, ...doc.data() })); callback(list);
    });
}
