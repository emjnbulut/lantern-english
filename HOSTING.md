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
