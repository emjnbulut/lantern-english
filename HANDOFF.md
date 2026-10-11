# Lantern English — AI devir notu

**Güncel görev (11 Ekim 2026):** Kullanıcı Kitaplığım'da son üçten fazla kaydın korunmasını ve her hikâyede "Kitaplığıma ekle" kutucuğuyla açık seçim istedi. Her okuma ekranında native checkbox vardır; yalnızca kullanıcının check/uncheck işlemi o metni ekler/çıkarır. Açma, sayfa geçişi veya okuma bitirme otomatik kayıt yapmaz. Kartlardaki Kaydet düğmeleri korunur. Kitaplığım'da kayıt sınırı yoktur; her girişte tüm kayıtlar gösterilir, filtre kullanıldığında görünen/toplam sayısı ayrılır. `lantern.bookmarks` ve okuma ilerlemesi bağımsızdır; mevcut kayıtlar silinmez.

**Önceki sürümün doğrulaması:** Temiz worktree üzerinde build 30 hikâye, 16 makale ve 7.623 sözlük girdisi üretti; smoke 212 tarayıcı kontrolünü geçti. Kaydetme/kaldırma, yenilemede kalıcılık, gerçek ikinci sekmeyle senkronizasyon ve klavye odağı, bozuk kayıt toleransı, depolama engelliyken oturumda birden fazla kayıt, okuma sayfasından devam ve tüm/seçili filtrelerde en fazla üç öneri doğrulandı. 375/390 px Kitaplığım ve masaüstü öneriler ayrıca görsel olarak incelendi. Canlı yayın durumu ve kaynak/yayın commitleri HOSTING.md'de tutulur.

Kullanıcı ayrıca kısaltılmış klasikleri Önerilenler'e ekleyip en fazla üç öneri göstermeyi istedi. Dracula B1, Frankenstein B2 grubunun ilk önerisi oldu; yalnızca öneri listesinden A Table for Mr Costa ve The Necklace çıkarıldı, hikâyeler korunuyor. Öneriler varsayılan listede ve seviye/tür/arama/uzunluk filtrelerinde gösterilir; çoklu seviye seçiminde de bölümün tamamı en fazla üç karttır.

Bu görev yeni içerik üretmez veya kaldırılan üç özeti geri getirmez. README'deki Ömer Seyfettin, Dede Korkut ve Pinokyo planları korunur. Diğer AI, `8960ce3` commitinde Frankenstein düzenlemelerini ve sözlükleri tamamladı; Kafka uyarlamasını (telifli çeviriyle %18,9 örtüştüğü için) taslağa aldı; sonra Almanca orijinalden yeniden yazıldı, örtüşme 0'a indi ve `content/stories/the-metamorphosis-abridged.json` olarak yayına alındı. Paket güncel, kaydedilmiş kaynaklardan hazırlanır; GitHub Pages güncellemesinde HOSTING.md'nin normal clone/commit/push yöntemi kullanılır; `tools/publish-site.mjs` geçmişi force ile değiştirdiği için kullanılmaz.

**Önceki arayüz görevi (11 Ekim 2026):** Kullanıcı üç kitap özeti bölümünün silinmesini, sol üstte geri gitme düğmesi ve hikâyelerin sayfalara ayrılmasını istedi. Üç özetin kaynak dosyaları ve içerik araçlarındaki desteği kaldırıldı; mevcut hikâye uyarlamaları ve sözlükler korunuyor. Hikâyeler yaklaşık 450 kelimelik sayfalar, sayfa seçimi ve kaldığın sayfadan devam ile okunuyor; quiz ve ifadeler son sayfada, makaleler kesintisiz. Geri düğmesi site içi geçmişi kullanıyor, doğrudan girişlerde uygun koleksiyona/ana sayfaya dönüyor. [BOOK_SUMMARIES_HANDOFF.md](BOOK_SUMMARIES_HANDOFF.md) eski çalışmanın arşividir; özetleri tamamlamak veya yeniden yayımlamak için görev listesi değildir. Aşağıdaki önceki sürüm notları tarihsel bağlam olarak korunuyor. Güncel yayın yöntemi ve herkese açık https://lantern-english.github.io/ adresi için HOSTING.md'yi esas al.

