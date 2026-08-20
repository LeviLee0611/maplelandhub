import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearLocalTrackers, loadLocalTrackers, saveLocalTrackers } from "@/components/QuestBoard";

// QuestBoard의 로컬스토리지 헬퍼(loadLocalTrackers/saveLocalTrackers/clearLocalTrackers)는
// 비로그인 유저의 퀘스트 담기/완료 상태를 브라우저에 영속화하는 핵심 로직이다. vitest 기본
// 환경은 jsdom이 아니라 node라 실제 window/localStorage가 없으므로, 여기서만 최소한의
// in-memory localStorage를 window에 꽂아 실제 저장/복원 흐름을 검증한다.
class FakeLocalStorage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
}

let fakeWindow: { localStorage: FakeLocalStorage };

beforeEach(() => {
  fakeWindow = { localStorage: new FakeLocalStorage() };
  (globalThis as unknown as { window: typeof fakeWindow }).window = fakeWindow;
});

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("loadLocalTrackers / saveLocalTrackers — 새로고침 복원", () => {
  it("아무것도 저장 안 된 상태에서는 빈 Map", () => {
    expect(loadLocalTrackers().size).toBe(0);
  });

  it("저장한 뒤 다시 불러오면 동일한 담기/완료 상태가 복원됨(새로고침 시나리오)", () => {
    const map = new Map();
    map.set(2009, { id: "local:2009", quest_id: 2009, is_completed: false });
    map.set(2010, { id: "local:2010", quest_id: 2010, is_completed: true });
    saveLocalTrackers(map);

    // saveLocalTrackers가 저장한 원본 Map 인스턴스가 아니라, "새로고침 후 다시 읽었을 때"를
    // 흉내내기 위해 loadLocalTrackers를 별도로 호출.
    const restored = loadLocalTrackers();
    expect(restored.size).toBe(2);
    expect(restored.get(2009)?.is_completed).toBe(false);
    expect(restored.get(2010)?.is_completed).toBe(true);
    expect(restored.get(2009)?.quest_id).toBe(2009);
  });

  it("담기 해제(Map에서 제거) 후 저장하면 복원 시에도 사라져 있음", () => {
    const map = new Map();
    map.set(2009, { id: "local:2009", quest_id: 2009, is_completed: false });
    saveLocalTrackers(map);

    map.delete(2009);
    saveLocalTrackers(map);

    expect(loadLocalTrackers().size).toBe(0);
  });

  it("손상된 JSON이 저장돼 있어도 에러 없이 빈 Map으로 폴백", () => {
    fakeWindow.localStorage.setItem("mrhub:quest-tracker:v1", "{이건 JSON이 아님");
    expect(loadLocalTrackers().size).toBe(0);
  });

  it("window가 없는 환경(SSR)에서는 조용히 빈 Map — 예외를 던지지 않음", () => {
    delete (globalThis as { window?: unknown }).window;
    expect(() => loadLocalTrackers()).not.toThrow();
    expect(loadLocalTrackers().size).toBe(0);
  });
});

describe("clearLocalTrackers — 로그인 시 이전 완료 후 정리", () => {
  it("저장된 로컬 트래킹을 전부 지움", () => {
    const map = new Map();
    map.set(2009, { id: "local:2009", quest_id: 2009, is_completed: false });
    saveLocalTrackers(map);
    expect(loadLocalTrackers().size).toBe(1);

    clearLocalTrackers();

    expect(loadLocalTrackers().size).toBe(0);
  });
});
