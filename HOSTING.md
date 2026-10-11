# Lantern English yayın kaydı

- URL: **https://lantern-english.copperlion512.chatgpt.site**
- Hizmet: Sites; durum **succeeded** (11 Ekim 2026).
- Erişim: **owner-private**, sahibinin ChatGPT hesabıyla. Başka kişilere açılması henüz istenmedi. Mevcut erişimi kullanıcı talebi olmadan değiştirme.
- Site adı/slug: `lantern-english`.
- Site/project ID: `appgprj_6acb729e41bc819184448062a91f9491`.
- Saved version ID: `appgprj_6acb729e41bc819184448062a91f9491~appgver_400633fd5cf88191bfb67e9918acbf85`.
- Deployment ID: `appgdep_6acb73817f7481919bd88e9b862b3af5`.
- Sites kaynak commit: `f701d5af0394576f9751c7ac3d9afd54a8afb3cc`.
- Yayınlanan uygulama: GitHub `9c866e9ff64b5254141beb38aa3e83f24ea5e6da` sürümündeki tamamlanmış içerik ve arayüz; 27 hikâye, 16 makale.

## Kaynaklar ve çalışma klasörleri

Ana kaynak deposu `emjnbulut/lantern-english`, private; yerel klasör `C:\Users\emin\lantern-english`. GitHub origin değiştirilmedi.

Sites için ayrı kaynak checkout: **`C:\Users\emin\lantern-english-hosting`**. Bu klasörde uygulama kaynaklarının bir kopyası, `.openai/hosting.json` ve `dist/` bulunuyor. `dist/` içindeki index.html, assets/ ve data/ yayınlanır; content/ veya drafts/ doğrudan yayınlanmaz. Tamamlanmamış Greyhaven taslağı uygulama paketinde yok.

Son arşiv: `C:\Users\emin\lantern-english-site.tar.gz`. Paket native source helper tarafından doğrulanmış Sites commitinden üretildi; kimlik bilgileri arşive veya kaynaklara yazılmadı.

Bu GitHub deposundaki `.openai/hosting.json` aynı Site kimliğini kaydeder. **create_site tekrar çağrılmamalı.** Uygulamanın sonraki sürümlerini bu kimlikle yayınla. GitHub commitleri ve Sites kaynak commitleri farklı checkoutlara aittir; publish tool'a Sites kaynağına gönderilmiş tam SHA verilmeli.

## Sonraki yayın

Önce Sites `SKILL.md` dosyasını oku. Mevcut Site'ı `get_site` ile seç, access/owner durumunu koru ve aynı project ID için yeni kısa ömürlü source write credential al. Credential sadece oturum belleğinde ve gizli stdin üzerinden kullanılmalı.

Mevcut hosting checkoutu varsa source helper ile açıp dönen checkout_path'i kullan. Yoksa boş bir klasörde aç; uzak Site kaynak geçmişini bu şekilde indir. GitHub'daki değişiklikleri bu checkouta taşı. Site manifestini ve `.git` geçmişini ezme; GitHub `.git` klasörünü kopyalama.

Kaynakları doğrula, `tools/build.mjs` ile veri paketlerini üret ve bu checkoutun index.html/assets/data dosyalarını `dist/` içine güncelle. Güncel kaynaktan sonra source helper ile commit/push/package yap. Owner-private audience korunuyorsa native `save_version_and_deploy_private` kullan. Pending/building/publishing durumlarında aynı deployment'ı takip et; succeeded durumundaki URL yayın doğrulamasıdır.

Windows ortamında source helper için Git Bash PATH'te bulunmalı. Bu oturumda kullanılan ek ortam ayarları:

```powershell
$env:PATH = 'C:\Program Files\Git\bin;' + $env:PATH
$env:TAR_OPTIONS = '--force-local'
```

`--force-local`, GNU tar'ın `C:\...` arşiv yolunu uzak sunucu olarak yorumlamasını önler. Helper `tty: true` ile başlatılıp gizli stdin JSON alır; `commands` ve `archivePath` Sites skill sözleşmesine göre verilir. Arşivi git deposunun dışında tut.

Depoyu public yapmak, ücretli alan adı almak veya başka bir Site oluşturmak bu yayının bir parçası değildi.

## Herkese açık yayın ve mobil uygulama (Claude oturumu, 11 Ekim 2026)

**Durum:** ChatGPT Sites yayını owner-private kalıyor; GitHub deposu private. Herkese açık yayın için aşağıdaki yol hazırlandı ama kullanıcı onayı olmadan **uygulanmadı**.

### Mobil uygulama / WebView uyumu
- `manifest.webmanifest` + `sw.js` + `assets/icons/`: site Android/iOS/masaüstünde ana ekrana eklenebilir (PWA), daha önce açılan sayfalar çevrimdışı çalışır. Service worker yalnızca `http(s)` altında kaydedilir; `file://` ve gömülü WebView'larda sessizce atlanır.
- Eski iOS/Android WebView'larını kıran sözdizimi (regex lookbehind) kaldırıldı; `color-mix`/`backdrop-filter` için yedek değerler var; güvenli alan (`env(safe-area-inset-*)`), `100dvh`, 16 px arama alanı (iOS yakınlaştırma yok), dokunmatik hedef boyutları ayarlandı.
- Yerel kabuk (Capacitor/Cordova/WebView) için `node tools/make-site.mjs` çıktısındaki `site/` klasörünü `webDir` olarak kullan; tüm yollar göreli.
- Mobil kontrol betiği: `tools/smoke.mjs` (masaüstü+375 px) ve oturum notlarındaki 390 px CDP kontrolü.

### Temiz site paketi
`node tools/make-site.mjs [dir]` → `site/` (index.html, assets/, data/, manifest, sw.js, LICENSE, `.nojekyll`). `content/`, `drafts/`, `tools/` ve devir notları **dahil değildir**. `sw.js` içeriğe göre sürüm damgası alır.

### Önerilen herkese açık yayın (onay bekliyor)
Kaynak depo private kalır; yalnızca derlenmiş site ayrı bir **public** depoya gider:
```
gh repo create emjnbulut/lantern-english-site --public
node tools/build.mjs
node tools/publish-site.mjs https://github.com/emjnbulut/lantern-english-site.git
gh api -X POST repos/emjnbulut/lantern-english-site/pages -f "source[branch]=main" -f "source[path]=/"
```
Adres: `https://emjnbulut.github.io/lantern-english-site/`. Güncelleme: build + `publish-site.mjs`. Ücretsiz GitHub hesabında private depodan Pages yoktur; bu yüzden ayrı public depo kullanılır.

### Koruma gerçeği
Statik siteyi herkes tarayıcısından görüp kaydedebilir; teknik olarak kopyalanmasını engellemek mümkün değildir. Alınan önlemler: kaynak/taslak/geçmiş yayınlanmaz, `LICENSE` ile telif bildirimi, sayfada "created by emjn" imzası. Kamu malı klasikler (Gutenberg) zaten serbesttir; özgün metinler telif kapsamındadır.