**Önceki sürümün doğrulaması:** Temiz, ayrı bir worktree üzerinde `node tools/build.mjs` ile 30 hikâye, 16 makale ve 7.548 sözlük girdisi üretildi. `node tools/smoke.mjs` 159 tarayıcı kontrolünü geçti; 375/390 px mobil görünüm ve masaüstü okuyucu ayrıca incelendi. Sayfalarda metin sırası ve bütünlüğü, son sayfadaki quiz, kelime ipuçları, geri gezinme ve kaldığın sayfadan devam doğrulandı. Ana çalışma klasöründeki henüz commit edilmemiş Frankenstein/Kafka içerik ve sözlük düzenlemeleri bu sürüme alınmadı; sonraki AI bunları ayrı değerlendirmeli.

Son kontrol noktası: **11 Ekim 2026**. Kullanıcı çalışmaya ara verilmesini, mevcut ilerlemenin GitHub'a kaydedilmesini ve başka bir AI ile devam edebilmesini istedi. Yeni içerik üretimi durduruldu; tamamlanmış metinler, arayüz değişiklikleri, üretilmiş veri paketleri ve yarım hikâye taslağı birlikte saklandı. Ardından kullanıcı site bağlantısını istedi ve tamamlanmış sürüm Sites üzerinde yayınlandı: **https://lantern-english.copperlion512.chatgpt.site**. Erişim şu anda sahibinin ChatGPT hesabıyla sınırlı; ayrıntılar `HOSTING.md` içinde.

## Claude oturumu güncellemesi (11 Ekim 2026)
Yapılanlar: kitap özetleri ve sözlük işleri tamamlandı (bkz. BOOK_SUMMARIES_HANDOFF.md); her seviye için **Önerilenler** (`content/featured.json`); mobil uygulama (PWA, WebView uyumu); "created by emjn" imzası; `LICENSE`; `tools/make-site.mjs` ve `tools/publish-site.mjs`. Greyhaven hikâyesi tamamlandı ve yayına alındı. Yapılmayanlar: ikinci C2 drama ve README'deki 7 planlı uyarlama (kullanıcı dokunmamamı istedi); herkese açık yayın kullanıcı onayını bekliyor.


- GitHub hesabındaki Lantern English sitesini incelemek; site adresindeki adı `lantern-english` yapmak.
- Hikâyeleri ve makaleleri açıkça ayırmak.
- Astra kullanarak özgün, eski özgün metinlerden daha uzun hikâyeler ve makaleler eklemek; ileri seviyeleri de genişletmek.
- Mevcut canlı bağlantı yoksa canlı yayın oluşturmak.

Depo zaten `emjnbulut/lantern-english` adını taşıyor. Arayüzde marka **Lantern English** olarak düzeltildi. Canlı adresin site adı `lantern-english` olarak oluşturuldu. Kullanıcı ücretli alan adı satın alınmasını istemedi.

## Depo ve çalışma ortamı

- Depo: `https://github.com/emjnbulut/lantern-english.git`, **private**.
- Dal: `main`; uzak depo: `origin`.
- Yerel klasör: `C:\Users\emin\lantern-english`.
- Statik HTML/CSS/JavaScript; framework, npm bağımlılığı veya harici veritabanı yok.
- Kaynaklar `content/` altında. `data/library.js` ve `data/dict.js` yalnızca `node tools/build.mjs` ile üretilir.
- `drafts/` site paketlerine dahil edilmez.
- GitHub bağlayıcısı bu depoyu göstermedi; yerel Git kimlik bilgileriyle gerçek ana hesaba erişilebildi. Kimlik bilgileri veya token dosyaya yazılmadı. Sonraki AI mevcut Git erişimini kullanabilir; gerekmedikçe kullanıcıdan yeniden depo bağlantısı istemesin.

