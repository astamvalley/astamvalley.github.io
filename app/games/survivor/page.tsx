'use client'

import { useEffect, useRef, useState } from 'react'
import BackLink from '@/app/components/BackLink'

// ── View ──────────────────────────────────────────────────────────
const W = 720
const H = 540

// ── Player ────────────────────────────────────────────────────────
const PLAYER_R = 6
const BASE_SPEED = 2.2
const BASE_MAX_HP = 100
const IFRAME_TICKS = 36

// ── Pickup ────────────────────────────────────────────────────────
const BASE_PICKUP_R = 36
const GEM_MAGNET_SPEED = 6

// ── Difficulty ────────────────────────────────────────────────────
const SPAWN_BASE = 90      // ticks between spawns at t=0
const SPAWN_FLOOR = 14     // min ticks between spawns
const SPAWN_DECAY = 0.92   // per 30s

// ── Types ─────────────────────────────────────────────────────────
type WeaponId =
  | 'missile'
  | 'whip'
  | 'aura'
  | 'orbit'
  | 'spread'
  | 'chain'
  | 'boomerang'
  | 'bomb'
  | 'scythe'
  // ── evolved (★) ───────────────────────────────
  | 'barrage'      // missile + crit
  | 'hellfire'     // spread + speed
  | 'severing'     // whip + damage
  | 'solar'        // aura + regen
  | 'gravity'      // orbit + magnet
  | 'tempest'      // chain + haste
  | 'eternity'     // boomerang + luck
  | 'singularity'  // bomb + hp
  | 'harvest'      // scythe + vampire

type PassiveId =
  | 'hp'
  | 'speed'
  | 'damage'
  | 'magnet'
  | 'haste'
  | 'regen'
  | 'vampire'
  | 'crit'
  | 'luck'

type CardId = WeaponId | PassiveId

type Stats = {
  damage: number       // multiplier
  speed: number        // multiplier
  haste: number        // cooldown multiplier (lower = faster)
  pickup: number       // multiplier
  regen: number        // hp per second
  maxHpBonus: number   // flat
  lifesteal: number    // fraction of damage healed
  crit: number         // crit chance 0..1
  critMul: number      // crit damage multiplier
  cardCount: number    // cards offered on level up (3 base, +1 per luck)
}

type Weapon = {
  id: WeaponId
  level: number
  timer: number
}

type EnemyKind =
  | 'walker' | 'fast' | 'tank' | 'shooter'
  | 'swarm' | 'bomber' | 'summoner' | 'splitter' | 'burster'

type Enemy = {
  x: number
  y: number
  hp: number
  maxHp: number
  speed: number
  damage: number
  r: number
  kind: EnemyKind
  hitFlash: number
  knockX: number
  knockY: number
  // optional per-kind state
  fireTimer?: number      // shooter
  summonTimer?: number    // summoner
  isMini?: boolean        // splitter offspring
}

type EnemyProj = {
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  r: number
  life: number
}

type Projectile = {
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  r: number
  pierce: number
  life: number
  weapon: WeaponId
  hit: Set<Enemy>
  // boomerang-specific
  returning?: boolean
  travelled?: number
  maxTravel?: number
}

type Bomb = {
  x: number
  y: number
  fuse: number
  maxFuse: number
  damage: number
  radius: number
}

type ChainBolt = {
  points: { x: number; y: number }[]
  life: number
}

type Orbit = {
  angle: number
  damage: number
  r: number
  hit: Map<Enemy, number>  // enemy -> cooldown ticks
}

type WhipSwipe = {
  x: number
  y: number
  dirX: number
  dirY: number
  life: number
  damage: number
  reach: number
  arc: number
  hit: Set<Enemy>
}

type AuraPulse = {
  x: number
  y: number
  life: number
  maxLife: number
  damage: number
  r: number
  hit: Set<Enemy>
}

type Gem = {
  x: number
  y: number
  value: number
  vx: number
  vy: number
}

type Heart = {
  x: number
  y: number
  heal: number
  big: boolean
  vx: number
  vy: number
  bob: number      // for floating animation
}

type FloatText = {
  x: number
  y: number
  text: string
  age: number
  ttl: number
  color: string
}

type GameState = {
  playerX: number
  playerY: number
  vx: number
  vy: number
  hp: number
  maxHp: number
  level: number
  xp: number
  xpToNext: number
  iframes: number
  facing: { x: number; y: number }
  stats: Stats
  weapons: Weapon[]
  passiveLv: Partial<Record<PassiveId, number>>
  enemies: Enemy[]
  enemyProjs: EnemyProj[]
  projectiles: Projectile[]
  orbits: Orbit[]
  whips: WhipSwipe[]
  auras: AuraPulse[]
  bombs: Bomb[]
  bolts: ChainBolt[]
  scytheAngle: number
  bladesAngle: number
  gems: Gem[]
  hearts: Heart[]
  floats: FloatText[]
  spawnTimer: number
  tick: number
  time: number    // seconds
  kills: number
  cameraX: number
  cameraY: number
  paused: boolean
  pendingCards: CardId[] | null
  dead: boolean
  shake: number
}

// ── Card defs ─────────────────────────────────────────────────────
const CARD_LABEL: Record<CardId, string> = {
  missile:     'magic missile',
  whip:        'whip',
  aura:        'aura',
  orbit:       'orbit shield',
  spread:      'spread shot',
  chain:       'chain lightning',
  boomerang:   'boomerang',
  bomb:        'bomb',
  scythe:      'scythe',
  barrage:     '★ barrage',
  hellfire:    '★ hellfire',
  severing:    '★ severing',
  solar:       '★ solar',
  gravity:     '★ gravity',
  tempest:     '★ tempest',
  eternity:    '★ eternity',
  singularity: '★ singularity',
  harvest:     '★ harvest',
  hp:          'max hp +',
  speed:       'move speed +',
  damage:      'damage +',
  magnet:      'magnet +',
  haste:       'cooldown -',
  regen:       'regen +',
  vampire:     'vampire',
  crit:        'crit +',
  luck:        'luck +',
}

const CARD_DESC: Record<CardId, string> = {
  missile:     '가장 가까운 적에게 자동 발사',
  whip:        '진행 방향으로 채찍 휘두르기',
  aura:        '주변에 주기적 충격파',
  orbit:       '플레이어 주위를 도는 방패',
  spread:      '3방향 동시 발사',
  chain:       '적에서 적으로 튀는 번개',
  boomerang:   '던지고 돌아오는 부메랑, 양방향 데미지',
  bomb:        '발 밑에 시한폭탄, 범위 폭발',
  scythe:      '플레이어 주위를 도는 큰 낫',
  barrage:     '미사일 + 치명타 진화. 3발 동시 자동 추적, 강한 관통',
  hellfire:    '스프레드 + 이동속도 진화. 7방향 탄막 + 빠른 발사',
  severing:    '채찍 + 데미지 진화. 4방향 거대 베기',
  solar:       '오라 + 재생 진화. 거대한 지속 광역 + 쿨 단축',
  gravity:     '오빗 + 자석 진화. 8개 궤도 방패, 큰 반경',
  tempest:     '체인 + 쿨감 진화. 매우 짧은 쿨, 12회 점프',
  eternity:    '부메랑 + 럭 진화. 영원히 도는 4개 칼날',
  singularity: '폭탄 + HP 진화. 빠른 쿨 + 거대 폭발',
  harvest:     '낫 + 흡혈 진화. 4날 + 회전 ↑ + 추가 흡혈',
  hp:          '최대 체력 +25, 체력 +25',
  speed:       '이동속도 +12%',
  damage:      '공격력 +15%',
  magnet:      '자석 범위 +40%',
  haste:       '재사용 -10%',
  regen:       '초당 회복 +0.4',
  vampire:     '입힌 피해의 1.5% 흡혈 (피격당 최대 +1 HP)',
  crit:        '치명타 확률 +8%, 치명타 ×2 피해',
  luck:        '레벨업 카드 선택지 +1',
}

const PASSIVES: PassiveId[] = [
  'hp', 'speed', 'damage', 'magnet', 'haste', 'regen',
  'vampire', 'crit', 'luck',
]
// Base weapons offered as new picks. Evolved weapons are NOT here —
// they're only obtainable via evolution.
const WEAPONS: WeaponId[] = [
  'missile', 'whip', 'aura', 'orbit', 'spread',
  'chain', 'boomerang', 'bomb', 'scythe',
]
const MAX_WEAPON_LV = 5
const MAX_LUCK = 4
const MAX_CRIT = 0.6

// Evolution recipes — base weapon at MAX_WEAPON_LV + required passive
// (any level) → evolved weapon replaces the base in the slot.
type EvolutionRecipe = { from: WeaponId; need: PassiveId; to: WeaponId }
const EVOLUTIONS: EvolutionRecipe[] = [
  { from: 'missile',   need: 'crit',    to: 'barrage' },
  { from: 'spread',    need: 'speed',   to: 'hellfire' },
  { from: 'whip',      need: 'damage',  to: 'severing' },
  { from: 'aura',      need: 'regen',   to: 'solar' },
  { from: 'orbit',     need: 'magnet',  to: 'gravity' },
  { from: 'chain',     need: 'haste',   to: 'tempest' },
  { from: 'boomerang', need: 'luck',    to: 'eternity' },
  { from: 'bomb',      need: 'hp',      to: 'singularity' },
  { from: 'scythe',    need: 'vampire', to: 'harvest' },
]
const EVOLVED_IDS = new Set<WeaponId>(EVOLUTIONS.map(e => e.to))
// Persistent weapons skip the timer-based fire loop; they're driven
// from the update step instead.
const PERSISTENT: Set<WeaponId> = new Set([
  'orbit', 'scythe',
  'solar', 'gravity', 'eternity', 'harvest',
])

// ── Helpers ───────────────────────────────────────────────────────
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const dist2 = (ax: number, ay: number, bx: number, by: number) => {
  const dx = ax - bx, dy = ay - by
  return dx * dx + dy * dy
}
const clamp = (n: number, lo: number, hi: number) => n < lo ? lo : n > hi ? hi : n

function makeStats(): Stats {
  return {
    damage: 1, speed: 1, haste: 1, pickup: 1, regen: 0, maxHpBonus: 0,
    lifesteal: 0, crit: 0, critMul: 2, cardCount: 3,
  }
}

