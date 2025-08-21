import React, { useEffect, useMemo, useState } from "react";
import { Search, Grid3x3, ListTree, ExternalLink, Link as LinkIcon, Filter, ArrowUpDown, Copy } from "lucide-react";

/**
 * apps.huny.dev
 * ------------------------------------------------------------
 * 한 페이지에서 여러 웹앱(서브도메인)을 카드로 모아 보여주는 React 컴포넌트.
 * - 썸네일 / 제목 / 주소 / 설명 표시
 * - 카테고리별 그룹핑 (없으면 "그룹없음")
 * - 정렬: 이름(서브도메인)순, 카테고리→이름
 * - 검색: 제목/설명/주소/서브도메인 전체 검색
 * - 간단한 상태는 localStorage로 기억
 * - /apps.json 파일이 있으면 원격 데이터 사용 (없으면 내장 예시 데이터)
 */

// 타입 정의
export type AppItem = {
  title: string;
  url: string;
  description?: string;
  category?: string; // 없으면 "그룹없음"으로 분류
  thumbnail?: string; // 선택
};

type SortMode = "name" | "category"; // 이름(서브도메인) / 카테고리→이름

type ViewMode = "grouped" | "flat"; // 그룹 보기 / 전체 보기

const UNCATEGORIZED = "그룹없음";

// 내장 예시 데이터 (apps.json이 없을 때 사용)
const FALLBACK_APPS: AppItem[] = [
  {
    title: "Studio",
    url: "https://studio.huny.dev",
    description: "내 웹앱 포털(미리보기)",
    category: "포털",
  },
  {
    title: "Sites",
    url: "https://sites.huny.dev",
    description: "도메인 링크 & 설명 집합",
    category: "도구",
  },
  {
    title: "TTS Lab",
    url: "https://tts.huny.dev",
    description: "텍스트-음성 합성 관련 실험실",
    category: "AI / 오디오",
  },
  {
    title: "VC Demo",
    url: "https://vc.huny.dev",
    description: "Voice Conversion 데모",
    category: "AI / 오디오",
  },
  {
    title: "Docs",
    url: "https://docs.huny.dev",
    description: "문서/메모 더미",
    category: "문서",
  },
  {
    title: "Playground",
    url: "https://lab.huny.dev",
    description: "각종 실험",
    // 카테고리 없음 → "그룹없음" 처리
  },
];

function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getSubdomainForSort(url: string): string {
  const host = getHostname(url);
  // huny.dev 하위 서브도메인은 첫 레이블을 서브도메인 이름으로 사용
  if (host.endsWith("huny.dev")) {
    const parts = host.split(".");
    if (parts.length >= 3) return parts[0];
    return host; // apex 도메인 등 예외
  }
  // 외부 도메인은 host 전체를 사용
  return host;
}

function initialsFrom(text: string): string {
  const t = text.trim();
  if (!t) return "?";
  const parts = t.split(/\s+|\.|-/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

function hashToHsl(s: string): { h: number; s: number; l: number } {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return { h: h % 360, s: 65, l: 50 };
}

function PlaceholderThumb({ seed, label }: { seed: string; label: string }) {
  const { h, s, l } = hashToHsl(seed);
  const bg = `hsl(${h} ${s}% ${l}%)`;
  return (
    <div
      className="w-full aspect-[16/9] rounded-xl flex items-center justify-center text-white/90 text-xl font-semibold shadow-inner"
      style={{ background: bg }}
    >
      {label}
    </div>
  );
}

function AppCard({ app }: { app: AppItem }) {
  const host = getHostname(app.url);
  const sub = getSubdomainForSort(app.url);
  const thumb = app.thumbnail;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(app.url);
    } catch {}
  };

  return (
    <div className="group rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur p-4 hover:shadow-lg transition-shadow">
      {thumb ? (
        <img
          src={thumb}
          alt={app.title}
          className="w-full aspect-[16/9] object-cover rounded-xl mb-3"
          loading="lazy"
        />
      ) : (
        <PlaceholderThumb seed={host} label={initialsFrom(sub)} />
      )}

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold truncate" title={app.title}>
              {app.title}
            </h3>
            {app.category ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200/60 dark:border-white/10">
                {app.category}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
                {UNCATEGORIZED}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1" title={app.url}>
            <LinkIcon className="inline w-4 h-4 mr-1 -mt-0.5" /> {host}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => window.open(app.url, "_blank")}
            className="px-3 py-1.5 rounded-lg border border-gray-200/70 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-sm flex items-center gap-1"
            title="새 탭에서 열기"
          >
            <ExternalLink className="w-4 h-4" /> 열기
          </button>
          <button
            onClick={onCopy}
            className="p-2 rounded-lg border border-gray-200/70 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10"
            title="주소 복사"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {app.description && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 line-clamp-3">{app.description}</p>
      )}
    </div>
  );
}

