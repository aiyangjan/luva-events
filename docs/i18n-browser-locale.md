# 浏览器语言自动切换：稳定做法梳理

## 结论（要快、要稳，别纯手搓）

Next.js App Router 推荐直接用 **`next-intl`**（中间件 + 路由），不要自己解析 `Accept-Language`。

检测优先级（官方默认）：

1. URL 前缀（如 `/zh/create`、`/en/create`）
2. Cookie（用户上次手动选的语言）
3. 浏览器 `Accept-Language`
4. `defaultLocale` 兜底

匹配算法用 `@formatjs/intl-localematcher` 的 **best-fit**（比 RFC lookup 更合理，例如 `en-GB` 能落到 `en`）。

---

## 必读文档

| 内容 | 链接 |
|---|---|
| next-intl 中间件 / 语言检测 | https://next-intl.dev/docs/routing/middleware |
| App Router + 带 locale 路由 | https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing |
| App Router 不带 URL 前缀 | https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing |
| Next.js 官方 i18n 路由说明 | https://nextjs.org/docs/app/building-your-application/routing/internationalization |
| Accept-Language 协商库 | https://formatjs.io/docs/polyfills/intl-localematcher/ |

---

## 最小接入骨架（next-intl）

```ts
// src/i18n/routing.ts
import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localeDetection: true // 开浏览器语言 + cookie
});
```

```ts
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
```

文案放 `messages/zh.json`、`messages/en.json`，页面用 `useTranslations()` / `getTranslations()`。

切换语言：跳到对应前缀路由（或 `next-intl` 的 `useRouter().replace`），cookie 会自动更新。

---

## 为什么不要纯手搓

| 手搓常见坑 | 成熟方案怎么躲 |
|---|---|
| 只看 `navigator.language`，首屏闪一下错语言 | 中间件在**服务端**用 `Accept-Language` 定语言 |
| 自己拆 `zh-CN,zh;q=0.9` 容易错 | `negotiator` + `intl-localematcher` |
| 刷新丢语言 | Cookie / URL 持久化 |
| SEO / 分享链接语言乱 | URL 带 `/zh` `/en` |

---

## 和当前 Luva 的关系

- 现在：自研 `LocaleProvider` + `localStorage`（可用，但非行业标准栈）
- 已加：`negotiator` + `@formatjs/intl-localematcher` 中间件写 cookie（与 next-intl 同款协商库）
- 长期：整站迁到 **next-intl** 最稳；文案 JSON 化后几乎不用维护协商逻辑

迁移成本：主要是把 `t("key")` / `i18n.ts` 字典挪到 `messages/*.json`，并加 `[locale]` 路由段。