function makeState(): GameState {
  return {
    playerX: 0, playerY: 0,
    vx: 0, vy: 0,
    hp: BASE_MAX_HP, maxHp: BASE_MAX_HP,
    level: 1, xp: 0, xpToNext: 5,
    iframes: 0,
    facing: { x: 1, y: 0 },
    stats: makeStats(),
    weapons: [{ id: 'missile', level: 1, timer: 0 }],
    passiveLv: {},
    enemies: [],
    enemyProjs: [],
    projectiles: [],
    orbits: [],
    whips: [],
    auras: [],
    bombs: [],
    bolts: [],
    scytheAngle: 0,
    bladesAngle: 0,
    gems: [],
    hearts: [],
    floats: [],
    spawnTimer: 30,
    tick: 0,
    time: 0,
    kills: 0,
    cameraX: 0, cameraY: 0,
    paused: false,
    pendingCards: null,
    dead: false,
    shake: 0,
  }
}

// ── Weapon firing ─────────────────────────────────────────────────
function weaponBaseCooldown(id: WeaponId): number {
  switch (id) {
    case 'missile':     return 36
    case 'whip':        return 50
    case 'aura':        return 90
    case 'orbit':       return 0
    case 'spread':      return 70
    case 'chain':       return 80
    case 'boomerang':   return 70
    case 'bomb':        return 110
    case 'scythe':      return 0
    // ── evolved ────────────────────────────────
    case 'barrage':     return 28
    case 'hellfire':    return 30
    case 'severing':    return 36
    case 'solar':       return 0
    case 'gravity':     return 0
    case 'tempest':     return 24
    case 'eternity':    return 0
    case 'singularity': return 70
    case 'harvest':     return 0
  }
}

function weaponCooldown(w: Weapon, stats: Stats): number {
  const base = weaponBaseCooldown(w.id)
  const lvBonus = Math.max(0.5, 1 - (w.level - 1) * 0.08)
  return Math.max(6, Math.round(base * lvBonus * stats.haste))
}

function nearestEnemy(s: GameState): Enemy | null {
  let best: Enemy | null = null
  let bd = Infinity
  for (const e of s.enemies) {
    const d = dist2(e.x, e.y, s.playerX, s.playerY)
    if (d < bd) { bd = d; best = e }
  }
  return best
}

function fireWeapon(s: GameState, w: Weapon) {
  const dmgMul = s.stats.damage
  switch (w.id) {
    case 'missile': {
      const tgt = nearestEnemy(s)
      if (!tgt) return
      const dx = tgt.x - s.playerX, dy = tgt.y - s.playerY
      const d = Math.hypot(dx, dy) || 1
      const sp = 5
      s.projectiles.push({
        x: s.playerX, y: s.playerY,
        vx: dx / d * sp, vy: dy / d * sp,
        damage: (8 + w.level * 3) * dmgMul,
        r: 4 + w.level * 0.5,
        pierce: Math.floor((w.level - 1) / 2),
        life: 90,
        weapon: 'missile',
        hit: new Set(),
      })
      break
    }
    case 'spread': {
      const tgt = nearestEnemy(s)
      const baseAngle = tgt
        ? Math.atan2(tgt.y - s.playerY, tgt.x - s.playerX)
        : Math.atan2(s.facing.y, s.facing.x)
      const count = 3 + Math.floor((w.level - 1) / 2)
      const spread = 0.45
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : (i / (count - 1)) - 0.5
        const a = baseAngle + t * spread * 2
        const sp = 4.6
        s.projectiles.push({
          x: s.playerX, y: s.playerY,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          damage: (5 + w.level * 1.8) * dmgMul,
          r: 3.5,
          pierce: 0,
          life: 70,
          weapon: 'spread',
          hit: new Set(),
        })
      }
      break
    }
    case 'whip': {
      const reach = 70 + w.level * 12
      const arc = 1.5 + w.level * 0.08
      s.whips.push({
        x: s.playerX, y: s.playerY,
        dirX: s.facing.x, dirY: s.facing.y,
        life: 14,
        damage: (16 + w.level * 4) * dmgMul,
        reach, arc,
        hit: new Set(),
      })
      // mirror swipe at level 4+
      if (w.level >= 4) {
        s.whips.push({
          x: s.playerX, y: s.playerY,
          dirX: -s.facing.x, dirY: -s.facing.y,
          life: 14,
          damage: (16 + w.level * 4) * dmgMul,
          reach, arc,
          hit: new Set(),
        })
      }
      break
    }
    case 'aura': {
      const r = 70 + w.level * 18
      s.auras.push({
        x: s.playerX, y: s.playerY,
        life: 0, maxLife: 22,
        damage: (10 + w.level * 4) * dmgMul,
        r,
        hit: new Set(),
      })
      break
    }
    // orbit handled in update
    case 'orbit': break
    // scythe handled in update
    case 'scythe': break
    case 'chain': {
      // jump from nearest to next nearest
      const targets: Enemy[] = []
      const exclude = new Set<Enemy>()
      let from = { x: s.playerX, y: s.playerY }
      const jumps = 3 + w.level   // 4..8
      const maxJump = 140 + w.level * 10
      const maxJump2 = maxJump * maxJump
      for (let j = 0; j < jumps; j++) {
        let best: Enemy | null = null
        let bd = Infinity
        for (const e of s.enemies) {
          if (exclude.has(e)) continue
          const dd = dist2(from.x, from.y, e.x, e.y)
          if (dd > maxJump2) continue
          if (dd < bd) { bd = dd; best = e }
        }
        if (!best) break
        targets.push(best)
        exclude.add(best)
        from = { x: best.x, y: best.y }
      }
      if (targets.length === 0) break
      const dmg = (10 + w.level * 4) * dmgMul
      // build bolt path: player -> targets...
      const path: { x: number; y: number }[] = [{ x: s.playerX, y: s.playerY }]
      for (const t of targets) {
        path.push({ x: t.x, y: t.y })
        damageEnemy(s, t, dmg, 0, 0)
      }
      s.bolts.push({ points: path, life: 14 })
      break
    }
    case 'boomerang': {
      const tgt = nearestEnemy(s)
      const ang = tgt
        ? Math.atan2(tgt.y - s.playerY, tgt.x - s.playerX)
        : Math.atan2(s.facing.y, s.facing.x)
      const sp = 4.2
      const reach = 140 + w.level * 14
      const count = 1 + Math.floor((w.level - 1) / 2)
      const spread = 0.35
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : (i / (count - 1)) - 0.5
        const a = ang + t * spread * 2
        s.projectiles.push({
          x: s.playerX, y: s.playerY,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          damage: (8 + w.level * 3) * dmgMul,
          r: 5,
          pierce: 99,
          life: 240,
          weapon: 'boomerang',
          hit: new Set(),
          returning: false,
          travelled: 0,
          maxTravel: reach,
        })
      }
      break
    }
    case 'bomb': {
      const r = 60 + w.level * 8
      s.bombs.push({
        x: s.playerX, y: s.playerY,
        fuse: 60, maxFuse: 60,
        damage: (28 + w.level * 8) * dmgMul,
        radius: r,
      })
      break
    }

    // ── Evolved weapons ────────────────────────────────
    case 'barrage': {
      // Pick the 3 nearest enemies (or any if fewer), strong piercing missiles.
      const sorted = [...s.enemies]
        .map(e => ({ e, d: dist2(e.x, e.y, s.playerX, s.playerY) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 3)
        .map(x => x.e)
      if (!sorted.length) break
      const sp = 5.5
      for (const tgt of sorted) {
        const dx = tgt.x - s.playerX, dy = tgt.y - s.playerY
        const d = Math.hypot(dx, dy) || 1
        s.projectiles.push({
          x: s.playerX, y: s.playerY,
          vx: dx / d * sp, vy: dy / d * sp,
          damage: 36 * dmgMul,
          r: 6, pierce: 5,
          life: 110, weapon: 'barrage', hit: new Set(),
        })
      }
      break
    }
    case 'hellfire': {
      // 7 projectiles in full circle, fast cooldown
      const count = 7
      const sp = 5
      const offset = (s.tick * 0.05) % (Math.PI * 2)
      for (let i = 0; i < count; i++) {
        const a = offset + (i / count) * Math.PI * 2
        s.projectiles.push({
          x: s.playerX, y: s.playerY,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          damage: 14 * dmgMul,
          r: 4, pierce: 1,
          life: 80, weapon: 'hellfire', hit: new Set(),
        })
      }
      break
    }
    case 'severing': {
      // 4 cardinal-direction whips simultaneously
      const reach = 150
      const arc = 2.0
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const
      for (const [dx, dy] of dirs) {
        s.whips.push({
          x: s.playerX, y: s.playerY,
          dirX: dx, dirY: dy,
          life: 18,
          damage: 50 * dmgMul,
          reach, arc,
          hit: new Set(),
        })
      }
      break
    }
    case 'tempest': {
      // chain lightning, longer reach, more jumps
      const targets: Enemy[] = []
      const exclude = new Set<Enemy>()
      let from = { x: s.playerX, y: s.playerY }
      const maxJump = 220
      const maxJump2 = maxJump * maxJump
      for (let j = 0; j < 12; j++) {
        let best: Enemy | null = null
        let bd = Infinity
        for (const e of s.enemies) {
          if (exclude.has(e)) continue
          const dd = dist2(from.x, from.y, e.x, e.y)
          if (dd > maxJump2) continue
          if (dd < bd) { bd = dd; best = e }
        }
        if (!best) break
        targets.push(best); exclude.add(best); from = { x: best.x, y: best.y }
      }
      if (!targets.length) break
      const dmg = 22 * dmgMul
      const path: { x: number; y: number }[] = [{ x: s.playerX, y: s.playerY }]
      for (const t of targets) { path.push({ x: t.x, y: t.y }); damageEnemy(s, t, dmg, 0, 0) }
      s.bolts.push({ points: path, life: 16 })
      break
    }
    case 'singularity': {
      // larger bomb radius + pulls enemies before exploding (handled in update)
      s.bombs.push({
        x: s.playerX, y: s.playerY,
        fuse: 70, maxFuse: 70,
        damage: 90 * dmgMul,
        radius: 130,
      })
      break
    }

    // persistent evolved weapons handled in update():
    case 'solar': break
    case 'gravity': break
    case 'eternity': break
    case 'harvest': break
  }
}

