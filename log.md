# Yıllık Plan - Güncelleme Günlüğü

## 2026-03-26

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
