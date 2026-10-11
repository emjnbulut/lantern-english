# Lantern English yayın kaydı

**Tek video denemesi yayını (11 Ekim 2026):** Sintel, B1 (İngilizce altyazıyla izleme için Lantern tahmini), 14:48. Kaynak paket commiti `1925ad3`, public yayın commiti `8a6f248`, service worker sürümü `35941e7851`; canlı ekran https://lantern-english.github.io/#v.sintel. Temiz worktree build 31 hikâye, 16 makale, 7.695 sözlük girdisi ve yalnızca 1 video üretti. 302 tarayıcı kontrolü geçti; 375/390 px ve masaüstü görüntüler incelendi. Kelimeye dokunma/klavye, Türkçe anlam, deftere kayıt, 26 resmî SRT konuşmasının zaman aralıkları ve sessiz sahneler, oynatma öncesi medya isteği olmaması, kaynak/lisans bağlantıları, geri gezinme ve eski oynatıcının gecikmiş olaylarından korunma doğrulandı. Altyazıdaki 82 farklı kelime formunun tamamı sözlük veya video bağlam sözlüğüyle karşılanır. Canlı `index.html`, `assets/js/app.js`, `assets/css/style.css`, `data/videos.js`, `sw.js` SHA-256 değerleri paketle eşleşti.

**Oynatma doğrulamasının sınırı:** Resmî 480p MP4 kaynağı HEAD 200 ve küçük Range GET 206 döndü; H.264/AAC, 888 saniye, başta moov verisi ve byte-range desteği doğrulandı. Ancak ayrı `node tools/smoke.mjs --online-video` denemesi, 15 saniyelik ve yavaş 3G ile sınırlı tek denemede iki saniyelik gerçek oynatmayı doğrulayamadı (`readyState=0`, `currentTime=0`, medya hatası yok); bu çevrimiçi kontrol geçti diye raporlanmamalı. Normal 302 kontrol dış medyayı engelleyerek arayüzü doğrular. Kullanıcıya bu sınır bildirildi. Haricî film depo/pakete indirilmedi; video yüklenmezse resmî izleme sayfası bağlantısı ve Türkçe hata durumu bulunur.

**Güncel adres:** https://lantern-english.github.io/ — GitHub Pages. Aşağıdaki ChatGPT Sites kaydı eski, owner-private kopyaya aittir. Güncel siteyi ayrı public depo üzerinden, Git geçmişini koruyan normal commit/push ile güncelle; ayrıntılar bu dosyanın GitHub Pages bölümünde.

**Son doğrulanmış yayın (11 Ekim 2026):** Kitaplığım'a her girişte tüm kayıtlar gösterilir; okuyucularda "Kitaplığıma ekle" kutucuğu ile açık seçim yapılır. Paket kaynak commiti `ab3b97a`, public yayın commiti `68d315a492b1cea6fdc30fbc915397813eae39de`, service worker sürümü `b6460883e4`. 31 hikâye, 16 makale, 7.695 sözlük girdisi; 267 tarayıcı kontrolü geçti. Yedi kaydın yenilemede korunması ve kutucuğu seçmeden okumanın kayıt oluşturmaması doğrulandı. Canlı `index.html`, `assets/js/app.js`, `assets/css/style.css`, `data/library.js`, `data/dict.js` ve `sw.js` SHA-256 değerleri test edilen paketle eşleşti. Kaynak ve public depolar normal push ile güncellendi; mevcut kayıtları sıfırlayan bir geçiş yapılmadı.

**Önceki Kitaplığım yayını (11 Ekim 2026):** Kitaplığım sekmesi, kalıcı hikâye/makale kayıtları ve en fazla üç kartlık Önerilenler yayımlandı; Dracula B1 ve Frankenstein B2 önerilerinde öncelikli. Paket kaynak commiti `0d5b784`, public yayın commiti `63ac6bd1acf4c8d0ae82a198025615dc0df6ad96`, service worker sürümü `5689e020cd`. 30 hikâye, 16 makale, 7.623 sözlük girdisi; 212 tarayıcı kontrolü geçti. Canlı `index.html`, `assets/js/app.js`, `assets/css/style.css`, `data/library.js`, `data/dict.js` ve `sw.js` SHA-256 değerleri doğrulanmış paketle eşleşti. Kaynak ve public depolar normal push ile güncellendi; Kafka taslağı o pakete alınmadı.

**Önceki doğrulanmış yayın (11 Ekim 2026):** Üç kitap özeti kaldırıldı; sol üstte geri düğmesi ve tüm hikâyelerde sayfalama yayımlandı. Paket kaynak commiti `52f0f74`, public yayın commiti `0db053e13ab47d2180b609896c1ddd0daa545cb1`, service worker sürümü `4273b54adf`. Temiz pakette 30 hikâye, 16 makale ve 0 kitap özeti var; 159 tarayıcı kontrolü geçti. Canlı `index.html`, `assets/js/app.js`, `assets/css/style.css`, `data/library.js` ve `sw.js` dosyalarının SHA-256 değerleri doğrulanmış paketle eşleşti. Public depo geçmişi normal push ile korundu. Ana çalışma klasöründeki commit edilmemiş Frankenstein/Kafka düzenlemeleri bu yayına dahil edilmedi.

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

**Durum:** Herkese açık site GitHub Pages'te yayında (aşağıya bak). ChatGPT Sites kopyası owner-private ve eski sürümde kalır; kaynak GitHub deposu private.