function ensureOrbits(s: GameState) {
  const orb = s.weapons.find(x => x.id === 'orbit')
  const grv = s.weapons.find(x => x.id === 'gravity')
  // gravity replaces orbit (player can't have both)
  const w = grv ?? orb
  const isGravity = !!grv
  const want = !w ? 0 : (isGravity ? 8 : 2 + w.level)
  while (s.orbits.length < want) {
    s.orbits.push({
      angle: (s.orbits.length / Math.max(1, want)) * Math.PI * 2,
      damage: 0, r: 0,
      hit: new Map(),
    })
  }
  while (s.orbits.length > want) s.orbits.pop()
  if (!w) return
  const dmg = (isGravity ? 28 : 10 + w.level * 5) * s.stats.damage
  const radius = isGravity ? 80 : 44 + w.level * 6
  for (const o of s.orbits) {
    o.damage = dmg
    o.r = radius
  }
}

// ── Spawning ──────────────────────────────────────────────────────
function spawnEnemy(s: GameState) {
  const t = s.time
  const tier = t < 30 ? 0 : t < 75 ? 1 : t < 150 ? 2 : t < 240 ? 3 : 4
  const roll = Math.random()
  let kind: Enemy['kind'] = 'walker'

  // tier-gated random distribution
  if (tier >= 1 && roll < 0.16)       kind = 'fast'
  else if (tier >= 1 && roll < 0.24)  kind = 'swarm'
  else if (tier >= 2 && roll < 0.32)  kind = 'tank'
  else if (tier >= 2 && roll < 0.40)  kind = 'shooter'
  else if (tier >= 2 && roll < 0.46)  kind = 'bomber'
  else if (tier >= 2 && roll < 0.52)  kind = 'burster'
  else if (tier >= 3 && roll < 0.58)  kind = 'splitter'
  else if (tier >= 3 && roll < 0.62)  kind = 'summoner'

  // gentler-than-original linear scaling.
  // 0s=1x, 60s=2.1x, 180s=4.2x, 300s=6.4x, 480s=9.6x, 600s=11.8x
  // (was 0.04/s ⇒ 25x at 10min, way too tanky)
  const hpScale = 1 + t * 0.018

  // base stats per kind
  let hp = 12, sp = 0.85, dmg = 8, r = 7
  if (kind === 'fast')     { hp = 8;  sp = 1.55; dmg = 6;  r = 5 }
  if (kind === 'tank')     { hp = 50; sp = 0.55; dmg = 14; r = 12 }
  if (kind === 'shooter')  { hp = 18; sp = 0.5;  dmg = 8;  r = 8 }
  if (kind === 'swarm')    { hp = 4;  sp = 1.7;  dmg = 4;  r = 4 }
  if (kind === 'bomber')   { hp = 22; sp = 0.75; dmg = 10; r = 9 }
  if (kind === 'splitter') { hp = 28; sp = 0.85; dmg = 9;  r = 9 }
  if (kind === 'summoner') { hp = 90; sp = 0.4;  dmg = 12; r = 13 }
  if (kind === 'burster')  { hp = 24; sp = 0.9;  dmg = 8;  r = 9 }

  hp = Math.round(hp * hpScale)

  const ang = Math.random() * Math.PI * 2
  const spawnDist = Math.max(W, H) * 0.62
  const baseX = s.playerX + Math.cos(ang) * spawnDist
  const baseY = s.playerY + Math.sin(ang) * spawnDist

  // swarm: spawn a tight cluster of small enemies
  const count = kind === 'swarm' ? 5 + Math.floor(Math.random() * 3) : 1

  for (let i = 0; i < count; i++) {
    const ox = count > 1 ? rand(-22, 22) : 0
    const oy = count > 1 ? rand(-22, 22) : 0
    const e: Enemy = {
      x: baseX + ox, y: baseY + oy,
      hp, maxHp: hp,
      speed: sp, damage: dmg, r,
      kind, hitFlash: 0, knockX: 0, knockY: 0,
    }
    if (kind === 'shooter')  e.fireTimer = 60 + Math.floor(Math.random() * 60)
    if (kind === 'summoner') e.summonTimer = 240 + Math.floor(Math.random() * 60)
    s.enemies.push(e)
  }
}

function maybeBoss(s: GameState) {
  // every 60 seconds spawn a juicy elite
  const m = Math.floor(s.time / 60)
  if (m > (s as unknown as { _bossLast?: number })._bossLast! || (s as unknown as { _bossLast?: number })._bossLast === undefined) {
    if (s.time >= 60 && m > 0) {
      const ang = Math.random() * Math.PI * 2
      const d = Math.max(W, H) * 0.65
      const baseHp = 220 + m * 120
      s.enemies.push({
        x: s.playerX + Math.cos(ang) * d,
        y: s.playerY + Math.sin(ang) * d,
        hp: baseHp, maxHp: baseHp,
        speed: 0.75, damage: 22, r: 18,
        kind: 'tank', hitFlash: 0, knockX: 0, knockY: 0,
      })
    }
    ;(s as unknown as { _bossLast: number })._bossLast = m
  }
}

// ── Damage / death ────────────────────────────────────────────────
function damageEnemy(s: GameState, e: Enemy, dmg: number, kx: number, ky: number) {
  // crit roll
  let isCrit = false
  if (s.stats.crit > 0 && Math.random() < s.stats.crit) {
    dmg *= s.stats.critMul
    isCrit = true
  }
  e.hp -= dmg
  e.hitFlash = 6
  e.knockX += kx
  e.knockY += ky
  // ── lifesteal: % of damage, capped per-hit so big nukes don't fully heal ──
  if (s.stats.lifesteal > 0 && !s.dead) {
    const heal = Math.min(dmg * s.stats.lifesteal, 1)
    s.hp = Math.min(s.maxHp, s.hp + heal)
  }
  s.floats.push({
    x: e.x, y: e.y - e.r - 4,
    text: (isCrit ? '!' : '') + String(Math.round(dmg)),
    age: 0, ttl: 30,
    color: isCrit ? '#fde047' : dmg >= 30 ? '#fdba74' : '#f4f4f5',
  })
  if (e.hp <= 0) {
    onEnemyDeath(s, e)
  }
}

function onEnemyDeath(s: GameState, e: Enemy) {
  s.kills++
  // drop gem (mini splitter offspring give nothing)
  if (!e.isMini) {
    let value = 1
    if (e.kind === 'tank')          value = 6
    else if (e.kind === 'summoner') value = 8
    else if (e.kind === 'shooter')  value = 3
    else if (e.kind === 'bomber')   value = 3
    else if (e.kind === 'splitter') value = 4
    else if (e.kind === 'burster')  value = 3
    else if (e.kind === 'swarm')    value = 1
    else if (e.kind === 'fast')     value = 1
    s.gems.push({ x: e.x, y: e.y, value, vx: rand(-0.6, 0.6), vy: rand(-1.2, -0.2) })
  }

  // ── bomber: explode on death ─────────────────────────────
  if (e.kind === 'bomber') {
    const radius = 60
    const r2 = radius * radius
    // damage other enemies (friendly fire) — adds strategic depth
    for (const other of s.enemies) {
      if (other === e) continue
      if (dist2(e.x, e.y, other.x, other.y) < r2) {
        other.hp -= 14
        if (other.hp <= 0) other.hitFlash = 6  // marked, will be cleaned up next loop
      }
    }
    // damage player if in radius
    if (s.iframes <= 0 && dist2(e.x, e.y, s.playerX, s.playerY) < r2) {
      s.hp -= 18
      s.iframes = IFRAME_TICKS
      s.shake = Math.max(s.shake, 7)
      if (s.hp <= 0) { s.hp = 0; s.dead = true }
    }
    // visual shockwave
    s.auras.push({
      x: e.x, y: e.y,
      life: 0, maxLife: 14,
      damage: 0, r: radius,
      hit: new Set(),
    })
    s.shake = Math.max(s.shake, 4)
  }

  // ── burster: emit a radial barrage of projectiles ────────
  if (e.kind === 'burster' && !e.isMini) {
    const count = 10
    const baseAng = Math.random() * Math.PI * 2
    const sp = 2.4
    for (let k = 0; k < count; k++) {
      const a = baseAng + (k / count) * Math.PI * 2
      s.enemyProjs.push({
        x: e.x, y: e.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        damage: 5,
        r: 4,
        life: 110,
      })
    }
    s.shake = Math.max(s.shake, 4)
  }

  // ── splitter: spawn 3 mini walkers ───────────────────────
  if (e.kind === 'splitter' && !e.isMini) {
    for (let i = 0; i < 3; i++) {
      const ang = (i / 3) * Math.PI * 2 + rand(-0.3, 0.3)
      s.enemies.push({
        x: e.x + Math.cos(ang) * 6,
        y: e.y + Math.sin(ang) * 6,
        hp: 6, maxHp: 6,
        speed: 1.1, damage: 5, r: 5,
        kind: 'walker',
        hitFlash: 0, knockX: 0, knockY: 0,
        isMini: true,
      })
    }
  }

  // chance for a heart drop. boss-tier (large tank) always drops a big heart.
  const isBoss = e.kind === 'tank' && e.maxHp >= 200
  let heartChance = 0
  if (isBoss)                          heartChance = 1
  else if (e.isMini)                   heartChance = 0      // no farm via spawned/split
  else if (e.kind === 'summoner')      heartChance = 0.05
  else if (e.kind === 'tank')          heartChance = 0.025
  else if (e.kind === 'splitter')      heartChance = 0.015
  else if (e.kind === 'bomber')        heartChance = 0.012
  else if (e.kind === 'burster')       heartChance = 0.012
  else if (e.kind === 'shooter')       heartChance = 0.012
  else if (e.kind === 'walker')        heartChance = 0.003
  else if (e.kind === 'fast')          heartChance = 0.002
  else if (e.kind === 'swarm')         heartChance = 0.001
  // scale with current HP — drops are 1.5x more likely when below half hp
  if (s.hp < s.maxHp * 0.5) heartChance *= 1.5
  // and capped to almost nothing if at full hp (avoids waste)
  else if (s.hp >= s.maxHp) heartChance *= 0.4

  if (Math.random() < heartChance) {
    const big = isBoss
    s.hearts.push({
      x: e.x, y: e.y,
      heal: big ? 30 : 12,
      big,
      vx: rand(-0.5, 0.5),
      vy: rand(-1.0, -0.2),
      bob: Math.random() * Math.PI * 2,
    })
  }

  // remove from enemies
  const i = s.enemies.indexOf(e)
  if (i >= 0) s.enemies.splice(i, 1)
}