Önce `AGENTS.md` ve `CONTENT_SPEC.md` okunmalı. Kullanıcının ara verme talebi nedeniyle aşağıdaki kalan işler tamamlanmış gibi sunulmamalı.

## Tamamlanan arayüz değişiklikleri

- Hikâyeler (`#library`) ve Makaleler (`#articles`) ayrı koleksiyonlar; ana sayfada ayrı giriş kartları ve ileri seviye özgün hikâye alanı var.
- Hikâye ve makale filtrelerinin saklama anahtarları ayrı: `lantern.filters` / `lantern.articleFilters`.
- Hikâye listesine türle ilişkili makale kartları eklenmiyor. Okuma sonundaki öneriler okunan metinle aynı içerik türünde.
- Ana sayfanın seviye sayıları yalnızca hikâyeleri sayıyor; makale seviye filtreleri B2/C1/C2.
- Arama, sıralama, filtreleri temizleme ve sonuç sayısı iki koleksiyonda da çalışıyor.
- Mevcut okuma, kelime ipucu, quiz ve kullanıcı kayıtları korunuyor. `#library` rotası değiştirilmedi.

## Tamamlanan içerikler

Üç Astra alt ajanı (`gpt-6-astra`) toplam **8 tamamlanmış hikâye ve 8 makale** yazdı. Her yeni metinde 5 soru, dört seçenek, Türkçe açıklamalar ve metinde doğrulanmış 8 ifade bulunuyor. Makaleler beşer bölümlü.

| Kaynak (content/ altında) | Seviye / tür | Kelime |
|---|---|---:|
| stories/a-photo-for-the-new-cafe.json | A1 comedy | 1.651 |
| stories/the-other-way-to-the-island.json | A2 adventure | 2.432 |
| stories/the-bridge-with-two-ends.json | A2 fable | 2.251 |
| stories/the-table-by-the-window.json | B1 romance | 4.677 |
| stories/the-last-repair-ticket.json | B1 drama | 4.666 |
| stories/the-voice-on-the-wrong-tape.json | B2 mystery | 4.609 |
| stories/the-room-between-entries.json | C1 horror | 4.556 |
| stories/what-the-mass-remembers.json | C2 scifi | 5.194 |
| articles/comedy-through-small-decisions.json | B2 comedy | 1.773 |
| articles/adventure-as-a-series-of-choices.json | B2 adventure | 1.771 |
| articles/a-fable-with-room-to-think.json | B2 fable | 1.725 |
| articles/love-in-the-practical-details.json | B2 romance | 1.972 |
| articles/the-work-a-dramatic-scene-hides.json | C1 drama | 1.952 |
| articles/suspicion-is-not-evidence.json | C1 mystery | 1.954 |
| articles/the-rules-inside-uncertainty.json | C1 horror | 1.793 |
| articles/speculation-under-constraint.json | C2 scifi | 1.767 |

Toplam site: **27 hikâye ve 16 makale**; A1 3, A2 6, B1 6, B2 6, C1 5, C2 1 hikâye. Makaleler her türde iki adet. Eski metinler silinmedi veya kısaltılmadı. Uzunluk talebi eski özgün metinlere göre uygulandı; mevcut en uzun klasiklerden daha uzun olma koşulu konmadı.

## Kalan işler — önerilen sıra

