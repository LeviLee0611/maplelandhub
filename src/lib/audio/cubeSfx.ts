// 큐브 사용 효과음 — 외부 오디오 파일 없이 Web Audio API로 직접 합성.
// 브라우저 자동재생 정책 때문에 반드시 사용자 클릭 등 제스처 핸들러 안에서 호출할 것.

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedContext) sharedContext = new AudioContextClass();
  if (sharedContext.state === "suspended") void sharedContext.resume();
  return sharedContext;
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number, gain: number, type: OscillatorType) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gainNode).connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/** 큐브를 깨는 "퉁" 타격음 — 클릭 즉시 재생. */
export function playCubeImpactSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  playTone(ctx, 90, now, 0.22, 0.3, "sine");
  playTone(ctx, 140, now, 0.12, 0.15, "triangle");
}

/** 결과 공개 시 반짝이는 상승 아르페지오. */
export function playCubeRevealSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5-E5-G5-C6
  notes.forEach((freq, index) => {
    playTone(ctx, freq, now + index * 0.06, 0.35, 0.12, "sine");
  });
}

/** 등급 상승 연출("에픽 -> 유니크 -> 레전드리") 한 단계마다 재생하는 "띵" 소리 — 등급이 높을수록 음이 높아짐. */
export function playCubeGradeUpSound(grade: number) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const base = 392 + grade * 110; // 등급이 오를수록 음정 상승
  playTone(ctx, base, now, 0.28, 0.22, "triangle");
  playTone(ctx, base * 2, now + 0.02, 0.2, 0.1, "sine");
}
