/* ==================================================
   script.js - AEC HUB (V12 - Smart Schedule & Layout)
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

export async function verifyLogin(username, pin) {
    const userDoc = await getDoc(doc(db, "users", username));
    if (userDoc.exists()) {
        const data = userDoc.data();
        if(data.status !== "aktif") throw new Error("Akses Ditolak: Akun dinonaktifkan Admin.");
        if(data.pin !== pin) throw new Error("Gagal Masuk: PIN Keamanan salah!");
        return data;
    } else {
        const fallback = {
            "sup": { pin: "7777", julukan: "Mr. Sup", role: "admin", status: "aktif" }, "afif": { pin: "6666", julukan: "Mr. Afif", role: "direktur", status: "aktif" },
            "anam": { pin: "1111", julukan: "Mr. Anam", role: "mentor", status: "aktif" }, "rizal": { pin: "2222", julukan: "Mr. Rizal", role: "mentor", status: "aktif" },
            "huda": { pin: "5555", julukan: "Mr. Huda", role: "mentor", status: "aktif" }
        };
        if(fallback[username]) {
            if(fallback[username].pin !== pin) throw new Error("Gagal Masuk: PIN salah!");
            await setDoc(doc(db, "users", username), fallback[username]); return fallback[username];
        }
        throw new Error("Peringatan: Username tidak terdaftar!");
    }
}

// 1. TIMELINE BUNDERAN (DAY DI ATAS, ANGKA DI BAWAH, LEBIH BESAR JIKA AKTIF)
export function generateTimelineHTML(totalHari, hariBerjalan) {
    const outlined = ["①","②","③","④","⑤","⑥","⑦","⑧","⑨","⑩","⑪","⑫","⑬","⑭","⑮","⑯","⑰","⑱","⑲","⑳"];
    const filled   = ["❶","❷","❸","❹","❺","❻","❼","❽","❾","❿","⓫","⓬","⓭","⓮","⓯","⓰","⓱","⓲","⓳","⓴"];
    let result = `<div class="d-flex flex-wrap align-items-center mt-1">`; 
    let t = parseInt(totalHari) || 5; let b = parseInt(hariBerjalan) || 0;
    for(let i=0; i<t; i++) { 
        if(i < 20) {
            if (i < b) result += `<span style="font-size: 1.4rem; margin: 0 2px;" class="text-danger">${filled[i]}</span>`;
            else result += `<span style="font-size: 1rem; margin: 0 2px; opacity: 0.5;">${outlined[i]}</span>`;
        }
    }
    result += `</div>`;
    return result;
}

// 2. MESIN PELACAK JADWAL OTOMATIS BERDASARKAN JAM
export function getActiveSchedule(jadwalGlobal) {
    if (!jadwalGlobal || jadwalGlobal === "-") return "Tidak ada jadwal kelas.";
    const lines = jadwalGlobal.split('\n');
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (let line of lines) {
        // Melacak teks yang punya format angka jam (cth: 07.00 - 08.00 atau 07:00 - 08:00)
        const match = line.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/);
        if (match) {
            const startMins = parseInt(match[1]) * 60 + parseInt(match[2]);
            const endMins = parseInt(match[3]) * 60 + parseInt(match[4]);
            if (currentMinutes >= startMins && currentMinutes <= endMins) {
                return line; // Mengembalikan baris jadwal yang sedang aktif saat ini
            }
        }
    }
    return "Sedang di luar jam kelas / Istirahat.";
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
            masterKelas: "Kelas A, Kelas B, Kelas C, Kelas D", masterSiswa: "", 
            namaSekolah: "AEC Hub Pusat", totalHari: 5, hariBerjalan: 0
        });
    });
}
export async function updateGlobalInfo(dataData) { await setDoc(doc(db, "settings", "global_info"), { ...dataData, waktuUpdate: serverTimestamp() }, {merge:true}); }

export async function sendLogbook(mentorId, namaMentor, kelas, jamKe, materiGroup, flatMateri, laporanSiswa, catatanKendala, arraySiswa, tugasSiswa) { return await addDoc(collection(db, "logbooks"), { mentorId, nama: namaMentor, kelas, jamKe, materiGroup: materiGroup || { vocab:[], speaking:[], grammar:[] }, materi: flatMateri || [], laporanSiswa, catatanKendala, dataSiswa: arraySiswa || [], tugasSiswa: tugasSiswa || "", waktu: serverTimestamp() }); }
export async function updateLogbook(docId, dataBaru) { return await updateDoc(doc(db, "logbooks", docId), dataBaru); }
export async function deleteLogbook(docId) { return await deleteDoc(doc(db, "logbooks", docId)); }
export function listenToLogbooks(callback) { onSnapshot(query(collection(db, "logbooks"), orderBy("waktu", "desc")), { includeMetadataChanges: true }, (snap) => { let list = []; snap.forEach(doc => { list.push({ id: doc.id, ...doc.data(), isPending: doc.metadata.hasPendingWrites }); }); callback(list); }); }
export async function deleteChat(chatId) { return await deleteDoc(doc(db, "chats", chatId)); }
export async function sendTugasWA(targetKelas, linkGambar, instruksi) { return await addDoc(collection(db, "tugas_wa"), { targetKelas, linkGambar, instruksi, waktu: serverTimestamp() }); }
export async function deleteTugasWA(docId) { return await deleteDoc(doc(db, "tugas_wa", docId)); }
export function listenToTugasWA(callback) { onSnapshot(query(collection(db, "tugas_wa"), orderBy("waktu", "desc")), (snap) => { let list = []; snap.forEach(doc => list.push({ id: doc.id, ...doc.data() })); callback(list); }); }