1. **Sözlüğü tamamla.** `content/dict/extended-originals.json` 111 yeni madde ekliyor; toplam 6.687. Son `node tools/vocab.mjs` sonucu **451 çözümlenemeyen biçim**, ayrıca 249 yalnızca büyük harfle geçen biçim atlandı. Bazıları isim veya eski metinlerin tek harfli parçaları; birçok gerçek yeni kelime de hâlâ çeviri bekliyor. Öne çıkanlar: beaver, cassette, archive, catalogue, conversion, caption, beacon, valve, actuator, scanning, technician, inference. Aynı kavram için kök ve çekim biçimlerini lemmatizer davranışına göre ele al; bağlamsal anlam için metnin glossary alanını kullan. `Bas` bir karakter adı olabilir; eski klasiklerde küçük harfli Fransızca `bas` da geçtiğinden global karşılığı isimle ezme. Eski `s`, `l`, `à` parçaları için lemmatizer değişikliği gerekebilir; önce bağlamı kontrol et. Önceki %98,5 kapsama iddiası yeni metinler için doğrulanmış değil.
2. **Greyhaven taslağını tamamla.** Aşağıdaki bölümde plan var. Bitmeden `content/stories/` içine taşıma.
3. **İkinci C2 hikâyeyi yaz.** Kullanıcının üst seviye isteğini genişletmek için ek bir C2 drama planlandı; henüz dosya oluşturulmadı. Öneri aşağıda, zorunlu olay örgüsü değil.
4. **Yayın erişimini koru.** Tamamlanmış sürüm Sites üzerinde yayınlandı; yalnızca sahibinin ChatGPT hesabıyla açılıyor. Kullanıcı başka kişilerin erişmesini isterse mevcut sitenin erişim politikasını değiştir; yeni Site oluşturma. GitHub deposu private kalmalı.
5. İçerik ve veri paketlerini birlikte doğrulayıp GitHub'a kaydet. Sayıları README/AGENTS içinde güncelle.

## Greyhaven: tamamlanmamış C1 macera

Dosya: `drafts/last-crossing-of-greyhaven.json`. **3.697 kelime**, ilk beş bölüm mevcut; hedef **7.300–7.800**. JSON şeması geçerli ama olay örgüsü bitmiyor. Glossary, ifadeler ve quiz önceden yazılmış; son metinden sonra doğruluk ve ifade eşleşmeleri yeniden incelenmeli.

Karakterler: lojistik koordinatörü **Mara**, konservatör **Nessa**, istasyon görevlisi **Ruth**, liman çalışanı **Kit**, matbaacı **Elian**, kaptan **Ivo**.

Mara, kapanacak kara geçidinden eski kıyı istasyonunun 18 arşiv kutusunu taşımaya gelir. Ruth'un yerel bağlamı açıklayan defterleri ve Elian'ın baskı kalıpları envanterde eksiktir. Bunlar kayıt altına alınırken van arızalanır; resmî yol kapanışı erkene alınır. İstasyonda güvenli depolama hâlâ mümkündür. Ekip, acil korunması gereken benzersiz evrakı tekneyle taşıma; sağlam kopyaları ve ağır kalıpları sorumlusu belirlenmiş sonraki sefere bırakma planı yapar. Kalıplar Elian'ın atölyesine geri götürülecektir. Son tekne **17.20**, taslağın sonu yaklaşık **14.00**. Son satır Ivo'nun onaylanan yük listesini getirmelerini ve istasyondan ayrılmadan aramalarını istemesi.

Planlanan dört son bölüm:

1. **Yaya rota:** Kit ve Elian'ın kontrol ettiği eski tramvay yolu; ödünç anahtarla tersane kapısı; el arabasının geçemediği dar drenaj köprüsünde kutuları tek tek aktarma. Fiziksel emek, dinlenme ve değişen ekip liderliği.
2. **İç iskele:** El arabası veya yol darboğazıyla planı uyarlama; kaptanın yük sınırını koruma; kutu numaralarını gerçek içerikle aceleye rağmen karşılaştırma.
3. **Tekne geçişi:** Güvenli yükleme ve kalkış; geride kalan eşyaları değersiz saymayan çözülme. Ruth'un toplulukla bilgi bağı, Nessa'nın erişim taahhüdü, Mara'nın hesabını verebildiği kararlar alması.
4. **Varış ve sonrası:** Kütüphanede teslim ve koruma hazırlığı; Elian'ın kalıplarının alım tarihini gerçekten ayarlama; yerel erişim kopyaları. Baştaki 18 tik beklentisine karşı, tamamlanan ve sorumlusu belirlenmiş bekleyen işlerin dürüst kaydı.

