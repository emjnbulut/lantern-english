# Kitap özetleri — en son AI devir notu

11 Ekim 2026. Kullanıcı limit nedeniyle **canlı siteye aktarımı yarıda bırakıp başka AI'a devretmemizi** istedi. Yeni yazım ve yayın durduruldu; eldeki dosyalar GitHub'a kaydediliyor. Bu görev için Sites yayını yapılmadı.

## Kullanıcının istediği ve kapsam

Dracula (Bram Stoker), Dönüşüm (Franz Kafka), Hayvan Çiftliği (George Orwell) ve Frankenstein (Mary Shelley) için İngilizce, yaklaşık **30–40 dakikalık** özgün özetler; seviyeyi AI seçebilir. Astra tercih edildi, üç Astra ajanı paralel çalıştı. Dördü siteye eklenmeli; son kullanıcı talebi bu işi şimdilik durdurup devretmek.

Kullanıcı ayrıca A2–B1 için Pinokyo ve Ömer Seyfettin benzeri eserler **yalnızca önerilsin** dedi; bu eserleri yazmak/eklemek yetkilendirilmedi. A2–B1 yeni içerik dosyaları oluşturulmadı. Öneri adayları: sadeleştirilmiş İngilizceyle Pinokyo A2, Oz Büyücüsü A2, Alice Harikalar Diyarında B1, Define Adası B1, Gizli Bahçe B1; Ömer Seyfettin'den Kaşağı B1, Forsa A2/B1, Yüksek Ökçeler A2/B1. Bunlar orijinal kitapların CEFR dereceleri değil, düşünülen uyarlama düzeyleridir.

## Hazır metinler

| Dosya | Seviye | Kelime | Yaklaşık süre |
|---|---|---:|---:|
| content/summaries/dracula.json | B2 | 4.524 | 35 dk |
| content/summaries/the-metamorphosis.json | C1 | 5.182 | 35 dk |
| content/summaries/frankenstein.json | C1 | 4.921 | 33 dk |

Tümü `type: "summary"`, `author: "Lantern Editorial"`; kitap yazarı ve künye `work` içinde, güvenilir kaynak `source` içinde. Beş açıklamalı quiz, dört seçenek, sekiz metinle eşleşen ifade; 8–12 bölüm. Dracula 11, Kafka 10, Frankenstein 10 bölüm. Süreler B2=130 ve C1=150 kelime/dakika hesabıyla yaklaşık.

Dracula kaynak: https://www.gutenberg.org/ebooks/345. Film ayrıntıları kullanılmadı; final iki bıçak, gündüz güç sınırı doğru işlendi.

Kafka kaynak: **Almanca kamu malı metin** https://www.gutenberg.org/ebooks/22367. Gutenberg #5200'ün David Wyllie İngilizce çevirisi telifli işaretlendiği için yeniden kullanılmadı. `work.titleEnglish` alanı stop sonrası kısa düzeltmeyle `work.title` yapıldı. Gregor'un dönüşümünün nedeni ve kesin böcek türü uydurulmadı.

Frankenstein kaynak: https://www.gutenberg.org/ebooks/84, **1831 metni**. `work.year=1818`, `work.editionYear=1831`. Elizabeth biyolojik kuzen değildir; aileye alınmıştır. Walton yaratığın kendisini yakacağını söylemesini duyar, ölümünü görmez. Bu ayrımlar metin ve quizde korundu.

Dracula ajanı diğer iki özeti kısa salt okunur incelemede önemli olay/quiz/seviye hatası bulmadığını bildirdi; tam kaynak karşılaştırması tamamlanmadı. Son AI metinleri bağımsız olarak tekrar gözden geçirsin.

## Hazır olmayan metin

**Hayvan Çiftliği / Animal Farm henüz yazılmadı. Diskte dosya veya yarım taslak yok.** Önerilen id `animal-farm`, type summary, level B2, genre fable, work `{title:"Animal Farm",titleTr:"Hayvan Çiftliği",author:"George Orwell",year:1945}`.

Hedef 4.500–5.000 kelime (35–38 dk), 8–12 bölüm, sekiz exact expression, beş soru/4 seçenek/Türkçe açıklama. Kaynak: https://www.orwellfoundation.com/the-orwell-foundation/orwell/books-by-orwell/animal-farm/. Romanın telifi bazı ülkelerde sürer: birkaç yüz kelimelik üst düzey olay özeti + ağırlıklı özgün edebî inceleme/öğrenme rehberi oluştur; kitabı sahne sahne yeniden yazma, Orwell'in sloganlarını veya şarkı sözlerini kopyalama. `source.license` özeti özgün inceleme olarak açıklamalı, kaynak kitabı gelişigüzel kamu malı saymamalı.

## Sözlük

