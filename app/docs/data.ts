export interface Integration {
  name: string
  url: string
  note: string
}

export interface BookmarkItem {
  slug: string
  name: string
  category: string
  url: string
  tagline: string
  description: string
  platforms?: string[]
  pricing?: {
    type: 'free' | 'freemium' | 'paid'
    label: string
    detail: string
  }
  pros?: string[]
  cons?: string[]
  sections: { title: string; body: string }[]
  integrations?: {
    mcp?: Integration[]
    cli?: Integration[]
  }
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
    integrations: {
      mcp: [
        {
          name: 'Pencil MCP (내장)',
          url: 'https://www.pencil.dev/',
          note: '확장 설치 시 자동 실행. Claude Code가 .pen 파일을 직접 읽어 정확한 좌표·토큰 기반으로 컴포넌트를 생성.',
        },
      ],
    },
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
    slug: 'frontend-fundamentals',
    name: 'Frontend Fundamentals',
    category: 'Learning',
    url: 'https://frontend-fundamentals.com/',
    tagline: '변경하기 쉬운 코드를 작성하는 방법에 대한 프론트엔드 지침서.',
    description: '토스 프론트엔드 팀이 정리한 코드 품질 가이드. 가독성·예측 가능성·응집도·결합도 4가지 관점에서 구체적인 Before/After 예시로 좋은 코드의 기준을 설명한다.',
    sections: [
      {
        title: '개요',
        body: 'Frontend Fundamentals는 "변경하기 쉬운 프론트엔드 코드를 위한 지침서"다. 좋은 코드를 막연하게 설명하는 대신, 가독성·예측 가능성·응집도·결합도라는 4가지 관점에서 구체적인 Before/After 예시로 풀어낸다.\n\n토스 프론트엔드 팀이 실제 프로덕트에서 검증한 기준을 오픈소스로 공개했으며, 15개 이상의 실전 사례 연구로 구성된다.',
      },
      {
        title: '가독성 (Readability)',
        body: '코드를 처음 읽는 사람이 빠르게 이해할 수 있는 구조를 만드는 방법.\n\n• 맥락 줄이기 — 함께 실행되지 않는 코드 분리, 구현 상세 추상화, 함수 분할\n• 이름 붙이기 — 복잡한 조건식과 매직 넘버에 이름 부여\n• 순차적 읽기 — 코드 읽는 시점의 이동 최소화, 삼항 연산자 단순화, 좌우 순서 최적화',
      },
      {
        title: '예측 가능성 (Predictability)',
        body: '코드가 예상대로 동작한다는 신뢰를 만드는 방법.\n\n• 이름 충돌 방지 — 같은 이름이 다른 의미로 쓰이지 않도록\n• 유사 함수의 반환 타입 통일 — 같은 패턴의 함수는 같은 형태로 반환\n• 숨은 로직 명시화 — 부수 효과나 암묵적 동작을 코드 구조로 드러내기',
      },
      {
        title: '응집도 (Cohesion)',
        body: '함께 변경되는 것들을 함께 두는 방법.\n\n• 함께 수정되는 파일의 같은 디렉토리 배치 — 관련 코드를 가까이\n• 매직 넘버 제거 — 의미 있는 상수로 응집\n• 폼 요소의 응집도 최적화 — 연관된 상태와 핸들러를 한 곳에서 관리',
      },
      {
        title: '결합도 (Coupling)',
        body: '변경이 전파되지 않도록 의존성을 줄이는 방법.\n\n• 단일 책임 관리 — 한 모듈이 여러 관심사를 갖지 않도록\n• 중복 코드 허용 — 억지로 공통화하면 결합도가 높아질 수 있다. 변경 패턴이 같을 때만 추상화\n• Props Drilling 제거 — 컴포넌트 트리를 통한 불필요한 의존성 차단',
      },
      {
        title: '구성 방식',
        body: '각 원칙은 구체적인 사례 연구로 설명한다. 버튼, HTTP 요청, 폼 필드, 모달 등 실제 UI 컴포넌트를 예시로 삼아 Before/After 코드를 나란히 보여준다.\n\n한국어, 영어, 일본어, 중국어 간체를 지원하며, GitHub 토론을 통해 커뮤니티가 함께 가이드를 발전시키고 있다.',
      },
    ],
    updatedAt: '2026-04-05',
  },
  {
    slug: 'transform',
    name: 'Transform',
    category: 'Dev Tools',
    url: 'https://transform.tools/',
    tagline: '다양한 포맷을 즉시 변환하는 개발자용 온라인 변환 도구 모음.',
    description: 'JSON→TypeScript, SVG→JSX, CSS→JS-in-CSS 등 개발 중 자주 필요한 포맷 변환을 브라우저에서 바로 처리.',
    platforms: ['Web'],
    pricing: {
      type: 'free',
      label: 'Free',
      detail: '완전 무료 오픈소스.',
    },
    pros: [
      '설치 없이 브라우저에서 즉시 사용',
      'JSON, SVG, CSS, GraphQL 등 지원 포맷이 매우 다양',
      '변환 결과를 바로 복사해서 코드에 붙여넣기 가능',
    ],
    cons: [
      '인터넷 연결이 필요 (오프라인 불가)',
      '복잡한 커스텀 변환 옵션은 제한적',
    ],
    sections: [
      {
        title: '무엇인가',
        body: 'Transform은 개발 중 자주 마주치는 포맷 변환 작업을 모아둔 온라인 도구다. JSON 스키마를 TypeScript 타입으로, SVG를 React 컴포넌트로, styled-components를 CSS 모듈로 — 일일이 손으로 변환하던 작업을 붙여넣기 한 번으로 끝낸다.',
      },
      {
        title: '지원 변환 종류',
        body: '• JSON → TypeScript / Zod / Mongoose Schema / Flow\n• SVG → JSX / React Native\n• CSS → JS-in-CSS (styled-components, Emotion 등)\n• GraphQL → TypeScript / Flow\n• HTML → JSX\n• 그 외 다수',
      },
      {
        title: '이런 사람에게 유용',
        body: 'API 응답 JSON으로 TypeScript 타입을 빠르게 만들어야 할 때, 혹은 디자이너에게 받은 SVG를 JSX 컴포넌트로 바꿀 때. 반복적인 보일러플레이트 변환 작업을 줄이고 싶은 프론트엔드 개발자에게 유용하다.',
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
  {
    slug: 'muzli',
    name: 'Muzli',
    category: 'Design',
    url: 'https://muz.li/',
    tagline: '매일 새로운 디자인 영감을 새 탭에서 바로 받는 브라우저 익스텐션.',
    description: '새 탭을 열 때마다 디자인·테크·아트 분야의 최신 큐레이션 콘텐츠가 등장. 전 세계 80만 이상 디자이너·개발자가 사용.',
    platforms: ['Chrome', 'Firefox'],
    pricing: {
      type: 'free',
      label: 'Free',
      detail: '완전 무료.',
    },
    pros: [
      '설치 후 새 탭만 열면 자동으로 큐레이션 — 별도 방문 없이 영감 수집',
      'UI, 타이포그래피, 모션, 브랜딩 등 카테고리별 필터 지원',
      'Dribbble, Behance, Product Hunt 등 수백 개 소스를 한 곳에서',
    ],
    cons: [
      '새 탭이 콘텐츠로 가득 차 집중력을 방해할 수 있음',
      '한국 디자인 콘텐츠 비중이 낮음',
    ],
    sections: [
      {
        title: '무엇인가',
        body: 'Muzli는 새 탭을 디자인 영감 피드로 바꿔주는 브라우저 확장 프로그램이다. 새 탭을 열 때마다 Dribbble, Behance, Product Hunt 등 수백 개 소스에서 큐레이션된 최신 콘텐츠가 자동으로 로드된다. 따로 사이트를 방문하지 않아도 업계 트렌드와 디자인 영감을 자연스럽게 접하게 된다.',
      },
      {
        title: '주요 기능',
        body: '• 자동 큐레이션 — 수백 개 소스의 최신 콘텐츠를 새 탭에 자동 표시\n• 카테고리 필터 — UI, 타이포그래피, 모션, 브랜딩, 개발 등 관심 분야 선택\n• 북마크 — 마음에 드는 콘텐츠를 저장해 나중에 다시 참고\n• 다크/라이트 모드 지원',
      },
      {
        title: '이런 사람에게 유용',
        body: '매일 새로운 디자인 트렌드를 파악하고 싶지만 따로 시간을 내기 어려운 경우. 새 탭을 여는 습관만으로 꾸준히 영감을 쌓고 싶은 디자이너·프론트엔드 개발자에게 잘 맞는다.',
      },
    ],
    updatedAt: '2026-04-05',
  },
  {
    slug: 'agentskills',
    name: 'Agent Skills',
    category: 'Learning',
    url: 'https://agentskills.io/',
    tagline: 'AI 에이전트에게 새로운 능력을 부여하는 오픈 포맷 스펙.',
    description: 'Anthropic이 개발하고 오픈 표준으로 공개한 스킬 포맷. SKILL.md 파일 하나로 에이전트 능력을 정의하고 Claude Code, GitHub Copilot, Cursor, Gemini CLI 등 30개 이상 에이전트에서 재사용 가능.',
    sections: [
      {
        title: '개요',
        body: 'Agent Skills는 AI 에이전트에게 새로운 능력을 부여하는 오픈 포맷이다. Anthropic이 개발하고 오픈 표준으로 공개했으며, Claude Code, GitHub Copilot, Cursor, Gemini CLI, OpenCode, Junie, Amp, Goose 등 30개 이상의 에이전트 제품이 채택하고 있다.\n\n에이전트는 갈수록 강력해지지만 실제 작업을 신뢰성 있게 수행하기 위한 컨텍스트가 부족한 경우가 많다. 스킬은 에이전트가 필요할 때 불러올 수 있는 절차적 지식과 팀·조직·사용자별 맥락을 제공해 이 문제를 해결한다.',
      },
      {
        title: '스킬 구조',
        body: '스킬은 최소한 SKILL.md 파일 하나를 포함하는 디렉토리다.\n\nskill-name/\n├── SKILL.md          # 필수: 메타데이터 + 지시문\n├── scripts/          # 선택: 실행 가능한 코드\n├── references/       # 선택: 추가 문서\n└── assets/           # 선택: 템플릿, 리소스\n\nSKILL.md 파일은 YAML 프론트매터와 마크다운 본문으로 구성된다.',
      },
      {
        title: 'SKILL.md 프론트매터',
        body: '프론트매터에 사용할 수 있는 필드:\n\n• name (필수) — 스킬 식별자. 소문자·숫자·하이픈만 허용, 1–64자. 디렉토리명과 일치해야 함\n• description (필수) — 스킬이 무엇을 하는지, 언제 사용하는지 설명. 1–1024자. 에이전트가 이 필드를 보고 스킬 활성화 여부를 결정함\n• license (선택) — 라이선스명 또는 번들 라이선스 파일 참조\n• compatibility (선택) — 환경 요구사항. 의도한 제품, 시스템 패키지, 네트워크 접근 등. 1–500자\n• metadata (선택) — 추가 메타데이터를 위한 키-값 맵\n• allowed-tools (선택, 실험적) — 사전 승인된 도구 목록. 공백으로 구분\n\n최소 예시:\n---\nname: my-skill\ndescription: 무엇을 하는지, 언제 사용하는지 설명.\n---',
      },
      {
        title: '동작 방식 — Progressive Disclosure',
        body: '스킬은 3단계 점진적 공개 방식으로 동작해 컨텍스트를 효율적으로 관리한다.\n\n1. Discovery — 에이전트 시작 시 모든 스킬의 name과 description만 로드(~100 토큰). 어떤 스킬이 있는지 파악하는 단계\n2. Activation — 작업이 스킬 description과 매칭되면 SKILL.md 전체 본문을 컨텍스트에 로드. 5,000 토큰 이내 권장\n3. Execution — 에이전트가 지시문을 따르며, 필요 시 scripts/, references/, assets/ 파일을 추가 로드\n\nSKILL.md 본문은 500줄 이내로 유지하고, 상세 레퍼런스는 references/ 하위 파일로 분리하는 것을 권장한다.',
      },
      {
        title: '본문(Body) 작성',
        body: '프론트매터 이후 마크다운 본문에 실제 지시문을 작성한다. 형식 제한은 없으나 아래 항목을 포함하는 것을 권장한다.\n\n• 단계별 지시문\n• 입력/출력 예시\n• 자주 발생하는 엣지 케이스\n\n에이전트가 스킬을 활성화하면 SKILL.md 전체를 한 번에 로드한다. 본문이 길어질 경우 references/ 디렉토리의 개별 파일로 분리하고 파일 참조를 사용한다.',
      },
      {
        title: '선택 디렉토리',
        body: '• scripts/ — 에이전트가 실행할 수 있는 코드. Python, Bash, JavaScript 등 에이전트 구현에 따라 지원 언어가 다름. 독립적으로 동작하거나 의존성을 명확히 문서화해야 함\n• references/ — 에이전트가 필요 시 읽는 추가 문서. REFERENCE.md, 도메인별 파일 등. 각 파일은 집중적으로 유지 — 에이전트가 온디맨드로 로드하므로 작을수록 좋음\n• assets/ — 정적 리소스. 템플릿, 다이어그램, 데이터 파일 등',
      },
      {
        title: '채택 에이전트',
        body: 'Agent Skills 포맷을 지원하는 주요 에이전트 및 도구:\n\nClaude Code, GitHub Copilot, VS Code, Cursor, Gemini CLI, OpenAI Codex, OpenCode, Junie (JetBrains), Amp, Goose, OpenHands, Roo Code, Letta, Firebender, Mux, Laravel Boost, Factory, Snowflake Cortex Code, Kiro, Spring AI, TRAE 등 30개 이상',
      },
      {
        title: '검증',
        body: 'skills-ref 라이브러리로 스킬의 유효성을 검사할 수 있다.\n\nskills-ref validate ./my-skill\n\nSKILL.md 프론트매터 유효성과 네이밍 컨벤션 준수 여부를 확인한다.\nGitHub: github.com/agentskills/agentskills',
      },
    ],
    updatedAt: '2026-04-06',
  },
  {
    slug: 'agentation',
    name: 'Agentation',
    category: 'Dev Tools',
    url: 'https://github.com/benjitaylor/agentation',
    tagline: 'AI 에이전트를 위한 시각적 UI 피드백 도구.',
    description: '페이지 요소를 클릭하면 CSS 셀렉터·위치 정보를 구조화된 텍스트로 출력. AI 에이전트에게 "어떤 요소"인지 정확히 전달.',
    platforms: ['Web'],
    pricing: {
      type: 'free',
      label: 'Free',
      detail: '오픈소스, 완전 무료.',
    },
    pros: [
      '"파란 버튼 왼쪽에 있는 거" 대신 정확한 CSS 셀렉터를 에이전트에 전달',
      '클릭, 텍스트 선택, 영역 선택 등 다양한 어노테이션 방식',
      'Agent Skill로도 제공 — Claude Code에서 /agentation으로 바로 호출 가능',
    ],
    cons: [
      '아직 초기 단계 프로젝트',
      '브라우저에서 페이지에 직접 주입하는 방식이라 환경에 따라 구성 필요',
    ],
    sections: [
      {
        title: '무엇인가',
        body: 'Agentation은 AI 에이전트에게 UI 피드백을 줄 때 생기는 모호함을 해결하는 도구다. 페이지에서 요소를 클릭하면 그 요소의 CSS 셀렉터, 위치, 계층 구조를 자동으로 추출해 구조화된 텍스트로 출력한다. 에이전트는 이 텍스트를 받아 코드베이스에서 정확히 어떤 부분을 수정해야 하는지 바로 파악할 수 있다.',
      },
      {
        title: '주요 기능',
        body: '• 클릭 어노테이션 — 요소 클릭 시 셀렉터·위치 자동 추출\n• 텍스트·영역 선택 — 드래그나 영역 지정으로 범위 피드백\n• 멀티 선택 — 여러 요소를 한 번에 선택해 일괄 전달\n• 애니메이션 일시정지 — 동적 UI 검사 시 유용\n• Agent Skill 제공 — Claude Code에서 /agentation으로 호출',
      },
      {
        title: '이런 사람에게 유용',
        body: 'Claude Code나 Cursor로 프론트엔드 작업을 할 때 에이전트가 엉뚱한 요소를 수정하는 문제를 줄이고 싶은 경우. 복잡한 컴포넌트 트리에서 "이 요소"를 정확하게 짚어 전달하고 싶을 때 유용하다.',
      },
    ],
    updatedAt: '2026-04-05',
  },
  {
    slug: 'cmux',
    name: 'cmux',
    category: 'Dev Tools',
    url: 'https://github.com/manaflow-ai/cmux',
    tagline: 'AI 코딩 에이전트를 위한 macOS 네이티브 터미널.',
    description: 'Ghostty 기반 macOS 터미널. 수직 탭에 Git 브랜치·PR 상태를 표시하고, Claude Code 훅 연동 알림 시스템 내장.',
    platforms: ['macOS'],
    pricing: {
      type: 'free',
      label: 'Free',
      detail: '오픈소스, 완전 무료.',
    },
    pros: [
      'Electron 없는 Swift/AppKit 네이티브 — 빠른 시작, 낮은 메모리',
      '수직 탭에 Git 브랜치, PR 상태, 포트 정보를 한눈에',
      'Claude Code·OpenCode 훅에 cmux notify 연결해 에이전트 완료 알림 자동화',
    ],
    cons: [
      'macOS 전용',
      'Ghostty 기반이라 Ghostty 설치 필요',
      '아직 활발히 개발 중인 초기 프로젝트',
    ],
    sections: [
      {
        title: '무엇인가',
        body: 'cmux는 AI 코딩 에이전트 워크플로우에 최적화된 macOS 네이티브 터미널이다. Ghostty를 기반으로 수직 탭 사이드바, 알림 시스템, 워크스페이스 관리를 추가했다. Electron 없이 Swift와 AppKit으로 만들어 빠르고 가볍다.',
      },
      {
        title: '주요 기능',
        body: '• 수직 탭 — 각 탭에 Git 브랜치, 연결된 PR 번호/상태, 작업 디렉토리, 열린 포트 표시\n• 알림 시스템 — OSC 9/99/777 시퀀스를 감지해 에이전트 작업 완료를 알림\n• CLI (cmux) — 워크스페이스 생성, 패널 분할, 키 입력 전송, 브라우저 자동화를 스크립트로 제어\n• 소켓 API — 외부 프로세스에서 터미널을 프로그래밍 방식으로 조작',
      },
      {
        title: '이런 사람에게 유용',
        body: 'Claude Code나 OpenCode를 여러 워크스페이스에서 병렬로 돌리는 경우. 에이전트 작업 완료 시 알림을 받고 싶거나, 터미널 상태를 스크립트로 자동화하고 싶은 macOS 사용자에게 맞는다.',
      },
    ],
    integrations: {
      cli: [
        {
          name: 'cmux CLI',
          url: 'https://github.com/manaflow-ai/cmux',
          note: 'cmux notify, 워크스페이스 생성, 패널 제어 등을 커맨드라인에서 실행. Claude Code 훅에 연결해 에이전트 완료 알림 자동화 가능.',
        },
      ],
    },
    updatedAt: '2026-04-05',
  },
  {
    slug: 'insomnia',
    name: 'Insomnia',
    category: 'Dev Tools',
    url: 'https://insomnia.rest/',
    tagline: 'REST, GraphQL, gRPC, WebSocket을 모두 다루는 오픈소스 API 클라이언트.',
    description: '로컬·Git·클라우드 스토리지를 선택할 수 있는 크로스플랫폼 API 클라이언트. 디자인·테스트·목업·CI/CD까지 API 개발 전 사이클 지원.',
    platforms: ['macOS', 'Windows', 'Linux'],
    pricing: {
      type: 'freemium',
      label: 'Freemium',
      detail: '개인 무료. Individual $5/월 · Team $12/월 · Enterprise $45/월 (협업·Git Sync·SAML 등 추가).',
    },
    pros: [
      'REST, GraphQL, gRPC, WebSocket, SSE, SOAP 등 폭넓은 프로토콜 지원',
      '로컬/Git/클라우드 스토리지 선택 가능 — 데이터 주권 유지',
      'OpenAPI 에디터, 테스트 스위트, 목업 서버, CI/CD CLI까지 한 도구에',
      '오픈소스라 자체 호스팅 가능',
    ],
    cons: [
      '팀 협업·Git Sync는 유료 플랜 필요',
      'Postman에 비해 플러그인 생태계가 작음',
    ],
    sections: [
      {
        title: '무엇인가',
        body: 'Insomnia는 Kong이 만든 오픈소스 API 클라이언트다. REST·GraphQL·gRPC·WebSocket·SSE 등 다양한 프로토콜을 한 앱에서 다룰 수 있다. 단순한 요청 실행을 넘어, OpenAPI 기반 API 설계, 네이티브 테스트 스위트, 클라우드 목업 서버, CI/CD용 CLI까지 API 개발 전 사이클을 커버한다.',
      },
      {
        title: '주요 기능',
        body: '• 멀티 프로토콜 — REST, GraphQL, gRPC, WebSocket, SSE, SOAP 지원\n• 스토리지 선택 — 로컬 전용, Git 저장소, 클라우드 중 선택\n• API 디자인 — OpenAPI 에디터와 시각적 미리보기\n• 테스트 스위트 — 네이티브 테스트 작성 및 컬렉션 러너\n• 목업 서버 — 클라우드 또는 셀프호스트 목업\n• inso CLI — CI/CD 파이프라인에서 린팅·테스트 실행',
      },
      {
        title: '이런 사람에게 유용',
        body: 'Postman의 클라우드 의존이나 가격이 부담스러운 개발자. 데이터를 로컬이나 Git에 직접 관리하고 싶은 경우, 또는 GraphQL·gRPC처럼 REST 외 프로토콜을 자주 다루는 경우에 잘 맞는다.',
      },
    ],
    integrations: {
      cli: [
        {
          name: 'inso CLI',
          url: 'https://docs.insomnia.rest/inso-cli/introduction',
          note: 'API 스펙 린팅, 테스트 스위트 실행을 CLI에서 처리. GitHub Actions 등 CI/CD 파이프라인에 연결 가능.',
        },
      ],
    },
    updatedAt: '2026-04-05',
  },
]

export const categories = [...new Set(bookmarks.map((b) => b.category))]