Yaklaşık 3.700–4.000 kelime ekle; gereksiz tekrar yerine sahnelerle geliştir. Sonra quiz, glossary, ifadeler ve zaman çizelgesini yeniden kontrol ederek dosyayı `content/stories/` içine taşı.

## Önerilen ikinci C2 drama

Henüz dosya yok. Öneri: **The Meal He Was Asked to Make**, id `the-meal-he-was-asked-to-make`, **5.100–5.600 kelime**. Kapanan restoranından sonra kızı Livia'nın düğün yemeğini yapmaya çalışan şef Anton; kızının sınırlarıyla kendi itibarını onarma isteği çatışır. Eski çalışan Bea'ya ücret borcu, davetsiz yatırımcı/eleştirmen ve gösterişli menü yerine üzerinde anlaşılmış sade hizmet olabilir. Final mucizeyle kurtulma yerine somut hesap verme, borcu aşamalı ödeme ve baba-kızın sınırlarına saygı üzerinden gelişebilir. Başka özgün C2 drama da seçilebilir.

## Yayın durumu

İlk GitHub API incelemesinde depo private, `homepage` boş, `has_pages=false`; Pages adresi yoktu (Pages API 404). Eski AGENTS'ta bahsedilen Claude artifact özel önizlemeydi. Sonraki kullanıcı isteği üzerine yeni bir Sites yayını tamamlandı; `.openai/hosting.json` artık gerçek Site kimliğini taşıyor.

Sites yayın adresi: **https://lantern-english.copperlion512.chatgpt.site**. Native deployment sonucu `succeeded` olarak doğrulandı. Yayın owner-private; GitHub görünürlüğü değiştirilmedi. Güncelleme için Sites skill ve `HOSTING.md` okunmalı, mevcut proje kimliği yeniden kullanılmalı. GitHub kaynakları bu depoda tutuluyor.

## Bu kontrol noktasındaki doğrulamalar

- `node tools/validate.mjs`: **OK**.
- `node tools/review-content.mjs`: **OK**, 16 değişen tamamlanmış metin incelendi.
- `node --check assets/js/app.js`: geçti.
- `node tools/build.mjs`: 27 hikâye, 16 makale; library yaklaşık 717 KB, dictionary yaklaşık 256 KB.
- `node tools/smoke.mjs`: **21 tarayıcı kontrolü geçti**. Hikâye/makale ayrımı, bağımsız filtreler, C2 metin, quiz, Türkçe ipucu, aynı tür öneriler, 375px mobil taşma ve tarayıcı hataları kontrol edildi. Masaüstü ana sayfa ve mobil makale ekran görüntüleri ayrıca görsel olarak incelendi.
- `node tools/vocab.mjs`: çalıştı; yukarıdaki sözlük eksikleri devam ediyor. Bu komutun başarılı çıkması eksiklerin sıfır olduğu anlamına gelmez.

`review-content.mjs` yalnızca commit edilmemiş yeni/değişen içerikleri denetler; temiz bir checkout üzerinde 0 dosya sonucu tüm kitaplığın tekrar denetlendiği anlamına gelmez. Mevcut düşük kelime sayılı eski metinler genişletilmiş yeni metin eşiklerine göre denetlenmez. Yeni yazılarda bu komutu commit öncesi çalıştır.

Tarayıcı denetimi Node 22+ ve Edge/Chrome gerektirir; mevcut ortam Node 24 ve Edge. Son ekran görüntüleri yerel geçici klasördeydi (`C:\Users\emin\AppData\Local\Temp\lantern-smoke-Kj4Pqg`); depoya alınmadı, yeniden üretilebilir.

Önerilen günlük akış:

```text
node tools/validate.mjs
node tools/review-content.mjs
node tools/vocab.mjs
node tools/build.mjs
node tools/smoke.mjs
git diff --check
```

Bu sürüm Sites üzerinde yayınlandı. Tamamlanmış kaynaklar ve üretilmiş paketler birlikte saklandı; yarım taslak yayına karıştırılmadı. Sözlük ve ek içerik işleri yukarıdaki gibi devam ediyor.