- content/dict/summary-dracula.json: 53 lemma; ajanın yeni metin kelime taramasında çözümlenemeyen küçük harfli gerçek biçim kalmadı.
- content/dict/summary-frankenstein.json: 112 lemma; aynı kapsamda eksik 0 bildirildi.
- Kafka sözlük taraması **yapılmadı**; `summary-kafka-orwell.json` **oluşturulmadı**. Kafka ve yazılacak Animal Farm için yeni kelimeleri tarayıp doğru kök/Türkçe karşılıkları ekle.
- Önceki oturumun tüm kitaplık sözlük eksikleri ayrıca devam ediyor; eski 451 sayısı bu güncelleme için geçerli bir ölçüm sayılmamalı. `vocab.mjs` artık summaries'i de tarıyor.

## Kaydedilen entegrasyon

- `content/summaries/` ve `type: "summary"` loadAll/validate/build/vocab tarafından destekleniyor; gerekli work/source alanları doğrulanıyor.
- `#summaries` / **Kitap Özetleri** menüsü ve ayrı koleksiyon; filtre anahtarı `lantern.summaryFilters`.
- Ana sayfada ayrı giriş kartı ve klasik özetler alanı; hikâye/makale/özet sayıları ayrık.
- Kartlar kitabın gerçek yazarını ve Kitap özeti etiketini gösterir; okuyucuda eser künyesi, özetin özgün İngilizce olduğu, spoiler bildirimi ve doğru kaynak yer alır.
- Türkçe kitap adları/kitap yazarları aranabilir; özet okuyucusu yalnızca özet önerir. Okuma kaydı, kelime ipucu ve quiz mevcut sistem üzerinden çalışır.
- CSS üçüncü giriş kartı ve mobil koleksiyon sekmeleri için uyarlandı.
- `review-content.mjs` yeni özetlerde 30–40 dakika kelime aralığı, 8–12 bölüm ve quiz/ifade eşleşmelerini denetler.
- `smoke.mjs` kitap özetlerine ilişkin yeni kontroller içerir ama **çalıştırılmadı**. Dört talep edilen id'yi zorunlu saydığı için Animal Farm yokken başarısız olacaktır. Diğer kontroller tüm metnin render edilmesi, yazar/Türkçe başlık araması, filtrelerin ayrılığı, özet önerileri, spoiler/aktif menü, quiz ve mobil taşmayı kapsar.

## Devam sırası

1. Bu notu, AGENTS.md, CONTENT_SPEC.md ve HOSTING.md'yi oku. GitHub `main` dalının en son halini kullan.
2. Üç metni gözden geçir; Kafka sözlüğünü tamamla. Animal Farm'ı yaz ve kontrol et.
3. `node tools/validate.mjs`, `node tools/review-content.mjs` (commit öncesi), `node tools/vocab.mjs`, `node tools/build.mjs`, `node tools/smoke.mjs`, `git diff --check`.
4. Masaüstü/mobil ekran görüntülerini görsel incele. Yeni browser testinde `.w` sayımının kelime sayısı ile karşılaştırılması ilk kez çalıştırılacak; başarısızsa gerçek render veya sayım farkını araştır.
5. GitHub'a kaynaklar ve üretilmiş data/ paketleri birlikte kaydedilmeli.
6. Mevcut Sites projesine aktar ve yayınla. Yeni Site oluşturma; owner-private erişimi koru.

## Yayın ve çalışma klasörleri

Canlı mevcut sürüm: **https://lantern-english.copperlion512.chatgpt.site**. Önceki 27 hikâye/16 makaleli sürüm yayında; kitap özetleri **henüz aktarılmadı**.

Ana GitHub checkout: `C:\Users\emin\lantern-english`. Sites checkout: `C:\Users\emin\lantern-english-hosting`. Project ID: `appgprj_6acb729e41bc819184448062a91f9491` (manifestten aynen al). Bu görev başında get_site owner/private access'i doğruladı, source helper mevcut hosting checkoutunu açtı; başlangıç Sites commit `f701d5af0394576f9751c7ac3d9afd54a8afb3cc`. Hosting checkoutuna bu görevin yeni kaynakları henüz kopyalanmadı. Açma işlemi yeni save/deploy yapmadı.

Kısa ömürlü credential yalnız oturum belleğinde tutuldu, dosyaya yazılmadı. Sonraki AI aynı proje için **yeni source write credential** almalı. Kaynakları hosting checkoutuna `.git` ve manifesti ezmeden taşı, dist'yi güncelle, Site source helper ile exact commit/push/package yap. Windows'ta Git Bash PATH ve TAR_OPTIONS=--force-local gerekir; ayrıntı HOSTING.md ve Sites skill içinde.

## Durdurma sırasında yapılan kontroller

Dracula ve Frankenstein kendi ajanınca kelime/ifade/sözlük kontrolünden geçti. Kafka phrase düzeltmeleri tamamlandı; metadata root tarafından düzeltildi. Stop sonrasında `review-content.mjs` üç özet için **OK** verdi; `build.mjs` şema doğrulamasından geçip **27 hikâye, 16 makale, 3 özet ve 6.852 sözlük maddesi** üretti. Uygulama JS ve smoke script syntax kontrolleri geçti; `git diff --check` temiz. Stop sırasında tam browser QA ve yeni yayın yapılmadı. Bu kayıt, dört kitabın tamamlandığı veya canlı sitede bulunduğu anlamına gelmez.
