/**
 * 몬스터 아이콘 점검 도구.
 *
 * 브라우저의 onError는 "HTTP 실패"만 잡는다. maplestory.io는 아이콘이 없는 mobId에도
 * 200 + 1x1 투명 PNG를 돌려주기 때문에(2026-09-10 미믹 8220036 사례), 로드는 성공하지만
 * 화면엔 아무것도 안 보이는 상태가 된다. 그래서 이 도구는 HTTP 상태뿐 아니라
 * **실제 이미지 크기(PNG IHDR)**까지 검사한다.
 *
 * 기본 URL이 실패하면 런타임 폴백 체인과 같은 순서로 후보를 시도해, 어떤 region/version이
 * 실제로 되는지까지 기록한다.
 *
 * 실행:
 *   node scripts/check-mob-icons.mjs                 # 출시 필터 통과 몬스터 전체
 *   node scripts/check-mob-icons.mjs --limit 50      # 앞 50종만
 *   node scripts/check-mob-icons.mjs --out report.json
 */

import fs from "fs/promises";
import path from "path";

const MONSTERS_PATH = path.resolve("data/monsters.json");
const RELEASE_FILTERS_PATH = path.resolve("data/release-filters.json");
const MAPLESTORY_IO_PATH = path.resolve("src/lib/maplestory-io.ts");

// src/lib/maplestory-io.ts의 기본 URL/폴백 체인과 동일하게 유지할 것.
const PRIMARY = { region: "gms", version: "100" };
const FALLBACKS = [
  { region: "kms", version: "284" },
  { region: "gms", version: "92" },
  { region: "gms", version: "200" },
  { region: "gms", version: "255" },
  { region: "jms", version: "419" },
];

const CONCURRENCY = 8;
const USER_AGENT = "maplelandhub-icon-check";

function parseArg(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function iconUrl({ region, version }, mobCode) {
  return `https://maplestory.io/api/${region}/${version}/mob/${mobCode}/icon`;
}

/**
 * 런타임이 이미 처리 중인 mobCode를 읽어온다. 이걸 반영하지 않으면 이미 해결된 몬스터가
 * "전부 실패"로 오탐돼(정적 대체는 애초에 maplestory.io를 안 탄다) 리포트를 믿을 수 없게 된다.
 * 정규식으로 읽는 이유는 이 도구가 TS 빌드 없이 도는 일회성 점검용이기 때문.
 */
async function loadRuntimeIconHandling() {
  const source = await fs.readFile(MAPLESTORY_IO_PATH, "utf8");
  const readMap = (constName, valuePattern) => {
    const block = source.match(new RegExp(`${constName}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`));
    if (!block) return new Map();
    const entries = [...block[1].matchAll(new RegExp(`(\\d+)\\s*:\\s*${valuePattern}`, "g"))];
    return new Map(entries.map((match) => [Number(match[1]), match[2]]));
  };

  const preferredBlock = source.match(/MOB_ICON_PREFERRED_VERSION[^=]*=\s*\{([\s\S]*?)\n\};/);
  const preferredVersions = new Map(
    preferredBlock
      ? [...preferredBlock[1].matchAll(/(\d+)\s*:\s*\{\s*region:\s*"([^"]+)",\s*version:\s*"([^"]+)"\s*\}/g)].map(
          (match) => [Number(match[1]), { region: match[2], version: match[3] }],
        )
      : [],
  );

  return {
    staticOverrides: readMap("MOB_ICON_STATIC_OVERRIDES", `"([^"]+)"`),
    idAliases: readMap("MOB_ICON_ID_ALIASES", `(\\d+)`),
    preferredVersions,
  };
}

/** PNG IHDR에서 가로/세로를 읽는다. PNG가 아니면 null. */
function readPngSize(buffer) {
  if (buffer.length < 24) return null;
  const isPng =
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  if (!isPng) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function probe(candidate, mobCode) {
  try {
    const res = await fetch(iconUrl(candidate, mobCode), { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };

    const buffer = Buffer.from(await res.arrayBuffer());
    const size = readPngSize(buffer);
    if (!size) return { ok: false, reason: "not_png", bytes: buffer.length };
    // 1x1은 maplestory.io가 "이미지 없음" 대신 돌려주는 빈 PNG.
    if (size.width <= 1 && size.height <= 1) {
      return { ok: false, reason: "blank_1x1", bytes: buffer.length, ...size };
    }
    return { ok: true, bytes: buffer.length, ...size };
  } catch (err) {
    return { ok: false, reason: `error_${err?.name ?? "unknown"}` };
  }
}

async function checkMonster(monster, runtime) {
  const staticOverride = runtime.staticOverrides.get(monster.mobCode);
  if (staticOverride) {
    // 정적 이미지로 대체된 몬스터는 maplestory.io를 아예 안 탄다.
    return { ...monster, status: "static-override", via: staticOverride };
  }

  // 런타임이 다른 mobId로 조회하도록 별칭이 걸려 있으면 그 ID로 점검해야 실제 동작과 일치한다.
  const lookupCode = runtime.idAliases.get(monster.mobCode) ?? monster.mobCode;
  const aliased = lookupCode !== monster.mobCode ? lookupCode : undefined;

  // 런타임이 이 몬스터만 다른 버전으로 먼저 요청하도록 지정돼 있으면 그 버전이 곧 첫 요청이다.
  const preferred = runtime.preferredVersions.get(monster.mobCode);
  const first = preferred ?? PRIMARY;

  const primary = await probe(first, lookupCode);
  if (primary.ok) {
    return {
      ...monster,
      aliased,
      status: "ok",
      via: `${first.region}/${first.version}`,
      pinned: Boolean(preferred),
      detail: primary,
    };
  }

  for (const candidate of FALLBACKS) {
    const result = await probe(candidate, lookupCode);
    if (result.ok) {
      return {
        ...monster,
        aliased,
        status: "fallback",
        via: `${candidate.region}/${candidate.version}`,
        primaryReason: primary.reason,
        detail: result,
      };
    }
  }

  return { ...monster, aliased, status: "broken", primaryReason: primary.reason };
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await worker(items[index]);
        done++;
        if (done % 50 === 0 || done === items.length) {
          console.log(`  진행: ${done}/${items.length}`);
        }
      }
    }),
  );
  return results;
}

