# astamvalley.github.io

개인 실험 사이트. Next.js + React 기반의 인터랙티브 labs와 게임 모음입니다.

## Labs

| 이름 | 설명 |
|------|------|
| [pretext](app/labs/pretext/) | DOM reflow 없이 텍스트를 측정하고 배치. wave / scatter / reflow / ripple / glitch / gravity / flow / vortex / crater 실험. `@chenglou/pretext` 기반. |
| [matter](app/labs/) | Matter.js 2D 물리 엔진 실험. 중력, 충돌, 마우스 인터랙션. |

## Games

| 이름 | 설명 |
|------|------|
| [suika](app/games/suika/) | 수박게임 모티브. 같은 크기끼리 충돌하면 합쳐져 더 큰 원이 된다. Matter.js 물리 엔진 기반. |

## 스택

- Next.js 16 · React 19 · TypeScript
- Tailwind CSS v4
- `@chenglou/pretext` — DOM reflow 없는 텍스트 측정 라이브러리
- Matter.js — 2D 물리 엔진

## 로컬 실행

```bash
pnpm dev
```
