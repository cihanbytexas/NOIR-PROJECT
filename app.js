// ==========================================
// 1. SUPABASE BAĞLANTISI (MODÜL YÖNTEMİ)
// ==========================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Kendi anahtarlarını buraya giriyorsun
const SUPABASE_URL = "https://qyqqmmzxslflmxppfsga.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cXFtbXp4c2xmbG14cHBmc2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTIwNjIsImV4cCI6MjA5ODg2ODA2Mn0.UFaW9l574ZfWmFacx1OOlWE9jNNu0Y319P3spiR6otM";

// Çökmeyi engelleyen doğru tanımlama
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. ARAYÜZ VE MENÜ MOTORU
// ==========================================
const authSheet = document.getElementById('authSheet');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const onlineCountEl = document.getElementById('onlineCount');
const totalCountEl = document.getElementById('totalCount');

// Panel Açma / Kapatma
document.getElementById('openLoginBtn').addEventListener('click', () => {
    authSheet.classList.add('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
});

document.getElementById('openRegisterBtn').addEventListener('click', () => {
    authSheet.classList.add('active');
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

document.getElementById('closeSheetBtn').addEventListener('click', () => {
    authSheet.classList.remove('active');
});

// ==========================================
// 3. VERİTABANI İŞLEMLERİ (Önceki kodun aynısı)
// ==========================================
async function fetchTotalUsers() {
    try {
        const { count, error } = await supabase
            .from('noir_users')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        totalCountEl.innerText = count ? count.toLocaleString() : "0";
    } catch (err) {
        console.error("Veri çekilemedi:", err.message);
        totalCountEl.innerText = "0";
    }
}

function initRealtimeOnlineTracker() {
    const channel = supabase.channel('noir_global_online', {
        config: { presence: { key: 'user' } }
    });

    channel
        .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const onlineCount = Object.keys(state).length;
            onlineCountEl.innerText = onlineCount.toLocaleString();
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ online_at: new Date().toISOString() });
            }
        });
}

// Form Gönderimleri (/? hatasını engelleyen yapı)
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Sayfa yenilenmesini engeller
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;

    try {
        const { data, error } = await supabase
            .from('noir_users')
            .insert([{ username: username, password: password }])
            .select();

        if (error) {
            if (error.code === '23505') alert("Bu kullanıcı adı alınmış.");
            else throw error;
            return;
        }

        alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
        fetchTotalUsers(); 
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } catch (err) {
        alert("Sistem Hatası: " + err.message);
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const { data, error } = await supabase
            .from('noir_users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !data) {
            alert("Hata: Kullanıcı adı veya şifre yanlış.");
            return;
        }

        alert("Bağlantı Başarılı!");
        authSheet.classList.remove('active');
        
    } catch (err) {
        alert("Bağlantı Hatası: " + err.message);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchTotalUsers();
    initRealtimeOnlineTracker();
});
