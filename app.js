// NOIR - Supabase Entegrasyon Çekirdeği

// Kendi Supabase panelinden alacağın bilgileri buraya eksiksiz yapıştıracaksın
const SUPABASE_URL = "https://qyqqmmzxslflmxppfsga.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cXFtbXp4c2xmbG14cHBmc2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTIwNjIsImV4cCI6MjA5ODg2ODA2Mn0.UFaW9l574ZfWmFacx1OOlWE9jNNu0Y319P3spiR6otM";

// Supabase İstemcisini Başlatma
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elementleri
const authSheet = document.getElementById('authSheet');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const onlineCountEl = document.getElementById('onlineCount');
const totalCountEl = document.getElementById('totalCount');

// Panel Açma / Kapatma Kontrolleri
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

// --- PERFORMANS VE GERÇEK ZAMANLI VERİ MOTORU ---

// 1. Toplam Kayıtlı Kullanıcı Sayısını Çeken Fonksiyon
async function fetchTotalUsers() {
    try {
        const { count, error } = await supabase
            .from('noir_users')
            .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        totalCountEl.innerText = count ? count.toLocaleString() : "0";
    } catch (err) {
        console.error("Kullanıcı sayısı çekilemedi:", err.message);
        totalCountEl.innerText = "ERR";
    }
}

// 2. Realtime Presence (Anlık Çevrimiçi Takip Motoru)
function initRealtimeOnlineTracker() {
    // Küresel bir takip kanalı oluşturuluyor
    const channel = supabase.channel('noir_global_online', {
        config: { presence: { key: 'user' } }
    });

    channel
        .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            // Kanala bağlı toplam cihaz sayısını hesapla
            const onlineCount = Object.keys(state).length;
            onlineCountEl.innerText = onlineCount.toLocaleString();
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                // Sayfayı açan her tarayıcıyı odaya bir iz bırakarak dahil et
                await channel.track({ online_at: new Date().toISOString() });
            }
        });
}

// --- KİMLİK DOĞRULAMA (AUTH) MOTORU ---

// Kayıt Olma İşlemi
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;

    try {
        const { data, error } = await supabase
            .from('noir_users')
            .insert([{ username: username, password: password }])
            .select();

        if (error) {
            if (error.code === '23505') {
                alert("Bu kullanıcı adı sistemde zaten kayıtlı.");
            } else {
                throw error;
            }
            return;
        }

        alert("Kayıt başarılı. Giriş yapabilirsiniz.");
        fetchTotalUsers(); // İstatistiği anlık güncelle
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        
    } catch (err) {
        alert("Kayıt protokolü hatası: " + err.message);
    }
});

// Giriş Yapma İşlemi
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
            alert("Kimlik doğrulanamadı. Kullanıcı adı veya şifre hatalı.");
            return;
        }

        alert("Sisteme başarıyla bağlanıldı. Yetki onaylandı.");
        authSheet.classList.remove('active');
        // İleride buraya başarılı giriş sonrası ana sohbet arayüzüne geçiş mantığı gelecek
        
    } catch (err) {
        alert("Giriş protokolü hatası: " + err.message);
    }
});

// Sayfa Açıldığında Motorları Ateşle
document.addEventListener('DOMContentLoaded', () => {
    fetchTotalUsers();
    initRealtimeOnlineTracker();
});