// ── Card system ───────────────────────────────────────────────────
function getReadyEvolutions(s: GameState): WeaponId[] {
  const owned = new Map<WeaponId, Weapon>(s.weapons.map(w => [w.id, w]))
  const ready: WeaponId[] = []
  for (const rec of EVOLUTIONS) {
    const w = owned.get(rec.from)
    if (!w || w.level < MAX_WEAPON_LV) continue
    if ((s.passiveLv[rec.need] ?? 0) <= 0) continue
    if (owned.has(rec.to)) continue   // already evolved
    ready.push(rec.to)
  }
  return ready
}

function rollCards(s: GameState): CardId[] {
  const want = s.stats.cardCount
  const out: CardId[] = []
  const taken = new Set<CardId>()

  // ── 1) Force-include any ready evolutions (up to want-1 slots) ──
  const evos = getReadyEvolutions(s)
  for (const e of evos) {
    if (out.length >= want) break
    out.push(e)
    taken.add(e)
  }

  // ── 2) Build pool of regular cards ───────────────────────────
  const pool: CardId[] = []
  // existing weapons: offer levelup if not maxed (and not evolved)
  for (const w of s.weapons) {
    if (EVOLVED_IDS.has(w.id)) continue
    if (w.level < MAX_WEAPON_LV) pool.push(w.id)
  }
  // new weapons (room for up to 4)
  const owned = new Set(s.weapons.map(w => w.id))
  if (s.weapons.length < 4) {
    for (const id of WEAPONS) if (!owned.has(id)) pool.push(id)
  }
  // passives — skip those at hard cap
  for (const p of PASSIVES) {
    if (p === 'crit' && s.stats.crit >= MAX_CRIT) continue
    if (p === 'luck' && s.stats.cardCount >= MAX_LUCK) continue
    pool.push(p)
  }

  // ── 3) Fill remaining slots with unique random picks ──────────
  while (out.length < want && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length)
    const c = pool[i]
    pool.splice(i, 1)
    if (taken.has(c)) continue
    taken.add(c)
    out.push(c)
  }
  return out
}

function applyCard(s: GameState, id: CardId) {
  // ── Evolution: replace the base weapon with the evolved one ──
  if (EVOLVED_IDS.has(id as WeaponId)) {
    const rec = EVOLUTIONS.find(e => e.to === id)
    if (rec) {
      const slot = s.weapons.find(w => w.id === rec.from)
      if (slot) {
        slot.id = rec.to
        slot.level = 1
        slot.timer = 0
      } else {
        // edge case: base weapon missing — just push
        s.weapons.push({ id: rec.to, level: 1, timer: 0 })
      }
      if (rec.to === 'gravity') ensureOrbits(s)
    }
    return
  }
  if ((WEAPONS as readonly string[]).includes(id)) {
    const wid = id as WeaponId
    const ex = s.weapons.find(w => w.id === wid)
    if (ex) ex.level = Math.min(MAX_WEAPON_LV, ex.level + 1)
    else s.weapons.push({ id: wid, level: 1, timer: 0 })
    if (wid === 'orbit') ensureOrbits(s)
  } else {
    const pid = id as PassiveId
    s.passiveLv[pid] = (s.passiveLv[pid] ?? 0) + 1
    switch (pid) {
      case 'hp':
        s.stats.maxHpBonus += 25
        s.maxHp = BASE_MAX_HP + s.stats.maxHpBonus
        s.hp = Math.min(s.maxHp, s.hp + 25)
        break
      case 'speed':   s.stats.speed     *= 1.12; break
      case 'damage':  s.stats.damage    *= 1.15; break
      case 'magnet':  s.stats.pickup    *= 1.4;  break
      case 'haste':   s.stats.haste     *= 0.9;  break
      case 'regen':   s.stats.regen     += 0.4;  break
      case 'vampire': s.stats.lifesteal += 0.015; break
      case 'crit':    s.stats.crit       = Math.min(0.6, s.stats.crit + 0.08); break
      case 'luck':    s.stats.cardCount  = Math.min(MAX_LUCK, s.stats.cardCount + 1); break
    }
  }
}

// ── Module-level state ────────────────────────────────────────────
let state: GameState = makeState()
const keys: Record<string, boolean> = {}
const touchDir = { x: 0, y: 0 }

