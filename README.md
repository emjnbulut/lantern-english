# Lantern English · Hikâyelerle İngilizce

Türkçe konuşanlar için, seviyeli hikâyelerle İngilizce öğreten koyu temalı statik bir web sitesi.
Herhangi bir kelimenin üzerine gelince (telefonda dokununca) Türkçe anlamı çıkar.

**Çalıştırmak için:** `index.html` dosyasını tarayıcıda açman yeterli. Sunucu ya da kurulum gerekmez.

## Özellikler
- **Hikâyeler:** A1–C2 için ayrı koleksiyon; tür (komedi, gizem, korku, macera, romantik, bilim kurgu, fabl, dram) ve uzunluk filtreleri, arama, sıralama.
- **Kelime ipucu:** her kelimede Türkçe anlam, kök (ör. *went ← go*), metne özel anlam ve kalıp ifadeler. Tıklayınca kutu sabitlenir: sesli telaffuz, deftere ekleme, Tureng bağlantısı.
- **Kelime Defterim:** kaydedilen kelimeler geçtikleri cümleyle saklanır; aralıklı tekrar kartları (Leitner) ve Anki'ye kopyalama.
- **Okuma araçları:** sesli okuma (paragraf vurgulu), yazı boyutu, okuma ilerlemesi ve kaldığın yerden devam, hikâye sonunda anlama soruları ve ifade listesi.
- **Makaleler:** B2–C2 okurlar için ayrı koleksiyon ve bağımsız filtrelerle her türe özel özgün denemeler.
- **Telifsiz içerik:** klasikler Project Gutenberg'den (kamu malı) kısaltılmadan alındı; “Lantern Original” hikâyeleri, makaleler ve sözlük Lantern English için yazıldı.

## Geliştirilmiş prompt (projenin çıkış noktası)
> Türk öğrenciler için koyu temalı, ne çok sade ne çok karmaşık, rahat gezilen bir "hikâyelerle İngilizce" sitesi tasarla.
> Hikâyeler kısa / orta / uzun olsun; her biri türüne (roman tadında sürükleyici anlatılar, komedi, gizem, korku, macera, romantik, bilim kurgu, fabl, dram) ve CEFR seviyesine (A1–C2) göre ayrılsın.
> Ayrı anahtar kelime listeleri yerine, her kelimenin üzerine gelindiğinde Türkçe anlamını gösteren küçük bir kutu olsun.
> İleri seviyeler için her türe özgü makaleler yazılsın. Kaynaklar açık ve telifsiz olsun (Project Gutenberg), alt seviyeler için özgün hikâyeler yazılsın.
> Ek fikirler: kelime defteri ve aralıklı tekrar kartları, sesli telaffuz ve sesli okuma, kalıp ifadelerin işaretlenmesi, anlama soruları, okuma ilerlemesi, seviyeye göre okuma süresi.

## Eklenecek hikâyeler

11 Ekim 2026: Kullanıcının seçilmesini ve GitHub'a kaydedilmesini istediği **7 planlanan hikâye**. Henüz metinleri yazılmadı veya siteye eklenmedi. Hazırlandıklarında `content/stories/` içindeki **Hikâyeler** koleksiyonuna ait olacaklar. Seviyeler, hazırlanacak İngilizce uyarlamalar için öneridir; özgün eserlerin CEFR derecesi değildir.

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

## Geliştirme
Bkz. [HANDOFF.md](HANDOFF.md) (son çalışma ve kalan işler), [AGENTS.md](AGENTS.md) (yapay zekâ asistanları için devir rehberi) ve [CONTENT_SPEC.md](CONTENT_SPEC.md) (içerik formatı).

11 Ekim 2026 kontrol noktası: 27 tamamlanmış hikâye, 16 makale ve 6.687 sözlük maddesi. Yarım metinler `drafts/` içinde saklanır ve siteye eklenmez.

**Site:** [Lantern English](https://lantern-english.copperlion512.chatgpt.site). Sites üzerinde yayında; erişim şu anda sahibinin ChatGPT hesabıyla sınırlı. Yayın ayarları ve sonraki güncellemeler için [HOSTING.md](HOSTING.md).

Sonraki çalışma kontrol noktası: Dracula, Dönüşüm ve Frankenstein için üç özgün İngilizce özet ve ayrı Kitap Özetleri bölümü kaynaklara eklendi. Bu güncelleme henüz canlı siteye aktarılmadı; Hayvan Çiftliği ve son kontroller bekliyor. Devam edecek AI için [BOOK_SUMMARIES_HANDOFF.md](BOOK_SUMMARIES_HANDOFF.md).

```bash
node tools/validate.mjs   # içeriği doğrula
node tools/vocab.mjs      # sözlükte eksik kelimeleri listele
node tools/build.mjs      # data/ paketlerini üret
node tools/review-content.mjs # değişen yeni metinleri denetle (commit öncesi)
node tools/smoke.mjs      # geçici Edge/Chrome ile masaüstü ve mobil kontrolleri
```
