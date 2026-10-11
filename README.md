# Lantern · Hikâyelerle İngilizce

Türkçe konuşanlar için, seviyeli hikâyelerle İngilizce öğreten koyu temalı statik bir web sitesi.
Herhangi bir kelimenin üzerine gelince (telefonda dokununca) Türkçe anlamı çıkar.

**Çalıştırmak için:** `index.html` dosyasını tarayıcıda açman yeterli. Sunucu ya da kurulum gerekmez.

## Özellikler
- **Kütüphane:** seviye (A1–C2), tür (komedi, gizem, korku, macera, romantik, bilim kurgu, fabl, dram) ve uzunluk (kısa / orta / uzun) filtreleri, arama, sıralama.
- **Kelime ipucu:** her kelimede Türkçe anlam, kök (ör. *went ← go*), metne özel anlam ve kalıp ifadeler. Tıklayınca kutu sabitlenir: sesli telaffuz, deftere ekleme, Tureng bağlantısı.
- **Kelime Defterim:** kaydedilen kelimeler geçtikleri cümleyle saklanır; aralıklı tekrar kartları (Leitner) ve Anki'ye kopyalama.
- **Okuma araçları:** sesli okuma (paragraf vurgulu), yazı boyutu, okuma ilerlemesi ve kaldığın yerden devam, hikâye sonunda anlama soruları ve ifade listesi.
- **Makaleler:** B2–C2 okurlar için her türe özel özgün denemeler.
- **Telifsiz içerik:** klasikler Project Gutenberg'den (kamu malı) kısaltılmadan alındı; A1–B1 hikâyeleri, makaleler ve sözlük Lantern için yazıldı.

## Geliştirilmiş prompt (projenin çıkış noktası)
> Türk öğrenciler için koyu temalı, ne çok sade ne çok karmaşık, rahat gezilen bir "hikâyelerle İngilizce" sitesi tasarla.
> Hikâyeler kısa / orta / uzun olsun; her biri türüne (roman tadında sürükleyici anlatılar, komedi, gizem, korku, macera, romantik, bilim kurgu, fabl, dram) ve CEFR seviyesine (A1–C2) göre ayrılsın.
> Ayrı anahtar kelime listeleri yerine, her kelimenin üzerine gelindiğinde Türkçe anlamını gösteren küçük bir kutu olsun.
> İleri seviyeler için her türe özgü makaleler yazılsın. Kaynaklar açık ve telifsiz olsun (Project Gutenberg), alt seviyeler için özgün hikâyeler yazılsın.
> Ek fikirler: kelime defteri ve aralıklı tekrar kartları, sesli telaffuz ve sesli okuma, kalıp ifadelerin işaretlenmesi, anlama soruları, okuma ilerlemesi, seviyeye göre okuma süresi.

## Geliştirme
Bkz. [AGENTS.md](AGENTS.md) (yapay zekâ asistanları için devir rehberi) ve [CONTENT_SPEC.md](CONTENT_SPEC.md) (içerik formatı).

```bash
node tools/validate.mjs   # içeriği doğrula
node tools/vocab.mjs      # sözlükte eksik kelimeleri listele
node tools/build.mjs      # data/ paketlerini üret
```
