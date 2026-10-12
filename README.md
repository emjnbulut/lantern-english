# Lantern English · Hikâyelerle İngilizce

Tek video denemesi: **Sintel · B1 (İngilizce altyazı destekli tahmini seviye)**, [Videolar](https://lantern-english.github.io/#videos) bölümünde. Resmî CC BY 3.0 film, tam jenerikle dış kaynaktan oynatılır; İngilizce altyazı kelimelerine dokununca Türkçe sözlük açılır ve video durur. Konuşmalar arasında geçiş ve tekrar dinleme vardır. Video oynatma internet gerektirir. Kaynaklar ve lisans: `content/videos/sintel.json`.

Türkçe konuşanlar için, seviyeli hikâyelerle İngilizce öğreten koyu temalı statik bir web sitesi.
Herhangi bir kelimenin üzerine gelince (telefonda dokununca) Türkçe anlamı çıkar.

**Çalıştırmak için:** `index.html` dosyasını tarayıcıda açman yeterli. Sunucu ya da kurulum gerekmez.

## Özellikler
- **Hikâyeler:** A1–C2 için ayrı koleksiyon; tür (komedi, gizem, korku, macera, romantik, bilim kurgu, fabl, dram) ve uzunluk filtreleri, arama, sıralama.
- **Kitaplığım:** kartlardaki Kaydet düğmesi veya her okuma ekranındaki "Kitaplığıma ekle" kutucuğuyla manuel kayıt. Bir metni açmak kitaplığına eklemez; kayıt sayısı sınırı yoktur. Sekmeye girince tüm kayıtlar açılır; arama, içerik türü filtresi ve sıralama kullanılabilir. Okuma ilerlemesi korunur; kayıtlar bu tarayıcıda saklanır.
- **Önerilenler:** mevcut filtrelere uygun en fazla üç hikâye; Dracula (B1) ve Frankenstein (B2) kısaltılmış klasikleri uygun seçimlerde önceliklidir.
- **Kelime ipucu:** her kelimede Türkçe anlam, kök (ör. *went ← go*), metne özel anlam ve kalıp ifadeler. Tıklayınca kutu sabitlenir: sesli telaffuz, deftere ekleme, Tureng bağlantısı.
- **Kelime Defterim:** kaydedilen kelimeler geçtikleri cümleyle saklanır; aralıklı tekrar kartları (Leitner) ve Anki'ye kopyalama.
- **Okuma araçları:** hikâyelerde yaklaşık 450 kelimelik sayfalar, önceki/sonraki sayfa ve sayfa seçimi, kaldığın sayfadan devam, sesli okuma (paragraf vurgulu), yazı boyutu ve okuma ilerlemesi. Anlama soruları ve ifade listesi son sayfada; makaleler kesintisiz okunur.
- **Geri gitme:** sol üstteki düğme site içindeki önceki ekrana döner; doğrudan açılan sayfalarda uygun koleksiyona veya ana sayfaya götürür.
- **Makaleler:** B2–C2 okurlar için ayrı koleksiyon ve bağımsız filtrelerle her türe özel özgün denemeler.
- **Telifsiz içerik:** klasikler Project Gutenberg'den (kamu malı) kısaltılmadan alındı; “Lantern Original” hikâyeleri, makaleler ve sözlük Lantern English için yazıldı.

## Geliştirilmiş prompt (projenin çıkış noktası)
> Türk öğrenciler için koyu temalı, ne çok sade ne çok karmaşık, rahat gezilen bir "hikâyelerle İngilizce" sitesi tasarla.
> Hikâyeler kısa / orta / uzun olsun; her biri türüne (roman tadında sürükleyici anlatılar, komedi, gizem, korku, macera, romantik, bilim kurgu, fabl, dram) ve CEFR seviyesine (A1–C2) göre ayrılsın.
> Ayrı anahtar kelime listeleri yerine, her kelimenin üzerine gelindiğinde Türkçe anlamını gösteren küçük bir kutu olsun.
> İleri seviyeler için her türe özgü makaleler yazılsın. Kaynaklar açık ve telifsiz olsun (Project Gutenberg), alt seviyeler için özgün hikâyeler yazılsın.
> Ek fikirler: kelime defteri ve aralıklı tekrar kartları, sesli telaffuz ve sesli okuma, kalıp ifadelerin işaretlenmesi, anlama soruları, okuma ilerlemesi, seviyeye göre okuma süresi.

## Eklenecek hikâyeler

12 Ekim 2026 durumu: planlanan 7 hikâyenin **tamamı yazıldı** (Kaşağı, Perili Köşk, Pembe İncili Kaftan, Boğaç Han, Bamsı Beyrek, Basat ve Tepegöz, Pinokyo). Pinokyo (A2) İtalyanca özgünden (Gutenberg #52484) `content/stories/pinocchio-retold.json` olarak yazıldı. Hepsi `content/stories/` içinde, "Kısaltılmış klasik" rozetiyle Hikâyeler koleksiyonundadır. Canlı sitede yayın durumu için HOSTING.md'ye bakın. Seviyeler uyarlamaların düzeyidir, özgün eserlerin CEFR derecesi değildir.

| Yazar / kaynak | Eser | Hedef seviye | Seçim gerekçesi |
|---|---|---|---|
| Ömer Seyfettin | [Kaşağı](https://tr.wikisource.org/wiki/Ka%C5%9Fa%C4%9F%C4%B1) | B1 | Yalan, kardeşlik ve pişmanlık üzerinden güçlü duygusal etki. |
| Ömer Seyfettin | [Perili Köşk](https://tr.wikisource.org/wiki/Perili_K%C3%B6%C5%9Fk) | A2 | Gizem, mizah ve sürpriz çözüm. |
| Ömer Seyfettin | [Pembe İncili Kaftan](https://tr.wikisource.org/wiki/Pembe_%C4%B0ncili_Kaftan) | B1 | Tarihi gerilim, cesaret ve onur. |
| Dede Korkut / anonim Oğuz anlatıları | Dirse Han Oğlu Boğaç Han | A2 | Boğayla mücadele, iftira ve aile ilişkileri. |
| Dede Korkut / anonim Oğuz anlatıları | Bamsı Beyrek | B1 | Tutsaklık, kaçış, kılık değiştirme ve yeniden kavuşma. |
| Dede Korkut / anonim Oğuz anlatıları | Basat'ın Tepegöz'ü Öldürmesi | B1 | Fantastik canavar mücadelesi ve zekâyla tehlikeyi aşma. |
| Carlo Collodi | [Pinokyo](https://www.gutenberg.org/ebooks/52484) | A2 | Bir kuklanın maceraları, seçimleri ve sorumluluk öğrenmesi. |

Kaynak ve yazım notları:

- Dede Korkut seçimleri Dresden nüshasının sırasıyla **1., 3. ve 8. boylarıdır**. Kaynak: [SLUB Dresden nüsha kaydı](https://www.slub-dresden.de/en/explore/manuscripts/kitab-i-dedem-korkut/dresdner-handschrift) ve [hikâye içerikleri](https://www.slub-dresden.de/entdecken/handschriften/kitab-i-dedem-korkut/dresdner-handschrift/inhalt).
- Pinokyo için kaynak Collodi'nin **İtalyanca özgün romanıdır**; Gutenberg #52484. İngilizce anlatım kendi uyarlamamız olacak. Modern çevirilerden veya film uyarlamalarından metin, tasarım ya da sahne ayrıntıları alınmayacak.
- Eski özgün metinlerden bağımsız İngilizce anlatımlar hazırlanacak; kullanılan eser, kaynak sürümü ve uyarlama niteliği belirtilecek. Modern sadeleştirmelerin, çevirilerin, açıklamaların ve görsellerin serbest olduğu varsayılmayacak.
- Bu kayıt yalnızca içerik planıdır. Hikâye metinleri, quizler ve sözlük girdileri bu görevde oluşturulmadı; yazım ve yayın sonraki çalışma kapsamındadır.

## Mobil uygulama
Telefonda tarayıcıdan açıp **Ana ekrana ekle** (iOS) / **Uygulamayı yükle** (Android) dediğinde uygulama gibi çalışır; okuduğun sayfalar çevrimdışı da açılır. Mobil WebView içine gömmek için `node tools/make-site.mjs` çıktısındaki `site/` klasörünü kullan. Ayrıntı: [HOSTING.md](HOSTING.md).

## Geliştirme
Bkz. [HANDOFF.md](HANDOFF.md) (son çalışma ve kalan işler), [AGENTS.md](AGENTS.md) (yapay zekâ asistanları için devir rehberi) ve [CONTENT_SPEC.md](CONTENT_SPEC.md) (içerik formatı).

11 Ekim 2026 güncellemesi: Kullanıcının isteğiyle üç kitap özeti ve ayrı **Kitap Özetleri** bölümü kaldırıldı. Hikâyeler ve Makaleler ayrı koleksiyonlar olarak devam ediyor. Mevcut Dracula ve Frankenstein hikâye uyarlamaları korunuyor; Dönüşüm uyarlaması `drafts/` altında, çakışma düzeltmesi bekleyen taslak olarak saklanıyor ve yayımlanmıyor. Yukarıdaki yedi hikâye plan listesinde kalıyor.

Bu sürümde **Kitaplığım** tüm kayıtları gösterir ve okuyucu kutucuğuyla açık seçim yapılır; kısaltılmış klasikler en fazla üç kartlık Önerilenler bölümündedir. Yeni hikâye, makale veya kitap özeti yazılmadı. 267 tarayıcı kontrolü geçti; yayın kaydı için HANDOFF.md ve HOSTING.md'ye bak.

**Site:** https://lantern-english.github.io/ (herkese açık). Yayın ve güncelleme adımları için [HOSTING.md](HOSTING.md).

Önerilenler, mobil uygulama (PWA) ve imza mevcut; herkese açık yayın için [HOSTING.md](HOSTING.md). Eski kitap özeti çalışmasının kaydı [BOOK_SUMMARIES_HANDOFF.md](BOOK_SUMMARIES_HANDOFF.md) içinde yalnızca tarihsel bilgi olarak tutuluyor; yeniden ekleme görevi değil.

```bash
node tools/validate.mjs   # içeriği doğrula
node tools/vocab.mjs      # sözlükte eksik kelimeleri listele
node tools/build.mjs      # data/ paketlerini üret
node tools/review-content.mjs # değişen yeni metinleri denetle (commit öncesi)
node tools/smoke.mjs      # geçici Edge/Chrome ile masaüstü ve mobil kontrolleri
```
