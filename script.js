/* ==================================================
   script.js - AEC HUB (V10 - Smart Role & Dynamic Engine)
   ================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

enableIndexedDbPersistence(db).catch((err) => { console.warn("Offline mode err:", err.code); });
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js'); }); }

// ==========================================
// 1. SISTEM OTENTIKASI USER DINAMIS
// ==========================================
export async function verifyLogin(username, pin) {
    const userDoc = await getDoc(doc(db, "users", username));
    if (userDoc.exists()) {
        const data = userDoc.data();
        if(data.status !== "aktif") throw new Error("Akses Ditolak: Akun Anda sedang dinonaktifkan oleh Admin.");
        if(data.pin !== pin) throw new Error("Gagal Masuk: PIN Keamanan salah!");
        return data;
    } else {
        // Fallback Data Awal (Auto-Migrasi ke Firebase saat pertama login)
        const fallback = {
            "sup": { pin: "7777", julukan: "Mr. Sup", role: "admin", status: "aktif" },
            "afif": { pin: "6666", julukan: "Mr. Afif", role: "direktur", status: "aktif" },
            "anam": { pin: "1111", julukan: "Mr. Anam", role: "mentor", status: "aktif" },
            "rizal": { pin: "2222", julukan: "Mr. Rizal", role: "mentor", status: "aktif" },
            "huda": { pin: "5555", julukan: "Mr. Huda", role: "mentor", status: "aktif" }
        };
        if(fallback[username]) {
            if(fallback[username].pin !== pin) throw new Error("Gagal Masuk: PIN Keamanan salah!");
            await setDoc(doc(db, "users", username), fallback[username]); // Simpan ke database selamanya
            return fallback[username];
        }
        throw new Error("Peringatan: Username tidak terdaftar di sistem AEC!");
    }
}

// ==========================================
// 2. TIMELINE GENERATOR (❶❷③④⑤)
// ==========================================
export function generateTimelineHTML(totalHari, hariBerjalan) {
    const outlined = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"];
    const filled   = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"];
    let result = ""; let t = parseInt(totalHari) || 5; let b = parseInt(hariBerjalan) || 0;
    for(let i=0; i<t; i++) { if(i < 20) result += (i < b) ? filled[i] : outlined[i]; }
    return result;
}

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
        callback(docSnap.exists() ? docSnap.data() : { 
            jadwal: "-", jadwalHarian: "-", briefing: "-", goal: "-", 
            kurikulum: { vocab: [], speaking: [], grammar: [] },
            masterSiswa: "", 
            namaSekolah: "AEC Hub Pusat", totalHari: 5, hariBerjalan: 0
        });
    });
}

export async function updateGlobalInfo(dataData) {
    await setDoc(doc(db, "settings", "global_info"), { ...dataData, waktuUpdate: serverTimestamp() }, {merge:true});
}

// FUNGSI LAINNYA TETAP AMAN (LOGBOOK & WA)
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
