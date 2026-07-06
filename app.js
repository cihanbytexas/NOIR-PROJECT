// ==========================================
// 1. ARAYÜZ VE MENÜ MOTORU (ÖNCE YÜKLENİR)
// ==========================================
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

// ==========================================
// 2. SUPABASE VERİTABANI VE GÜVENLİK MOTORU
// ==========================================

// DİKKAT: SİSTEMİN CANLANMASI İÇİN BURAYA KENDİ BİLGİLERİNİ GİRMELİSİN
const SUPABASE_URL = "https://qyqqmmzxslflmxppfsga.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cXFtbXp4c2xmbG14cHBmc2dhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTIwNjIsImV4cCI6MjA5ODg2ODA2Mn0.UFaW9l574ZfWmFacx1OOlWE9jNNu0Y319P3spiR6otM";

try {
    // Supabase İstemcisini Başlatma (Hata yakalama bloğu içinde)
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 1. Toplam Kullanıcı Sayısı
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

    // 2. Anlık Online Takibi (Realtime Presence)
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

    // 3. Kayıt Olma İşlemi
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
                if (error.code === '23505') alert("Bu kullanıcı adı sistemde zaten kayıtlı.");
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

    // 4. Giriş Yapma İşlemi
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

            alert("Bağlantı Başarılı. Sisteme giriş yapılıyor...");
            authSheet.classList.remove('active');
            
        } catch (err) {
            alert("Bağlantı Hatası: " + err.message);
        }
    });

    // Motorları Ateşle
    document.addEventListener('DOMContentLoaded', () => {
        fetchTotalUsers();
        initRealtimeOnlineTracker();
    });

} catch (e) {
    console.error("Supabase başlatılamadı. Lütfen API anahtarlarınızı kontrol edin.", e);
}
