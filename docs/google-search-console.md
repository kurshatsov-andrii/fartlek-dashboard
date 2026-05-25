# Google Search Console (GSC)

## Sitemap

Після деплою сайт віддає динамічний sitemap:

- **URL:** `https://<ваш-домен>/sitemap.xml`
- **robots.txt:** `https://<ваш-домен>/robots.txt` (містить посилання на sitemap)

У sitemap входять головна, `/tools/pace`, `/contacts`, `/assistant` і всі сторінки подій `/event/[slug]`.

Переконайтеся, що в продакшені задано **`NEXT_PUBLIC_SITE_URL`** — саме цей origin потрапляє в `sitemap.xml` і `robots.txt` (наприклад `https://fartlek-dashboard.vercel.app`).

## Додати сайт у GSC

1. Відкрийте [Google Search Console](https://search.google.com/search-console).
2. **Додати ресурс** → вкажіть **URL-префікс** вашого продакшен-домену (той самий, що в `NEXT_PUBLIC_SITE_URL`).
3. Оберіть спосіб підтвердження **HTML-тег**.
4. Скопіюйте значення атрибута `content` (довгий рядок без лапок).
5. Додайте в `.env.local` / змінні Vercel:

   ```env
   GOOGLE_SITE_VERIFICATION=ваш_токен_з_gsc
   ```

6. Задеплойте сайт і натисніть **Підтвердити** в GSC.
7. У меню **Файли Sitemap** → **Додати нову карту сайту** → введіть:

   ```
   sitemap.xml
   ```

   (повний URL: `https://<ваш-домен>/sitemap.xml`)

## Перевірка локально

```bash
curl -s http://localhost:3000/sitemap.xml | head -20
curl -s http://localhost:3000/robots.txt
```

На localhost у sitemap буде fallback `https://fartlek-dashboard.vercel.app`, якщо `NEXT_PUBLIC_SITE_URL` не задано.