### Mobil uygulama / WebView uyumu
- `manifest.webmanifest` + `sw.js` + `assets/icons/`: site Android/iOS/masaüstünde ana ekrana eklenebilir (PWA), daha önce açılan sayfalar çevrimdışı çalışır. Service worker yalnızca `http(s)` altında kaydedilir; `file://` ve gömülü WebView'larda sessizce atlanır.
- Eski iOS/Android WebView'larını kıran sözdizimi (regex lookbehind) kaldırıldı; `color-mix`/`backdrop-filter` için yedek değerler var; güvenli alan (`env(safe-area-inset-*)`), `100dvh`, 16 px arama alanı (iOS yakınlaştırma yok), dokunmatik hedef boyutları ayarlandı.
- Yerel kabuk (Capacitor/Cordova/WebView) için `node tools/make-site.mjs` çıktısındaki `site/` klasörünü `webDir` olarak kullan; tüm yollar göreli.
- Mobil kontrol betiği: `tools/smoke.mjs` (masaüstü+375 px) ve oturum notlarındaki 390 px CDP kontrolü.

### Temiz site paketi
`node tools/make-site.mjs [dir]` → `site/` (index.html, assets/, data/, manifest, sw.js, LICENSE, `.nojekyll`). `content/`, `drafts/`, `tools/` ve devir notları **dahil değildir**. `sw.js` içeriğe göre sürüm damgası alır.

### Herkese açık yayın (YAYINDA, 11 Ekim 2026)
- **Adres:** https://lantern-english.github.io/ — GitHub organizasyonu `lantern-english` (kullanıcı oluşturdu; adres kişisel ad içermez).
- **Depo:** `lantern-english/lantern-english.github.io` (**public**; yalnızca derlenmiş site). Kaynak depo `emjnbulut/lantern-english` **private** kalır.
- **Güncelleme:** Kaynak commitinden temiz bir worktree oluştur. Orada `node tools/validate.mjs`, `node tools/build.mjs` ve `node tools/smoke.mjs` çalıştır; üretilen veri paketlerini kaynak deposunda kaydet. Ardından `node tools/make-site.mjs` ile worktree içindeki `site/` klasörünü oluştur. Public depoyu normal olarak clone/fetch et; paketin ziyaretçi dosyalarını mevcut checkouta kopyala, `.git` ve varsa hosting ayarlarını koru. Diff'i incele, yalnızca site dosyalarını commit et ve normal `git push origin main` kullan. Kaynaklar, taslaklar ve devir notları public depoya kopyalanmaz.
- **Geçmişi koru:** Mevcut `tools/publish-site.mjs` betiği yeni depo geçmişi oluşturup `--force` ile gönderir; güncellemelerde kullanma. Public yayın geçmişini normal commit/push ile sürdür.
- Pages `main` / kök klasörden sunar; yayın birkaç dakika sürebilir. `sw.js` sürüm damgası değişir, kurulu kopyalar yenilenir. Push sonrasında canlı `index.html`, uygulama ve veri dosyalarının paketle eşleştiğini doğrula.
- **Doğrulama:** canlı adreste 390 px mobil kontrol (ipucu, Önerilenler, manifest, service worker, çevrimdışı önbellek) geçti.
- Ücretsiz GitHub hesabında private depodan Pages yoktur; bu yüzden ayrı public site deposu kullanılır.

### Koruma gerçeği
Statik siteyi herkes tarayıcısından görüp kaydedebilir; teknik olarak kopyalanmasını engellemek mümkün değildir. Alınan önlemler: kaynak/taslak/geçmiş yayınlanmaz, `LICENSE` ile telif bildirimi, sayfada "created by emjn" imzası. Kamu malı klasikler (Gutenberg) zaten serbesttir; özgün metinler telif kapsamındadır.

### Özel alan adı (.com) — hazırlık notu (satın alma kullanıcıdadır)
`.com` ücretsiz değildir (yıllık ücret; GitHub Pages özel alan adını ücretsiz bağlar). Adresi satın alma ve ödeme **kullanıcı** tarafından yapılır; hiçbir kimlik/ödeme bilgisi AI'a verilmez. 11 Ekim 2026 RDAP sorgusunda boş görünenler: `lantern-english.com`, `lantern-reads.com`, `lanternspeak.com`, `lanternenglishstories.com` (`lanternenglish.com` dolu). Satın almadan önce WHOIS gizliliğinin açık olduğundan emin olun (ad görünmesin).

Alan adı alındıktan sonra:
1. DNS (apex): `A` kayıtları `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; `www` için `CNAME` → `lantern-english.github.io`.
2. Public depoya kök dizinde `CNAME` dosyası ekle (içeriği yalnızca alan adı) — `tools/make-site.mjs` bu dosyayı otomatik üretmediği için public depoda normal commit ile korunmalı. Pages'te özel alan adını ayarla: `gh api -X PUT repos/lantern-english/lantern-english.github.io/pages -f cname=<alan-adı>`; DNS doğrulanınca `-F https_enforced=true`.
3. **Uyarı:** `localStorage` kaynak (origin) başınadır. Alan adı değişince kelime defteri, kitaplık ve ilerleme yeni adreste boş başlar; eski adres GitHub tarafından yeni adrese yönlendirilir ama veri taşınmaz. Taşımadan önce "Anki için kopyala" ile kelimeleri dışa aktarın veya dışa/içe aktarma özelliğini ekleyin.
4. `sw.js`/manifest göreli yollar kullandığı için kod değişikliği gerekmez; kurulu PWA'lar yeniden kurulmalıdır.
