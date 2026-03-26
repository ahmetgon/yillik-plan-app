# Yıllık Plan - Güncelleme Günlüğü

## 2026-03-26

### Path-Based Routing & Admin Dashboard
- React Router eklendi: `/` → Admin Dashboard, `/:slug` → Takvim
- Ana sayfa artık marka kartları listesi (admin için)
- Marka kartına tıklayınca `/slug` takvim sayfasına gidiyor
- Kullanıcı yönetimi tablo formatında dashboard'da
- Şifre değiştirme dashboard'da
- Subdomain yerine path-based multi-tenant mimari

### Yıl Bazlı Kart Sistemi
- Cards tablosuna `year` kolonu eklendi
- Yıl değiştirince o yılın kartları yükleniyor
- Kart oluşturmada seçili yıl otomatik atanıyor
- Mevcut veritabanları için migration (year kolonu ekleniyor)

### Header/Footer Düzenleme
- Header'dan Rhino Runner logosu kaldırıldı
- Footer koyu arka plan (navy) ile alt kenara sabitlendi
- Footer metni: "Created by" + Rhino Runner logo

### Kategori Türkçe Karakter Düzeltmesi
- server/db.ts seed verilerinde Türkçe karakterler düzeltildi
- Mevcut veritabanlarındaki eski kayıtlar otomatik güncelleniyor (migration)

### Drag & Drop Kart Taşıma
- Kartlar sürükle-bırak ile farklı haftalara ve aylara taşınabiliyor
- HTML5 Drag and Drop API kullanıldı (ek kütüphane yok)
- Optimistic update: kart anında taşınır, hata olursa geri alınır
- Bırakma alanı görsel geri bildirimi (highlight + "Buraya bırak" yazısı)
- Taşıma işlemi aktivite loguna kaydediliyor
- Grip ikonu hover'da görünüyor

### Lejant Pozisyonu Değişikliği
- Lejant (kategori renkleri) sayfanın altından yukarıya taşındı
- Yeni konum: takvim araç çubuğu ile takvim grid'i arasında

### Yıl Seçici Eklendi
- CalendarToolbar'a yıl seçici combobox eklendi (2024-2030 arası)
- Varsayılan: mevcut yıl (2026)

### Header & Footer Markalaması
- Header başlığı: "{Marka Adı} x Rhino Runner" formatına güncellendi
- Header'a Rhino Runner logosu eklendi
- Footer eklendi: "Geliştiren" + Rhino Runner logo linki

### Türkçe Karakter Düzeltmeleri
- Tüm bileşenlerde Türkçe karakter sorunları düzeltildi (ş, ç, ğ, ı, ö, ü, İ, Ş, Ç, Ğ, Ö, Ü)
- Etkilenen dosyalar: types/index.ts, tüm component dosyaları

---

## 2026-03-25

### İlk Sürüm (v1.0)
- Vite 8 + React 19 + TypeScript + TailwindCSS v4 ile frontend oluşturuldu
- Express 5 + better-sqlite3 ile backend oluşturuldu
- Multi-tenant mimari: tenant başına ayrı SQLite veritabanı
- Takvim görünümleri: Yıl, Quarter, Ay
- 5 haftalık ay yapısı
- Kart CRUD: oluşturma, düzenleme, silme
- Zengin metin editörü (contentEditable)
- Kategori sistemi: 5 renk kodlu kategori
- Kullanıcı sistemi: Admin, Editor, Viewer rolleri
- Admin paneli: Marka yönetimi, kullanıcı yönetimi, şifre değiştirme
- Kart aktivite zaman çizelgesi (Trello tarzı)
- Coolify ile yillikplan.ahmetgo.com adresine deploy
- GitHub Actions CI/CD pipeline
- Cloudflare wildcard DNS yapılandırması
