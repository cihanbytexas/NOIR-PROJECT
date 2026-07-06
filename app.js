import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = "https://qyqqmmzxslflmxppfsga.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cXFtbXp4c2xmbG14cHBmc2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTIwNjIsImV4cCI6MjA5ODg2ODA2Mn0.UFaW9l574ZfWmFacx1OOlWE9jNNu0Y319P3spiR6otM";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 1. GLOBAL DİL (i18n) MOTORU
// ==========================================
const dictionary = {
    tr: {
        main_btn: "GİRİŞ / KAYIT",
        online_title: "ONLİNE",
        total_title: "TÜM KULLANICILAR",
        tab_login: "GİRİŞ YAP",
        tab_register: "KAYIT OL",
        ph_username: "Kullanıcı Adı",
        ph_password: "Şifre",
        ph_unique_user: "Benzersiz Kullanıcı Adı",
        ph_create_pass: "Şifre Oluştur",
        btn_connect: "SİSTEME BAĞLAN",
        btn_create: "HESAP OLUŞTUR"
    },
    en: {
        main_btn: "LOGIN / REGISTER",
        online_title: "ONLINE",
        total_title: "ALL USERS",
        tab_login: "LOGIN",
        tab_register: "REGISTER",
        ph_username: "Username",
        ph_password: "Password",
        ph_unique_user: "Unique Username",
        ph_create_pass: "Create Password",
        btn_connect: "CONNECT",
        btn_create: "CREATE ACCOUNT"
    }
};

let currentLang = localStorage.getItem('noir_lang') || 'tr';

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('noir_lang', lang); // Hafızaya kazı
    document.getElementById('langToggleBtn').innerText = lang === 'tr' ? 'TR / EN' : 'EN / TR';

    // Metinleri çevir
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary[lang][key]) el.innerText = dictionary[lang][key];
    });

    // Placeholder'ları (Kutu içi yazıları) çevir
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (dictionary[lang][key]) el.placeholder = dictionary[lang][key];
    });
}

document.getElementById('langToggleBtn').addEventListener('click', () => {
    applyLanguage(currentLang === 'tr' ? 'en' : 'tr');
});

// ==========================================
// 2. ARAYÜZ, SEKME VE OVERLAY MOTORU
// ==========================================
const authSheet = document.getElementById('authSheet');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const tabLoginBtn = document.getElementById('tabLoginBtn');
const tabRegisterBtn = document.getElementById('tabRegisterBtn');

// Paneli Aç
document.getElementById('openAuthBtn').addEventListener('click', () => {
    authSheet.classList.add('active');
});

// ÇÖZÜM: Boşluğa (Overlay) veya Çubuğa Tıklayınca Kapat
authSheet.addEventListener('click', (e) => {
    // Sadece siyah arka plana veya tutma çubuğuna tıklandıysa kapat
    if (e.target === authSheet || e.target.id === 'closeSheetBtn') {
        authSheet.classList.remove('active');
    }
});

// Sekme (Tab) Değiştirme Mantığı
tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
});

tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
});

// ==========================================
// 3. VERİTABANI İŞLEMLERİ
// ==========================================
const onlineCountEl = document.getElementById('onlineCount');
const totalCountEl = document.getElementById('totalCount');

async function fetchTotalUsers() {
    try {
        const { count, error } = await supabase.from('noir_users').select('*', { count: 'exact', head: true });
        if (error) throw error;
        totalCountEl.innerText = count ? count.toLocaleString() : "0";
    } catch (err) {
        totalCountEl.innerText = "0";
    }
}

function initRealtimeOnlineTracker() {
    const channel = supabase.channel('noir_global_online', { config: { presence: { key: 'user' } } });
    channel.on('presence', { event: 'sync' }, () => {
        onlineCountEl.innerText = Object.keys(channel.presenceState()).length.toLocaleString();
    }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
    });
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    try {
        const { error } = await supabase.from('noir_users').insert([{ username, password }]);
        if (error) throw error;
        alert(currentLang === 'tr' ? "Kayıt başarılı!" : "Registration successful!");
        fetchTotalUsers(); 
        tabLoginBtn.click(); // Başarılı kayıttan sonra giriş sekmesine otomatik geç
    } catch (err) {
        alert("Error: " + err.message);
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    try {
        const { data, error } = await supabase.from('noir_users').select('*').eq('username', username).eq('password', password).single();
        if (error || !data) throw new Error("Invalid credentials");
        alert(currentLang === 'tr' ? "Bağlantı Başarılı!" : "Connection Successful!");
        authSheet.classList.remove('active');
    } catch (err) {
        alert(currentLang === 'tr' ? "Hata: Kullanıcı adı veya şifre yanlış." : "Error: Invalid username or password.");
    }
});

// Başlangıç Kurulumları
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
    fetchTotalUsers();
    initRealtimeOnlineTracker();
});