async function main() {
  const monsters = JSON.parse(await fs.readFile(MONSTERS_PATH, "utf8"));
  const filters = JSON.parse(await fs.readFile(RELEASE_FILTERS_PATH, "utf8"));
  const blocked = new Set(filters.blockedMobCodes ?? []);
  const allowed = new Set(filters.allowedMobCodes ?? []);
  const blockedMin = filters.blockedMobCodeMin ?? Infinity;

  const released = monsters.filter(
    (monster) =>
      typeof monster.mobCode === "number" &&
      !blocked.has(monster.mobCode) &&
      (allowed.has(monster.mobCode) || monster.mobCode < blockedMin),
  );

  const limit = Number(parseArg("--limit", "")) || released.length;
  const targets = released
    .slice(0, limit)
    .map((monster) => ({ mobCode: monster.mobCode, name: monster.name }));

  const runtime = await loadRuntimeIconHandling();
  console.log(
    `런타임 처리 반영: 정적 대체 ${runtime.staticOverrides.size}종, ID 별칭 ${runtime.idAliases.size}종, ` +
      `버전 지정 ${runtime.preferredVersions.size}종`,
  );
  console.log(`출시 필터 통과 ${released.length}종 중 ${targets.length}종 점검 시작...`);
  const results = await mapWithConcurrency(targets, CONCURRENCY, (monster) => checkMonster(monster, runtime));

  const ok = results.filter((r) => r.status === "ok");
  const staticOverride = results.filter((r) => r.status === "static-override");
  const fallback = results.filter((r) => r.status === "fallback");
  const broken = results.filter((r) => r.status === "broken");

  console.log("\n=== 요약 ===");
  console.log(`첫 요청 성공: ${ok.length} / ${results.length} (${((ok.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`정적 이미지 대체(외부 요청 안 함): ${staticOverride.length}`);
  console.log(`폴백으로 성공: ${fallback.length}`);
  console.log(`전부 실패: ${broken.length}`);

  if (fallback.length > 0) {
    console.log("\n--- 폴백으로만 되는 몬스터 (첫 요청 실패 사유 / 성공한 버전) ---");
    for (const item of fallback) {
      console.log(`  ${item.mobCode} ${item.name}: ${item.primaryReason} -> ${item.via}`);
    }
  }
  if (broken.length > 0) {
    console.log("\n--- 모든 후보 실패 (정적 대체나 별칭 필요) ---");
    for (const item of broken) {
      console.log(`  ${item.mobCode} ${item.name}: ${item.primaryReason}`);
    }
  }

  const outPath = parseArg("--out");
  if (outPath) {
    await fs.writeFile(path.resolve(outPath), `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`, "utf8");
    console.log(`\n리포트 저장: ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