// ── Update ────────────────────────────────────────────────────────
function update(s: GameState) {
  if (s.paused || s.dead) return
  s.tick++
  s.time += 1 / 60

  // ── Player movement ───────────────────────────────────────
  let ix = 0, iy = 0
  if (keys['w'] || keys['arrowup'])    iy -= 1
  if (keys['s'] || keys['arrowdown'])  iy += 1
  if (keys['a'] || keys['arrowleft'])  ix -= 1
  if (keys['d'] || keys['arrowright']) ix += 1
  if (ix === 0 && iy === 0 && (touchDir.x !== 0 || touchDir.y !== 0)) {
    ix = touchDir.x; iy = touchDir.y
  }
  const il = Math.hypot(ix, iy)
  if (il > 0) {
    ix /= il; iy /= il
    s.facing.x = ix
    s.facing.y = iy
  }
  const sp = BASE_SPEED * s.stats.speed
  s.playerX += ix * sp
  s.playerY += iy * sp

  // camera (slight lerp)
  s.cameraX += (s.playerX - s.cameraX) * 0.18
  s.cameraY += (s.playerY - s.cameraY) * 0.18

  // ── Regen / iframes ───────────────────────────────────────
  if (s.iframes > 0) s.iframes--
  if (s.stats.regen > 0) {
    s.hp = Math.min(s.maxHp, s.hp + s.stats.regen / 60)
  }

  // ── Spawn ─────────────────────────────────────────────────
  s.spawnTimer--
  if (s.spawnTimer <= 0) {
    spawnEnemy(s)
    const decay = Math.pow(SPAWN_DECAY, s.time / 30)
    const interval = Math.max(SPAWN_FLOOR, Math.round(SPAWN_BASE * decay))
    s.spawnTimer = interval
  }
  maybeBoss(s)

  // ── Weapons fire ──────────────────────────────────────────
  for (const w of s.weapons) {
    if (PERSISTENT.has(w.id)) continue
    w.timer--
    if (w.timer <= 0) {
      fireWeapon(s, w)
      w.timer = weaponCooldown(w, s.stats)
    }
  }

  // ── Orbits ────────────────────────────────────────────────
  ensureOrbits(s)
  const orbW = s.weapons.find(w => w.id === 'orbit')
  if (orbW && s.orbits.length > 0) {
    const speed = 0.04 + orbW.level * 0.005
    const cnt = s.orbits.length
    for (let i = 0; i < cnt; i++) {
      const o = s.orbits[i]
      o.angle += speed
      const ox = s.playerX + Math.cos(o.angle + (i / cnt) * Math.PI * 2) * o.r
      const oy = s.playerY + Math.sin(o.angle + (i / cnt) * Math.PI * 2) * o.r
      // hit cooldown decay
      for (const [en, t] of o.hit) {
        if (t - 1 <= 0) o.hit.delete(en); else o.hit.set(en, t - 1)
      }
      // collide
      for (const e of s.enemies) {
        if (o.hit.has(e)) continue
        if (dist2(ox, oy, e.x, e.y) < (8 + e.r) * (8 + e.r)) {
          const dx = e.x - ox, dy = e.y - oy
          const d = Math.hypot(dx, dy) || 1
          damageEnemy(s, e, o.damage, dx / d * 1.5, dy / d * 1.5)
          o.hit.set(e, 24)
        }
      }
    }
  }

  // ── Whips ─────────────────────────────────────────────────
  for (let i = s.whips.length - 1; i >= 0; i--) {
    const wp = s.whips[i]
    wp.life--
    // active hit during life
    for (const e of s.enemies) {
      if (wp.hit.has(e)) continue
      const dx = e.x - wp.x, dy = e.y - wp.y
      const d = Math.hypot(dx, dy)
      if (d > wp.reach + e.r) continue
      const dirAng = Math.atan2(wp.dirY, wp.dirX)
      const tgtAng = Math.atan2(dy, dx)
      let diff = Math.abs(tgtAng - dirAng)
      if (diff > Math.PI) diff = Math.PI * 2 - diff
      if (diff > wp.arc / 2) continue
      damageEnemy(s, e, wp.damage, wp.dirX * 3, wp.dirY * 3)
      wp.hit.add(e)
    }
    if (wp.life <= 0) s.whips.splice(i, 1)
  }

  // ── Auras ─────────────────────────────────────────────────
  for (let i = s.auras.length - 1; i >= 0; i--) {
    const a = s.auras[i]
    a.life++
    a.x = s.playerX; a.y = s.playerY
    const r = a.r * (a.life / a.maxLife)
    for (const e of s.enemies) {
      if (a.hit.has(e)) continue
      if (dist2(a.x, a.y, e.x, e.y) < (r + e.r) * (r + e.r)) {
        const dx = e.x - a.x, dy = e.y - a.y
        const d = Math.hypot(dx, dy) || 1
        damageEnemy(s, e, a.damage, dx / d * 2, dy / d * 2)
        a.hit.add(e)
      }
    }
    if (a.life >= a.maxLife) s.auras.splice(i, 1)
  }

  // ── Projectiles ───────────────────────────────────────────
  for (let i = s.projectiles.length - 1; i >= 0; i--) {
    const p = s.projectiles[i]
    p.x += p.vx; p.y += p.vy; p.life--

    // boomerang behavior
    if (p.weapon === 'boomerang') {
      const sp = Math.hypot(p.vx, p.vy) || 1
      p.travelled = (p.travelled ?? 0) + sp
      if (!p.returning && p.travelled >= (p.maxTravel ?? 0)) {
        p.returning = true
        p.hit.clear()  // can hit each enemy once more on return
      }
      if (p.returning) {
        // accelerate toward player
        const dx = s.playerX - p.x, dy = s.playerY - p.y
        const d = Math.hypot(dx, dy) || 1
        p.vx += dx / d * 0.25
        p.vy += dy / d * 0.25
        // cap speed
        const sp2 = Math.hypot(p.vx, p.vy)
        const cap = 6
        if (sp2 > cap) { p.vx = p.vx / sp2 * cap; p.vy = p.vy / sp2 * cap }
        // reaches player → consumed
        if (d < PLAYER_R + 6) {
          s.projectiles.splice(i, 1)
          continue
        }
      }
    }

    let consumed = false
    for (const e of s.enemies) {
      if (p.hit.has(e)) continue
      if (dist2(p.x, p.y, e.x, e.y) < (p.r + e.r) * (p.r + e.r)) {
        const d = Math.hypot(p.vx, p.vy) || 1
        damageEnemy(s, e, p.damage, p.vx / d * 2, p.vy / d * 2)
        p.hit.add(e)
        if (p.pierce <= 0) { consumed = true; break }
        p.pierce--
      }
    }
    if (consumed || p.life <= 0) s.projectiles.splice(i, 1)
  }

  // ── Bombs ─────────────────────────────────────────────────
  for (let i = s.bombs.length - 1; i >= 0; i--) {
    const b = s.bombs[i]
    b.fuse--
    // singularity (large radius) pulls enemies inward during fuse
    if (b.radius >= 100 && b.fuse > 0) {
      const pullR = b.radius * 1.6
      for (const e of s.enemies) {
        const dx = b.x - e.x, dy = b.y - e.y
        const d = Math.hypot(dx, dy) || 1
        if (d > 12 && d < pullR) {
          e.x += dx / d * 1.3
          e.y += dy / d * 1.3
        }
      }
    }
    if (b.fuse <= 0) {
      // explode: damage all in radius
      const r2 = b.radius * b.radius
      for (let j = s.enemies.length - 1; j >= 0; j--) {
        const e = s.enemies[j]
        if (dist2(b.x, b.y, e.x, e.y) < r2 + e.r * e.r) {
          const dx = e.x - b.x, dy = e.y - b.y
          const d = Math.hypot(dx, dy) || 1
          damageEnemy(s, e, b.damage, dx / d * 4, dy / d * 4)
        }
      }
      // explosion shockwave visual via aura
      s.auras.push({
        x: b.x, y: b.y, life: 0, maxLife: 16,
        damage: 0, r: b.radius, hit: new Set(),
      })
      s.shake = Math.max(s.shake, 6)
      s.bombs.splice(i, 1)
    }
  }

  // ── Chain bolts (visual decay) ────────────────────────────
  for (let i = s.bolts.length - 1; i >= 0; i--) {
    s.bolts[i].life--
    if (s.bolts[i].life <= 0) s.bolts.splice(i, 1)
  }

  // ── Scythe / Harvest ──────────────────────────────────────
  const scyW = s.weapons.find(w => w.id === 'scythe' || w.id === 'harvest')
  if (scyW) {
    const isHarvest = scyW.id === 'harvest'
    const speed = isHarvest ? 0.12 : (0.05 + scyW.level * 0.008)
    s.scytheAngle += speed
    const blades = isHarvest ? 4 : 1 + Math.floor((scyW.level - 1) / 2)
    const reach = isHarvest ? 110 : 70 + scyW.level * 8
    const arc = isHarvest ? 1.4 : 0.9 + scyW.level * 0.06
    const damage = (isHarvest ? 50 : 14 + scyW.level * 5) * s.stats.damage
    for (let b = 0; b < blades; b++) {
      const baseAng = s.scytheAngle + (b / blades) * Math.PI * 2
      for (const e of s.enemies) {
        const dx = e.x - s.playerX, dy = e.y - s.playerY
        const d = Math.hypot(dx, dy)
        if (d > reach + e.r) continue
        const tgtAng = Math.atan2(dy, dx)
        const diff = Math.abs(((tgtAng - baseAng) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI)
        if (diff > arc / 2) continue
        const last = (e as unknown as { _scyLast?: number })._scyLast ?? -999
        if (s.tick - last < 18) continue
        ;(e as unknown as { _scyLast: number })._scyLast = s.tick
        damageEnemy(s, e, damage, dx / (d || 1) * 1.5, dy / (d || 1) * 1.5)
        if (isHarvest && s.hp < s.maxHp) {
          // harvest: bonus heal on each hit
          s.hp = Math.min(s.maxHp, s.hp + 0.6)
        }
      }
    }
  }

  // ── Solar (persistent aura) ───────────────────────────────
  const solW = s.weapons.find(w => w.id === 'solar')
  if (solW) {
    const r = 180, r2 = r * r
    const dmg = 14 * s.stats.damage
    for (const e of s.enemies) {
      if (dist2(s.playerX, s.playerY, e.x, e.y) >= r2) continue
      const last = (e as unknown as { _solLast?: number })._solLast ?? -999
      if (s.tick - last < 24) continue
      ;(e as unknown as { _solLast: number })._solLast = s.tick
      const dx = e.x - s.playerX, dy = e.y - s.playerY
      const d = Math.hypot(dx, dy) || 1
      damageEnemy(s, e, dmg, dx / d * 1.2, dy / d * 1.2)
    }
  }

  // ── Eternity (persistent orbit blades — separate from orbits) ──
  const eteW = s.weapons.find(w => w.id === 'eternity')
  if (eteW) {
    s.bladesAngle += 0.06
    const count = 4
    const radius = 110
    const dmg = 22 * s.stats.damage
    for (let i = 0; i < count; i++) {
      const ang = s.bladesAngle + (i / count) * Math.PI * 2
      const bx = s.playerX + Math.cos(ang) * radius
      const by = s.playerY + Math.sin(ang) * radius
      for (const e of s.enemies) {
        if (dist2(bx, by, e.x, e.y) > (10 + e.r) * (10 + e.r)) continue
        const last = (e as unknown as { _eteLast?: number })._eteLast ?? -999
        if (s.tick - last < 18) continue
        ;(e as unknown as { _eteLast: number })._eteLast = s.tick
        const dx = e.x - bx, dy = e.y - by
        const d = Math.hypot(dx, dy) || 1
        damageEnemy(s, e, dmg, dx / d * 2, dy / d * 2)
      }
    }
  }

  // ── Gravity pull (active when gravity weapon owned) ───────
  if (s.weapons.some(w => w.id === 'gravity')) {
    for (const e of s.enemies) {
      const dx = s.playerX - e.x, dy = s.playerY - e.y
      const d = Math.hypot(dx, dy) || 1
      if (d > 80 && d < 360) {
        e.x += dx / d * 0.35
        e.y += dy / d * 0.35
      }
    }
  }

  // ── Enemy AI + collision ──────────────────────────────────
  for (let i = s.enemies.length - 1; i >= 0; i--) {
    const e = s.enemies[i]
    if (e.hitFlash > 0) e.hitFlash--
    const dx = s.playerX - e.x, dy = s.playerY - e.y
    const d = Math.hypot(dx, dy) || 1

    // movement: kind-aware
    // shooter & summoner try to maintain a stand-off distance
    let speedMul = 1
    const standoff = e.kind === 'shooter' ? 180 : e.kind === 'summoner' ? 280 : 0
    if (standoff > 0) {
      if (d < standoff - 20)      speedMul = -0.55  // retreat
      else if (d < standoff + 20) speedMul = 0      // hold
      else                        speedMul = 1      // approach slowly
    }
    e.x += dx / d * e.speed * speedMul + e.knockX
    e.y += dy / d * e.speed * speedMul + e.knockY
    e.knockX *= 0.7
    e.knockY *= 0.7

    // ── shooter: fire at player ──
    if (e.kind === 'shooter') {
      e.fireTimer = (e.fireTimer ?? 90) - 1
      if (e.fireTimer <= 0 && d < 320) {
        const sp = 2.4
        s.enemyProjs.push({
          x: e.x, y: e.y,
          vx: dx / d * sp, vy: dy / d * sp,
          damage: 7,
          r: 4,
          life: 220,
        })
        e.fireTimer = 110 + Math.floor(Math.random() * 40)
      }
    }

    // ── summoner: spawn walker periodically ──
    if (e.kind === 'summoner') {
      e.summonTimer = (e.summonTimer ?? 240) - 1
      if (e.summonTimer <= 0 && s.enemies.length < 220) {
        for (let k = 0; k < 2; k++) {
          const ang = Math.random() * Math.PI * 2
          const hp = Math.round(12 * (1 + s.time * 0.04))
          s.enemies.push({
            x: e.x + Math.cos(ang) * 24,
            y: e.y + Math.sin(ang) * 24,
            hp, maxHp: hp,
            speed: 0.9, damage: 6, r: 6,
            kind: 'walker',
            hitFlash: 6, knockX: 0, knockY: 0,
            isMini: true,
          })
        }
        e.summonTimer = 280 + Math.floor(Math.random() * 80)
      }
    }

    // separation from neighbors (cheap)
    if (i % 3 === s.tick % 3) {
      for (let j = 0; j < s.enemies.length; j++) {
        if (j === i) continue
        const o = s.enemies[j]
        const dxx = e.x - o.x, dyy = e.y - o.y
        const dd = dxx * dxx + dyy * dyy
        const min = (e.r + o.r) * 0.9
        if (dd > 0 && dd < min * min) {
          const dn = Math.sqrt(dd) || 1
          const push = (min - dn) * 0.5
          e.x += dxx / dn * push
          e.y += dyy / dn * push
        }
      }
    }

    // damage player on contact
    if (s.iframes <= 0) {
      const pr = PLAYER_R + e.r
      if (dist2(e.x, e.y, s.playerX, s.playerY) < pr * pr) {
        s.hp -= e.damage
        s.iframes = IFRAME_TICKS
        s.shake = 8
        s.floats.push({
          x: s.playerX, y: s.playerY - 12,
          text: '-' + e.damage,
          age: 0, ttl: 28, color: '#fca5a5',
        })
        if (s.hp <= 0) {
          s.hp = 0
          s.dead = true
        }
      }
    }
  }

  // ── Enemy projectiles ─────────────────────────────────────
  for (let i = s.enemyProjs.length - 1; i >= 0; i--) {
    const p = s.enemyProjs[i]
    p.x += p.vx; p.y += p.vy; p.life--
    // collide with player
    if (s.iframes <= 0) {
      const pr = PLAYER_R + p.r
      if (dist2(p.x, p.y, s.playerX, s.playerY) < pr * pr) {
        s.hp -= p.damage
        s.iframes = IFRAME_TICKS
        s.shake = Math.max(s.shake, 5)
        s.floats.push({
          x: s.playerX, y: s.playerY - 12,
          text: '-' + p.damage,
          age: 0, ttl: 28, color: '#fca5a5',
        })
        if (s.hp <= 0) { s.hp = 0; s.dead = true }
        s.enemyProjs.splice(i, 1)
        continue
      }
    }
    if (p.life <= 0) s.enemyProjs.splice(i, 1)
  }

  // ── Gems ──────────────────────────────────────────────────
  const pickupR = BASE_PICKUP_R * s.stats.pickup
  const pickupR2 = pickupR * pickupR
  for (let i = s.gems.length - 1; i >= 0; i--) {
    const g = s.gems[i]
    // friction-only decay; top-down view has no gravity
    g.vx *= 0.9
    g.vy *= 0.9
    g.x += g.vx
    g.y += g.vy
    const dd = dist2(g.x, g.y, s.playerX, s.playerY)
    if (dd < pickupR2) {
      const dx = s.playerX - g.x, dy = s.playerY - g.y
      const d = Math.hypot(dx, dy) || 1
      g.x += dx / d * GEM_MAGNET_SPEED
      g.y += dy / d * GEM_MAGNET_SPEED
    }
    if (dd < (PLAYER_R + 5) * (PLAYER_R + 5)) {
      gainXp(s, g.value)
      s.gems.splice(i, 1)
    }
  }

  // ── Hearts ────────────────────────────────────────────────
  for (let i = s.hearts.length - 1; i >= 0; i--) {
    const h = s.hearts[i]
    h.vx *= 0.92
    h.vy *= 0.92
    h.x += h.vx
    h.y += h.vy
    h.bob += 0.08
    const dd = dist2(h.x, h.y, s.playerX, s.playerY)
    // hearts use same magnetism as gems but with slightly larger radius
    const heartPickR = pickupR * 1.2
    if (dd < heartPickR * heartPickR) {
      const dx = s.playerX - h.x, dy = s.playerY - h.y
      const d = Math.hypot(dx, dy) || 1
      h.x += dx / d * (GEM_MAGNET_SPEED * 0.85)
      h.y += dy / d * (GEM_MAGNET_SPEED * 0.85)
    }
    if (dd < (PLAYER_R + 7) * (PLAYER_R + 7)) {
      // skip if already at full hp — let it stay on the ground for later
      if (s.hp < s.maxHp) {
        s.hp = Math.min(s.maxHp, s.hp + h.heal)
        s.floats.push({
          x: s.playerX, y: s.playerY - 18,
          text: '+' + h.heal,
          age: 0, ttl: 36,
          color: h.big ? '#fbcfe8' : '#86efac',
        })
        s.hearts.splice(i, 1)
      }
    }
  }

  // ── Floats ────────────────────────────────────────────────
  for (let i = s.floats.length - 1; i >= 0; i--) {
    const f = s.floats[i]
    f.age++
    f.y -= 0.6
    if (f.age >= f.ttl) s.floats.splice(i, 1)
  }

  if (s.shake > 0) s.shake *= 0.85
}

function gainXp(s: GameState, n: number) {
  s.xp += n
  while (s.xp >= s.xpToNext) {
    s.xp -= s.xpToNext
    s.level++
    s.xpToNext = Math.round(5 + Math.pow(s.level, 1.7) * 2)
    queueLevelUp(s)
  }
}

function queueLevelUp(s: GameState) {
  if (!s.pendingCards) {
    s.pendingCards = rollCards(s)
    s.paused = true
  }
}

// ── Render ────────────────────────────────────────────────────────
function draw(ctx: CanvasRenderingContext2D, s: GameState) {
  // clear
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  // shake
  if (s.shake > 0.1) {
    ctx.translate(rand(-s.shake, s.shake), rand(-s.shake, s.shake))
  }
  // camera transform: world (cameraX, cameraY) -> screen (W/2, H/2)
  ctx.translate(W / 2 - s.cameraX, H / 2 - s.cameraY)

  // grid
  drawGrid(ctx, s)

  // gems
  for (const g of s.gems) {
    ctx.fillStyle = g.value >= 6 ? '#22d3ee' : g.value >= 3 ? '#a78bfa' : '#fb923c'
    ctx.beginPath()
    ctx.arc(g.x, g.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // hearts (with floating bob + glow)
  for (const h of s.hearts) {
    const bob = Math.sin(h.bob) * 1.5
    const size = h.big ? 7 : 5
    // glow
    ctx.fillStyle = h.big ? 'rgba(251,113,133,0.25)' : 'rgba(74,222,128,0.22)'
    ctx.beginPath()
    ctx.arc(h.x, h.y + bob, size + 4, 0, Math.PI * 2)
    ctx.fill()
    // heart shape (two circles + triangle)
    ctx.fillStyle = h.big ? '#fb7185' : '#4ade80'
    const cx = h.x, cy = h.y + bob
    ctx.beginPath()
    ctx.arc(cx - size * 0.4, cy - size * 0.2, size * 0.5, 0, Math.PI * 2)
    ctx.arc(cx + size * 0.4, cy - size * 0.2, size * 0.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(cx - size * 0.85, cy)
    ctx.lineTo(cx + size * 0.85, cy)
    ctx.lineTo(cx, cy + size * 0.85)
    ctx.closePath()
    ctx.fill()
  }

  // aura visuals
  for (const a of s.auras) {
    const t = a.life / a.maxLife
    const r = a.r * t
    ctx.strokeStyle = `rgba(253,186,116,${0.6 * (1 - t) + 0.15})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(a.x, a.y, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // whip visuals
  for (const wp of s.whips) {
    const dirAng = Math.atan2(wp.dirY, wp.dirX)
    const t = wp.life / 14
    ctx.strokeStyle = `rgba(244,244,245,${0.3 + 0.5 * t})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(wp.x, wp.y, wp.reach, dirAng - wp.arc / 2, dirAng + wp.arc / 2)
    ctx.stroke()
  }

  // enemies (each kind has its own silhouette)
  for (const e of s.enemies) {
    drawEnemy(ctx, e, s.tick, s.playerX, s.playerY)
  }

  // enemy projectiles (purple bullets from shooters)
  for (const p of s.enemyProjs) {
    ctx.fillStyle = '#c084fc'
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
    // glow
    ctx.fillStyle = 'rgba(192,132,252,0.25)'
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r + 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // projectiles
  for (const p of s.projectiles) {
    if (p.weapon === 'boomerang') {
      const ang = s.tick * 0.4
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(ang)
      ctx.fillStyle = p.returning ? '#fcd34d' : '#facc15'
      ctx.fillRect(-p.r, -1.5, p.r * 2, 3)
      ctx.fillRect(-1.5, -p.r, 3, p.r * 2)
      ctx.restore()
    } else {
      let color = '#fdba74'
      if (p.weapon === 'spread')   color = '#fde68a'
      if (p.weapon === 'barrage')  color = '#fb923c'
      if (p.weapon === 'hellfire') color = '#f87171'
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // bombs (with pulsing fuse)
  for (const b of s.bombs) {
    const isSing = b.radius >= 100
    const t = 1 - b.fuse / b.maxFuse
    const pulse = 0.7 + 0.3 * Math.sin(s.tick * 0.5 * (1 + t * 2))
    ctx.fillStyle = isSing ? '#7c3aed' : '#fafafa'
    ctx.beginPath()
    ctx.arc(b.x, b.y, isSing ? 7 : 5, 0, Math.PI * 2)
    ctx.fill()
    const borderC = isSing ? `rgba(167,139,250,${pulse})` : `rgba(248,113,113,${pulse})`
    ctx.strokeStyle = borderC
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(b.x, b.y, (isSing ? 9 : 5) + 3 * pulse, 0, Math.PI * 2)
    ctx.stroke()
    // radius preview
    ctx.strokeStyle = isSing ? 'rgba(167,139,250,0.22)' : 'rgba(248,113,113,0.18)'
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
    ctx.stroke()
    // singularity event horizon swirl
    if (isSing) {
      ctx.strokeStyle = 'rgba(167,139,250,0.5)'
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.radius * 0.6, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // solar — persistent aura visualization
  const solW = s.weapons.find(w => w.id === 'solar')
  if (solW) {
    const r = 180
    const pulse = 0.5 + 0.15 * Math.sin(s.tick * 0.06)
    ctx.strokeStyle = `rgba(250,204,21,${0.35 * pulse})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(s.playerX, s.playerY, r, 0, Math.PI * 2)
    ctx.stroke()
    // inner glow
    ctx.fillStyle = `rgba(250,204,21,${0.06 * pulse})`
    ctx.beginPath()
    ctx.arc(s.playerX, s.playerY, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // eternity blades — 4 orbiting blades
  const eteW = s.weapons.find(w => w.id === 'eternity')
  if (eteW) {
    const radius = 110
    for (let i = 0; i < 4; i++) {
      const ang = s.bladesAngle + (i / 4) * Math.PI * 2
      const bx = s.playerX + Math.cos(ang) * radius
      const by = s.playerY + Math.sin(ang) * radius
      // blade as rotating cross
      ctx.save()
      ctx.translate(bx, by)
      ctx.rotate(ang + Math.PI / 4)
      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(-10, -1.5, 20, 3)
      ctx.fillRect(-1.5, -10, 3, 20)
      ctx.restore()
    }
  }

  // gravity pull visualization (faint pulling rings)
  if (s.weapons.some(w => w.id === 'gravity')) {
    const r = 360
    ctx.strokeStyle = 'rgba(56,189,248,0.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(s.playerX, s.playerY, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // chain lightning bolts
  for (const blt of s.bolts) {
    const t = blt.life / 14
    ctx.strokeStyle = `rgba(125,211,252,${0.3 + 0.7 * t})`
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < blt.points.length; i++) {
      const p = blt.points[i]
      // jitter for "lightning" feel
      const jx = (Math.random() - 0.5) * 4
      const jy = (Math.random() - 0.5) * 4
      if (i === 0) ctx.moveTo(p.x + jx, p.y + jy)
      else ctx.lineTo(p.x + jx, p.y + jy)
    }
    ctx.stroke()
    // bright core
    ctx.strokeStyle = `rgba(255,255,255,${0.4 * t})`
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < blt.points.length; i++) {
      const p = blt.points[i]
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
  }

  // scythe blades
  const scyW = s.weapons.find(w => w.id === 'scythe')
  if (scyW) {
    const blades = 1 + Math.floor((scyW.level - 1) / 2)
    const reach = 70 + scyW.level * 8
    const arc = 0.9 + scyW.level * 0.06
    for (let b = 0; b < blades; b++) {
      const baseAng = s.scytheAngle + (b / blades) * Math.PI * 2
      ctx.strokeStyle = 'rgba(232,121,249,0.55)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(s.playerX, s.playerY, reach, baseAng - arc / 2, baseAng + arc / 2)
      ctx.stroke()
      // tip
      ctx.fillStyle = '#e879f9'
      const tx = s.playerX + Math.cos(baseAng) * reach
      const ty = s.playerY + Math.sin(baseAng) * reach
      ctx.beginPath()
      ctx.arc(tx, ty, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // orbits
  const orbW = s.weapons.find(w => w.id === 'orbit')
  if (orbW) {
    const cnt = s.orbits.length
    for (let i = 0; i < cnt; i++) {
      const o = s.orbits[i]
      const ox = s.playerX + Math.cos(o.angle + (i / cnt) * Math.PI * 2) * o.r
      const oy = s.playerY + Math.sin(o.angle + (i / cnt) * Math.PI * 2) * o.r
      ctx.fillStyle = '#a3e635'
      ctx.beginPath()
      ctx.arc(ox, oy, 6, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // player
  const blink = s.iframes > 0 && (s.iframes % 6 < 3)
  ctx.fillStyle = blink ? '#71717a' : '#fafafa'
  ctx.beginPath()
  ctx.arc(s.playerX, s.playerY, PLAYER_R, 0, Math.PI * 2)
  ctx.fill()

  // floats
  ctx.font = '11px ui-monospace, SFMono-Regular, monospace'
  ctx.textAlign = 'center'
  for (const f of s.floats) {
    const a = 1 - f.age / f.ttl
    ctx.fillStyle = f.color + alpha(a)
    ctx.fillText(f.text, f.x, f.y)
  }

  ctx.restore()

  // HUD
  drawHud(ctx, s)
  if (s.pendingCards) drawCards(ctx, s)
  if (s.dead) drawDead(ctx, s)
}

function alpha(a: number): string {
  const n = Math.round(clamp(a, 0, 1) * 255)
  return n.toString(16).padStart(2, '0')
}

function drawEnemy(
  ctx: CanvasRenderingContext2D, e: Enemy, tick: number,
  playerX: number, playerY: number
) {
  const fill = e.hitFlash > 0 ? '#ffffff' : enemyColor(e)
  ctx.fillStyle = fill
  const r = e.r

  switch (e.kind) {
    case 'walker':
    case 'swarm': {
      ctx.beginPath()
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'fast': {
      // forward-pointing triangle, aimed at player
      const ang = Math.atan2(playerY - e.y, playerX - e.x)
      ctx.save()
      ctx.translate(e.x, e.y)
      ctx.rotate(ang)
      ctx.beginPath()
      ctx.moveTo(r * 1.3, 0)
      ctx.lineTo(-r * 0.7, -r * 0.95)
      ctx.lineTo(-r * 0.7, r * 0.95)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
      break
    }

    case 'tank': {
      const isBoss = e.maxHp >= 200

      // ── boss-only: spike crown around hexagon ──
      if (isBoss) {
        ctx.fillStyle = '#450a0a'
        const crownR = r + 7
        for (let i = 0; i < 6; i++) {
          // spikes between vertices (in the gaps)
          const a = (i / 6) * Math.PI * 2
          const a1 = a - 0.22, a2 = a + 0.22
          ctx.beginPath()
          ctx.moveTo(e.x + Math.cos(a1) * r, e.y + Math.sin(a1) * r)
          ctx.lineTo(e.x + Math.cos(a) * crownR, e.y + Math.sin(a) * crownR)
          ctx.lineTo(e.x + Math.cos(a2) * r, e.y + Math.sin(a2) * r)
          ctx.closePath()
          ctx.fill()
        }
      }

      // ── body hexagon ──
      ctx.fillStyle = fill
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6
        const px = e.x + Math.cos(a) * r
        const py = e.y + Math.sin(a) * r
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()

      // ── boss-only: inner dark core hexagon ──
      if (isBoss) {
        const pulse = 0.85 + 0.15 * Math.sin(tick * 0.06)
        ctx.fillStyle = '#1c0303'
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6
          const px = e.x + Math.cos(a) * (r * 0.5 * pulse)
          const py = e.y + Math.sin(a) * (r * 0.5 * pulse)
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
      }

      // ── armor outline ──
      ctx.strokeStyle = isBoss ? '#dc2626' : '#fecaca'
      ctx.lineWidth = isBoss ? 2.2 : 1.2
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6
        const px = e.x + Math.cos(a) * r
        const py = e.y + Math.sin(a) * r
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.stroke()
      break
    }

    case 'shooter': {
      const ang = Math.atan2(playerY - e.y, playerX - e.x)
      // body
      ctx.beginPath()
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
      ctx.fill()
      // barrel pointing at player
      ctx.strokeStyle = fill
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(e.x, e.y)
      ctx.lineTo(e.x + Math.cos(ang) * (r + 5), e.y + Math.sin(ang) * (r + 5))
      ctx.stroke()
      // muzzle dot
      ctx.fillStyle = '#f5f3ff'
      ctx.beginPath()
      ctx.arc(e.x + Math.cos(ang) * (r + 5), e.y + Math.sin(ang) * (r + 5), 1.8, 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'bomber': {
      ctx.beginPath()
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
      ctx.fill()
      // pulsing X warning
      const pulse = 0.6 + 0.4 * Math.sin(tick * 0.18)
      ctx.strokeStyle = `rgba(254,240,138,${pulse})`
      ctx.lineWidth = 1.5
      const k = r * 0.55
      ctx.beginPath()
      ctx.moveTo(e.x - k, e.y - k); ctx.lineTo(e.x + k, e.y + k)
      ctx.moveTo(e.x + k, e.y - k); ctx.lineTo(e.x - k, e.y + k)
      ctx.stroke()
      break
    }

    case 'splitter': {
      // rotating diamond
      const rot = tick * 0.05
      ctx.save()
      ctx.translate(e.x, e.y)
      ctx.rotate(rot)
      ctx.fillRect(-r, -r, r * 2, r * 2)
      // crack lines hint at splitting
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(-r, 0); ctx.lineTo(r, 0)
      ctx.moveTo(0, -r); ctx.lineTo(0, r)
      ctx.stroke()
      ctx.restore()
      break
    }

    case 'summoner': {
      ctx.beginPath()
      ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
      ctx.fill()
      // rotating rune dots
      const rot = tick * 0.045
      const orbR = r + 5
      ctx.fillStyle = '#bae6fd'
      for (let i = 0; i < 4; i++) {
        const a = rot + (i / 4) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(e.x + Math.cos(a) * orbR, e.y + Math.sin(a) * orbR, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }

    case 'burster': {
      // 5-point spiked crystal, slowly rotating
      const rot = tick * 0.025
      ctx.save()
      ctx.translate(e.x, e.y)
      ctx.rotate(rot)
      ctx.beginPath()
      const pts = 5
      for (let i = 0; i < pts * 2; i++) {
        const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2
        const rr = i % 2 === 0 ? r * 1.2 : r * 0.45
        const x = Math.cos(a) * rr
        const y = Math.sin(a) * rr
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
      // inner glow dot — hint of "loaded" projectiles
      ctx.fillStyle = '#ede9fe'
      ctx.beginPath()
      ctx.arc(0, 0, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      break
    }
  }

  // hp bar for tougher enemies
  if (e.maxHp > 25 && e.hp < e.maxHp) {
    const w = e.r * 2
    ctx.fillStyle = '#27272a'
    ctx.fillRect(e.x - w / 2, e.y - e.r - 6, w, 2)
    ctx.fillStyle = '#f87171'
    ctx.fillRect(e.x - w / 2, e.y - e.r - 6, w * (e.hp / e.maxHp), 2)
  }
}

function enemyColor(e: Enemy): string {
  switch (e.kind) {
    case 'walker':   return '#ef4444'
    case 'fast':     return '#f97316'
    case 'tank':     return '#7f1d1d'
    case 'shooter':  return '#a855f7'
    case 'swarm':    return '#facc15'
    case 'bomber':   return '#84cc16'
    case 'summoner': return '#06b6d4'
    case 'splitter': return '#ec4899'
    case 'burster':  return '#a78bfa'
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, s: GameState) {
  const gridSize = 60
  const x0 = Math.floor((s.cameraX - W / 2) / gridSize) * gridSize
  const y0 = Math.floor((s.cameraY - H / 2) / gridSize) * gridSize
  const x1 = s.cameraX + W / 2 + gridSize
  const y1 = s.cameraY + H / 2 + gridSize
  ctx.strokeStyle = '#161618'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = x0; x <= x1; x += gridSize) {
    ctx.moveTo(x, y0); ctx.lineTo(x, y1)
  }
  for (let y = y0; y <= y1; y += gridSize) {
    ctx.moveTo(x0, y); ctx.lineTo(x1, y)
  }
  ctx.stroke()
}

function drawHud(ctx: CanvasRenderingContext2D, s: GameState) {
  ctx.font = '11px ui-monospace, SFMono-Regular, monospace'
  ctx.textAlign = 'left'

  // hp bar
  const hpW = 200
  ctx.fillStyle = '#1a1a1c'
  ctx.fillRect(12, 12, hpW, 10)
  ctx.fillStyle = '#dc2626'
  ctx.fillRect(12, 12, hpW * (s.hp / s.maxHp), 10)
  ctx.strokeStyle = '#27272a'
  ctx.strokeRect(12, 12, hpW, 10)
  ctx.fillStyle = '#a1a1aa'
  ctx.fillText(`${Math.ceil(s.hp)} / ${s.maxHp}`, 18, 21)

  // xp bar
  ctx.fillStyle = '#1a1a1c'
  ctx.fillRect(12, 26, hpW, 4)
  ctx.fillStyle = '#fb923c'
  ctx.fillRect(12, 26, hpW * (s.xp / s.xpToNext), 4)

  // level / time / kills
  ctx.fillStyle = '#fafafa'
  ctx.fillText(`LV ${s.level}`, 12, 46)
  const mm = Math.floor(s.time / 60).toString().padStart(2, '0')
  const ss = Math.floor(s.time % 60).toString().padStart(2, '0')
  ctx.textAlign = 'center'
  ctx.fillText(`${mm}:${ss}`, W / 2, 22)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#71717a'
  ctx.fillText(`kills ${s.kills}`, W - 12, 22)

  // ── right column: ACTIVE / EVOLVED / PASSIVE ────
  ctx.textAlign = 'right'
  let yy = 46

  const baseWeapons = s.weapons.filter(w => !EVOLVED_IDS.has(w.id))
  const evolvedWeapons = s.weapons.filter(w => EVOLVED_IDS.has(w.id))

  // section: ACTIVE (only base / unevolved weapons)
  if (baseWeapons.length > 0) {
    ctx.fillStyle = '#52525b'
    ctx.fillText('ACTIVE', W - 12, yy)
    yy += 14
    for (const w of baseWeapons) {
      const maxed = w.level >= MAX_WEAPON_LV
      ctx.fillStyle = maxed ? '#fb923c' : '#d4d4d8'
      ctx.fillText(`${CARD_LABEL[w.id]} · ${w.level}${maxed ? ' max' : ''}`, W - 12, yy)
      yy += 14
    }
  }

  // section: EVOLVED (only if any evolved weapons exist)
  if (evolvedWeapons.length > 0) {
    yy += 8
    ctx.fillStyle = '#a16207'   // dim gold for header
    ctx.fillText('EVOLVED', W - 12, yy)
    yy += 14
    ctx.fillStyle = '#fbbf24'   // bright gold for items
    for (const w of evolvedWeapons) {
      ctx.fillText(CARD_LABEL[w.id], W - 12, yy)
      yy += 14
    }
  }

  // section: PASSIVE — only show stats that have changed from default
  const ps = s.stats
  const lines: string[] = []
  if (ps.damage > 1)      lines.push(`dmg ×${ps.damage.toFixed(2)}`)
  if (ps.speed > 1)       lines.push(`spd ×${ps.speed.toFixed(2)}`)
  if (ps.haste < 1)       lines.push(`cd ×${ps.haste.toFixed(2)}`)
  if (ps.pickup > 1)      lines.push(`mag ×${ps.pickup.toFixed(2)}`)
  if (ps.maxHpBonus > 0)  lines.push(`hp +${ps.maxHpBonus}`)
  if (ps.regen > 0)       lines.push(`regen ${ps.regen.toFixed(1)}/s`)
  if (ps.lifesteal > 0)   lines.push(`vamp ${(ps.lifesteal * 100).toFixed(0)}%`)
  if (ps.crit > 0)        lines.push(`crit ${(ps.crit * 100).toFixed(0)}%`)
  if (ps.cardCount > 3)   lines.push(`luck +${ps.cardCount - 3}`)

  if (lines.length > 0) {
    yy += 8
    ctx.fillStyle = '#52525b'
    ctx.fillText('PASSIVE', W - 12, yy)
    yy += 14
    ctx.fillStyle = '#a3e635'
    for (const line of lines) {
      ctx.fillText(line, W - 12, yy)
      yy += 14
    }
  }
}

function drawCards(ctx: CanvasRenderingContext2D, s: GameState) {
  ctx.fillStyle = 'rgba(0,0,0,0.72)'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fafafa'
  ctx.font = '13px ui-monospace, SFMono-Regular, monospace'
  ctx.textAlign = 'center'
  ctx.fillText('LEVEL UP — choose one', W / 2, 80)

  const cards = s.pendingCards!
  const cw = cards.length >= 4 ? 144 : 170
  const ch = 200, gap = 14
  const totalW = cards.length * cw + (cards.length - 1) * gap
  const startX = (W - totalW) / 2
  const cy = (H - ch) / 2 + 14

  for (let i = 0; i < cards.length; i++) {
    const cx = startX + i * (cw + gap)
    ctx.fillStyle = '#0f0f10'
    ctx.fillRect(cx, cy, cw, ch)
    ctx.strokeStyle = '#3f3f46'
    ctx.strokeRect(cx, cy, cw, ch)
    const id = cards[i]
    const isEvo = EVOLVED_IDS.has(id as WeaponId)
    const isW = !isEvo && (WEAPONS as readonly string[]).includes(id)
    const cur = isW ? s.weapons.find(w => w.id === id as WeaponId) : null
    const passLv = (!isW && !isEvo) ? (s.passiveLv[id as PassiveId] ?? 0) : 0
    const tag = isEvo
      ? 'EVOLUTION'
      : isW
        ? (cur ? `lv ${cur.level} → ${cur.level + 1}` : 'NEW')
        : (passLv > 0 ? `lv ${passLv} → ${passLv + 1}` : 'NEW')
    // gold border for evolutions
    if (isEvo) {
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.strokeRect(cx, cy, cw, ch)
      ctx.lineWidth = 1
    }
    ctx.fillStyle = isEvo ? '#fbbf24' : isW ? '#fb923c' : '#a3e635'
    ctx.font = '10px ui-monospace, SFMono-Regular, monospace'
    ctx.fillText(tag, cx + cw / 2, cy + 24)
    ctx.fillStyle = '#fafafa'
    ctx.font = '14px ui-monospace, SFMono-Regular, monospace'
    ctx.fillText(CARD_LABEL[id], cx + cw / 2, cy + 56)
    ctx.fillStyle = '#a1a1aa'
    ctx.font = '11px ui-monospace, SFMono-Regular, monospace'
    wrapText(ctx, CARD_DESC[id], cx + cw / 2, cy + 92, cw - 20, 16)
    ctx.fillStyle = '#52525b'
    ctx.font = '10px ui-monospace, SFMono-Regular, monospace'
    ctx.fillText(`[${i + 1}]`, cx + cw / 2, cy + ch - 14)
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(' ')
  let line = ''
  let yy = y
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy)
      line = w
      yy += lh
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, yy)
}

function drawDead(ctx: CanvasRenderingContext2D, s: GameState) {
  ctx.fillStyle = 'rgba(0,0,0,0.78)'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fafafa'
  ctx.font = '20px ui-monospace, SFMono-Regular, monospace'
  ctx.textAlign = 'center'
  ctx.fillText('YOU DIED', W / 2, H / 2 - 28)
  ctx.font = '12px ui-monospace, SFMono-Regular, monospace'
  ctx.fillStyle = '#a1a1aa'
  const mm = Math.floor(s.time / 60).toString().padStart(2, '0')
  const ss = Math.floor(s.time % 60).toString().padStart(2, '0')
  ctx.fillText(`survived ${mm}:${ss} · level ${s.level} · ${s.kills} kills`, W / 2, H / 2)
  ctx.fillStyle = '#fb923c'
  ctx.fillText('press [R] or click to restart', W / 2, H / 2 + 28)
}

// ── Component ─────────────────────────────────────────────────────
export default function SurvivorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [, setRender] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = W
    canvas.height = H

    state = makeState()

    let raf = 0
    const loop = () => {
      update(state)
      draw(ctx, state)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase()
      keys[k] = down
      if (down) {
        if (state.dead && (k === 'r' || k === 'enter' || k === ' ')) {
          state = makeState()
          setRender(x => x + 1)
        }
        if (state.pendingCards && (k === '1' || k === '2' || k === '3' || k === '4')) {
          const idx = parseInt(k) - 1
          const cards = state.pendingCards
          if (idx >= 0 && idx < cards.length) {
            applyCard(state, cards[idx])
            state.pendingCards = null
            state.paused = false
          }
        }
      }
    }
    const onDown = (e: KeyboardEvent) => onKey(e, true)
    const onUp   = (e: KeyboardEvent) => onKey(e, false)

    const onClick = (e: MouseEvent) => {
      if (state.dead) {
        state = makeState()
        return
      }
      if (state.pendingCards) {
        const rect = canvas.getBoundingClientRect()
        const mx = (e.clientX - rect.left) * (W / rect.width)
        const my = (e.clientY - rect.top)  * (H / rect.height)
        const cards = state.pendingCards
        const cw = cards.length >= 4 ? 144 : 170
  const ch = 200, gap = 14
        const totalW = cards.length * cw + (cards.length - 1) * gap
        const startX = (W - totalW) / 2
        const cy = (H - ch) / 2 + 14
        for (let i = 0; i < cards.length; i++) {
          const cx = startX + i * (cw + gap)
          if (mx >= cx && mx <= cx + cw && my >= cy && my <= cy + ch) {
            applyCard(state, cards[i])
            state.pendingCards = null
            state.paused = false
            break
          }
        }
      }
    }

    const onBlur = () => { for (const k in keys) keys[k] = false }

    // ── Touch (virtual joystick from initial touch point) ────
    const touchState = { id: -1, sx: 0, sy: 0 }
    const TOUCH_DEAD = 10 // px in CSS units
    const onTouchStart = (e: TouchEvent) => {
      if (touchState.id !== -1) return
      const t = e.changedTouches[0]
      const rect = canvas.getBoundingClientRect()
      touchState.id = t.identifier
      touchState.sx = t.clientX - rect.left
      touchState.sy = t.clientY - rect.top
      touchDir.x = 0; touchDir.y = 0
    }
    const onTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier !== touchState.id) continue
        e.preventDefault()
        const rect = canvas.getBoundingClientRect()
        const dx = (t.clientX - rect.left) - touchState.sx
        const dy = (t.clientY - rect.top)  - touchState.sy
        const dl = Math.hypot(dx, dy)
        if (dl < TOUCH_DEAD) { touchDir.x = 0; touchDir.y = 0 }
        else { touchDir.x = dx / dl; touchDir.y = dy / dl }
        break
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchState.id) {
          touchState.id = -1
          touchDir.x = 0; touchDir.y = 0
          break
        }
      }
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup',   onUp)
    canvas.addEventListener('click',   onClick)
    canvas.addEventListener('touchstart',  onTouchStart, { passive: true })
    canvas.addEventListener('touchmove',   onTouchMove,  { passive: false })
    canvas.addEventListener('touchend',    onTouchEnd,   { passive: true })
    canvas.addEventListener('touchcancel', onTouchEnd,   { passive: true })
    window.addEventListener('blur',    onBlur)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup',   onUp)
      canvas.removeEventListener('click',   onClick)
      canvas.removeEventListener('touchstart',  onTouchStart)
      canvas.removeEventListener('touchmove',   onTouchMove)
      canvas.removeEventListener('touchend',    onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('blur',    onBlur)
      touchDir.x = 0; touchDir.y = 0
    }
  }, [])

  return (
    <div className="py-8">
      <BackLink section="survivor" />

      <div className="mb-5">
        <h1 className="font-mono text-zinc-100 text-xl mb-1 tracking-tight">survivor</h1>
        <p className="font-mono text-zinc-600 text-xs">
          뱀파이어 서바이벌 풍 — 자동 공격 · 레벨업 · 카드 선택 · 라이브러리 없음
        </p>
      </div>

      <div className="border border-zinc-800/80" style={{ lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          tabIndex={0}
          style={{
            width: '100%',
            maxWidth: W,
            height: 'auto',
            display: 'block',
            cursor: 'crosshair',
            outline: 'none',
            background: '#0a0a0a',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
        />
      </div>

      <p className="mt-4 font-mono text-[11px] text-zinc-800 leading-relaxed">
        WASD/방향키 또는 터치 드래그 이동 · 공격 자동 · 레벨업 시 숫자키 또는 탭 · R 재시작 · 무기 9종 · 패시브 9종
      </p>
    </div>
  )
}