function FlatGrid({ apps }: { apps: AppItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {apps.map((a, i) => (
        <AppCard key={`${a.url}-${i}`} app={a} />
      ))}
    </div>
  );
}

function GroupedGrid({ groups }: { groups: { key: string; items: AppItem[] }[] }) {
  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.key}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
            {g.key}
            <span className="text-xs text-gray-500 ml-2">{g.items.length}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {g.items.map((a, i) => (
              <AppCard key={`${g.key}-${a.url}-${i}`} app={a} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function App() {
  const [apps, setApps] = useState<AppItem[] | null>(null);
  const [query, setQuery] = usePersistentState<string>("appsHub:query", "");
  const [sort, setSort] = usePersistentState<SortMode>("appsHub:sort", "name");
  const [view, setView] = usePersistentState<ViewMode>("appsHub:view", "grouped");
  const [category, setCategory] = usePersistentState<string>("appsHub:category", "전체");
  const [loadError, setLoadError] = useState<string | null>(null);
  useEffect(() => {
    document.title = "apps.huny.dev";
  }, []);

  // 데이터 로드: /apps.json → 없으면 FALLBACK_APPS
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadError(null);
        const res = await fetch("/apps.json", { cache: "no-store" });
        if (!res.ok) throw new Error("apps.json 응답 에러");
        const data = await res.json();
        const list: AppItem[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.apps)
          ? (data as any).apps
          : [];
        if (list.length === 0) throw new Error("apps.json 비어있음");
        if (!cancelled) setApps(list);
      } catch (e: any) {
        if (!cancelled) {
          setApps(FALLBACK_APPS);
          setLoadError(
            "원격 apps.json을 불러오지 못해 내장 예시 데이터를 표시합니다. (배포 시 /apps.json을 루트에 두세요)"
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalized = useMemo(() => {
    const list = apps ?? [];
    const q = query.trim().toLowerCase();
    const filtered = list.filter((a) => {
      const host = getHostname(a.url);
      const sub = getSubdomainForSort(a.url);
      const hay = [a.title, a.description ?? "", a.url, host, sub].join("\n").toLowerCase();
      const cat = (a.category ?? UNCATEGORIZED).toLowerCase();
      const passQuery = q ? hay.includes(q) : true;
      const passCat = category === "전체" ? true : cat === category.toLowerCase();
      return passQuery && passCat;
    });

    const nameSorted = [...filtered].sort((a, b) => {
      const sa = getSubdomainForSort(a.url).toLowerCase();
      const sb = getSubdomainForSort(b.url).toLowerCase();
      return sa.localeCompare(sb, undefined, { numeric: true });
    });

    if (sort === "name") return nameSorted;

    // 카테고리 → 이름 정렬
    return [...filtered].sort((a, b) => {
      const ca = (a.category ?? UNCATEGORIZED).toLowerCase();
      const cb = (b.category ?? UNCATEGORIZED).toLowerCase();
      if (ca !== cb) return ca.localeCompare(cb, undefined, { numeric: true });
      const sa = getSubdomainForSort(a.url).toLowerCase();
      const sb = getSubdomainForSort(b.url).toLowerCase();
      return sa.localeCompare(sb, undefined, { numeric: true });
    });
  }, [apps, query, sort, category]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of apps ?? []) set.add(a.category ?? UNCATEGORIZED);
    return ["전체", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [apps]);

  // 그룹핑 뷰용: 카테고리 → 목록
  const grouped = useMemo(() => {
    const map = new Map<string, AppItem[]>();
    for (const a of normalized) {
      const key = a.category ?? UNCATEGORIZED;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    // 그룹 키 정렬(카테고리 이름순)
    const keys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    return keys.map((k) => ({ key: k, items: map.get(k)! }));
  }, [normalized]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 dark:from-zinc-950 dark:to-zinc-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">apps.huny.dev</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              huny.dev 하위(및 관련) 웹앱들을 한곳에서 빠르게 찾아 열어보세요.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="검색 (제목/설명/주소)"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortMode)}
                  className="appearance-none h-10 pl-10 pr-10 rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-full whitespace-nowrap"
                  title="정렬 기준"
                >
                  <option value="name">이름(서브도메인)순</option>
                  <option value="category">카테고리→이름</option>
                </select>
                <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>

              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="appearance-none h-10 pl-10 pr-10 rounded-xl border border-gray-200/70 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-full whitespace-nowrap"
                  title="카테고리 필터"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>

              <div className="flex rounded-xl overflow-hidden border border-gray-200/70 dark:border-white/10 shrink-0">
                <button
                  onClick={() => setView("grouped")}
                  className={`inline-flex items-center gap-1 px-3 h-10 text-sm whitespace-nowrap leading-none ${
                    view === "grouped" ? "bg-gray-100 dark:bg-white/10" : "bg-white/0"
                  }`}
                  title="그룹으로 보기"
                >
                  <ListTree className="w-4 h-4" /> 그룹
                </button>
                <button
                  onClick={() => setView("flat")}
                  className={`inline-flex items-center gap-1 px-3 h-10 text-sm whitespace-nowrap leading-none ${
                    view === "flat" ? "bg-gray-100 dark:bg-white/10" : "bg-white/0"
                  }`}
                  title="전체 목록으로 보기"
                >
                  <Grid3x3 className="w-4 h-4" /> 전체
                </button>
              </div>
            </div>
          </div>
        </header>

        {loadError && (
          <div className="mb-4 text-sm rounded-xl border border-yellow-300/70 bg-yellow-50 text-yellow-900 p-3">
            {loadError}
          </div>
        )}

        {/* 본문 */}
        {apps === null ? (
          <div className="py-20 text-center text-gray-600 dark:text-gray-300">로딩 중…</div>
        ) : normalized.length === 0 ? (
          <div className="py-20 text-center text-gray-600 dark:text-gray-300">검색/필터 조건에 맞는 항목이 없습니다.</div>
        ) : view === "flat" ? (
          <FlatGrid apps={normalized} />
        ) : (
          <GroupedGrid groups={grouped} />
        )}

        <footer className="mt-10 text-xs text-gray-600 dark:text-gray-400">
          <p>
            /apps.json을 루트에 배치하면 해당 데이터를 자동으로 불러옵니다. (필드: title, url, description?, category?, thumbnail?)
          </p>
        </footer>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Lightweight Dev Tests (console only)
// ------------------------------------------------------------
function runDevTests() {
  const tests: Array<[string, () => boolean]> = [
    ["getHostname: studio.huny.dev", () => getHostname("https://studio.huny.dev/x") === "studio.huny.dev"],
    ["getSubdomainForSort: studio", () => getSubdomainForSort("https://studio.huny.dev") === "studio"],
    ["getSubdomainForSort: apex", () => getSubdomainForSort("https://huny.dev") === "huny.dev"],
    ["initialsFrom: 'Voice Conversion' => VC", () => initialsFrom("Voice Conversion") === "VC"],
    ["initialsFrom: 'Studio' => S", () => initialsFrom("Studio") === "S"],
    ["hashToHsl: hue range", () => {
      const { h } = hashToHsl("test");
      return h >= 0 && h < 360;
    }],
  ];
  // group output
  if (typeof console !== "undefined") {
    console.groupCollapsed?.("apps.huny.dev – dev tests");
    let passed = 0;
    for (const [name, fn] of tests) {
      let ok = false;
      try {
        ok = !!fn();
      } catch {}
      if (!ok) console.error("❌", name);
      else {
        console.log("✅", name);
        passed++;
      }
    }
    console.log(`${passed}/${tests.length} tests passed.`);
    console.groupEnd?.();
  }
}

// 자동 실행 (옵션으로 끌 수 있음)
try {
  if (typeof window !== "undefined" && (window as any).__APPS_HUB_TESTS__ !== false) {
    runDevTests();
  }
} catch {}
