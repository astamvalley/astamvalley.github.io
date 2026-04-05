export interface BookmarkItem {
  slug: string
  name: string
  category: string
  url: string
  tagline: string
  description: string
  platforms: string[]
  pricing: {
    type: 'free' | 'freemium' | 'paid'
    label: string
    detail: string
  }
  pros: string[]
  cons: string[]
  sections: { title: string; body: string }[]
  updatedAt: string
}

export const bookmarks: BookmarkItem[] = [
  {
    slug: 'pencil',
    name: 'Pencil',
    category: 'Design',
    url: 'https://www.pencil.dev/',
    tagline: 'Design on canvas. Land in code.',
    description: 'IDE 안에서 캔버스로 디자인하고 바로 코드로 변환하는 개발자용 디자인 도구.',
    platforms: ['VS Code', 'Cursor', 'OpenVSX'],
    pricing: {
      type: 'free',
      label: 'Free',
      detail: '현재 완전 무료. 향후 유료 플랜 도입 시 사전 고지 예정.',
    },
    pros: [
      'IDE를 벗어나지 않고 디자인과 코드를 동시에 작업',
      '별도 디자인 툴 없이 혼자 프로토타입 완성 가능',
      '현재 완전 무료',
    ],
    cons: [
      'VS Code 계열 IDE 전용 — 다른 환경 미지원',
      '아직 초기 단계로 기능이 제한적',
      '향후 유료화 가능성 있음',
    ],
    sections: [
      {
        title: '무엇인가',
        body: 'Pencil은 디자인과 개발 사이의 간극을 없애기 위해 만들어진 도구다. 기존에는 Figma 같은 별도 디자인 툴에서 작업한 뒤 개발자가 이를 코드로 옮기는 과정이 필요했다. Pencil은 이 과정을 IDE 안으로 끌어들인다. 캔버스에서 직접 UI를 설계하면, 그 결과가 즉시 코드로 변환된다.',
      },
      {
        title: '주요 기능',
        body: '• IDE 통합 캔버스 — Cursor, VS Code, OpenVSX 환경에서 바로 실행\n• 디자인 → 코드 변환 — 캔버스에서 그린 UI가 실제 동작하는 코드로 출력\n• 프롬프트 갤러리 — 자주 쓰는 UI 패턴을 갤러리에서 불러와 재사용',
      },
      {
        title: '이런 사람에게 유용',
        body: '디자이너와 협업 없이 혼자 프로토타입을 빠르게 만들어야 하는 개발자, 또는 코드를 쓸 줄 알지만 Figma 같은 툴이 익숙하지 않은 경우에 특히 잘 맞는다. 프론트엔드 속도를 높이고 싶은 솔로 개발자에게 추천.',
      },
    ],
    updatedAt: '2026-04-05',
  },
  {
    slug: 'pinterest',
    name: 'Pinterest',
    category: 'Design',
    url: 'https://www.pinterest.com/',
    tagline: '세상의 모든 아이디어를 발견하고 저장하는 비주얼 탐색 플랫폼.',
    description: '이미지·영상 기반 무드보드 & 레퍼런스 수집 플랫폼. 디자인 영감과 레퍼런스 수집에 최적.',
    platforms: ['Web', 'iOS', 'Android'],
    pricing: {
      type: 'free',
      label: 'Free',
      detail: '개인 사용 무료. 광고 집행(Pinterest Ads)만 유료.',
    },
    pros: [
      '방대한 비주얼 레퍼런스 데이터베이스',
      '보드로 프로젝트별 무드보드 체계적으로 관리',
      '비주얼 검색으로 유사 이미지 탐색 가능',
    ],
    cons: [
      '한국 콘텐츠보다 영어권 콘텐츠 중심',
      '광고가 피드에 섞여 노출됨',
      '저작권 불분명한 이미지가 많아 직접 사용 주의',
    ],
    sections: [
      {
        title: '무엇인가',
        body: 'Pinterest는 이미지와 영상을 기반으로 아이디어를 탐색하고 저장하는 플랫폼이다. 검색엔진이라기보다는 비주얼 탐색 도구에 가깝다. 인테리어, UI 디자인, 패션, 브랜딩, 타이포그래피 등 시각적 레퍼런스가 필요한 모든 분야에서 활용된다.',
      },
      {
        title: '주요 기능',
        body: '• 핀(Pin) — 마음에 드는 이미지나 링크를 저장하는 기본 단위\n• 보드(Board) — 핀을 카테고리별로 모아두는 폴더. 무드보드 용도로 활용\n• 비주얼 검색 — 이미지 안의 특정 요소를 클릭해 유사한 이미지 검색\n• 아이디어 피드 — 관심사 기반으로 새로운 레퍼런스를 자동으로 추천',
      },
      {
        title: '이런 사람에게 유용',
        body: '디자인 작업 전 무드보드를 만들거나, 프로젝트 레퍼런스를 체계적으로 모아두고 싶은 경우. UI/UX, 브랜드 디자인, 일러스트, 공간 디자인 등 시각적 영감이 필요한 모든 작업에서 출발점으로 쓰기 좋다.',
      },
    ],
    updatedAt: '2026-04-05',
  },
  {
    slug: 'obsidian',
    name: 'Obsidian',
    category: 'Productivity',
    url: 'https://obsidian.md/',
    tagline: '로컬 기반 마크다운 노트 앱. 생각을 연결하는 개인 지식 관리 도구.',
    description: '모든 노트를 로컬 마크다운 파일로 저장. 노트 간 링크와 그래프 뷰로 생각의 연결망을 구축하는 PKM 도구.',
    platforms: ['macOS', 'Windows', 'Linux', 'iOS', 'Android'],
    pricing: {
      type: 'freemium',
      label: 'Freemium',
      detail: '핵심 기능 무료 (회원가입 불필요). Sync $4/월(연간) · Publish $8/월(연간) 별도.',
    },
    pros: [
      '모든 데이터가 로컬 마크다운 파일 — 서비스 종료돼도 데이터 안전',
      '플러그인 생태계가 방대해 원하는 워크플로우로 확장 가능',
      '오프라인에서도 빠르게 동작',
      '마크다운 기반이라 다른 도구로 이전이 쉬움',
    ],
    cons: [
      '초기 설정과 플러그인 구성에 시간이 걸림',
      '기기 간 동기화는 유료 (Sync) 또는 별도 설정 필요',
      '협업·공유 기능이 약함 — 개인용에 최적화',
    ],
    sections: [
      {
        title: '무엇인가',
        body: 'Obsidian은 마크다운 파일을 로컬에 저장하는 노트 앱이다. 클라우드 의존 없이 내 컴퓨터에 모든 데이터가 남는다. 단순한 메모 앱이 아니라, 노트 사이에 링크를 걸어 생각의 네트워크를 만드는 PKM(Personal Knowledge Management) 도구에 가깝다. 오래 쓸수록 노트들이 서로 연결되며 지식 기반이 된다.',
      },
      {
        title: '주요 기능',
        body: '• 양방향 링크 — [[노트명]]으로 노트 간 연결. 역링크도 자동으로 추적\n• Graph View — 모든 노트의 연결관계를 인터랙티브 그래프로 시각화\n• Canvas — 노트를 무한 캔버스 위에 배치해 브레인스토밍, 다이어그램 작성\n• 플러그인 생태계 — 캘린더, 칸반, DataView, Tasks 등 수천 개의 커뮤니티 플러그인\n• Sync (유료) — 기기 간 E2E 암호화 동기화, 1년 버전 히스토리\n• Publish (유료) — 노트를 온라인 위키, 지식 베이스로 바로 발행',
      },
      {
        title: '이런 사람에게 유용',
        body: '개발 공부 정리, 독서 노트, 프로젝트 문서화 등 장기적으로 쌓이는 지식을 체계적으로 관리하고 싶은 사람. 노션처럼 온라인 의존 없이 오프라인에서도 빠르게 동작하는 게 중요한 경우. 마크다운에 익숙한 개발자에게 특히 잘 맞는다.',
      },
    ],
    updatedAt: '2026-04-05',
  },
]

export const categories = [...new Set(bookmarks.map((b) => b.category))]
