# Crewith 디자인 토큰

## 1. 기준

이 문서는 변경된 `DESIGN.md`와 `docs/UI_ARCHITECTURE.md`를 기반으로 관리자 웹 CSS 토큰과 Flutter Theme 토큰의 기준값을 정의한다.

현재 디자인 기준은 Starbucks에서 영감을 받은 따뜻한 리테일/멤버십 시스템이다. Crewith에는 이를 스포츠 동호회 운영 서비스에 맞게 해석해 적용한다.

- 차가운 흰색 앱보다 따뜻한 cream canvas를 기본으로 한다.
- Green Accent는 주요 CTA와 활성 상태에 사용한다.
- House Green은 운영 요약, 프리미엄/구독, 강조 패널에 사용한다.
- Gold는 무료 체험/구독/등급 같은 멤버십 성격의 순간에만 제한 사용한다.
- 모든 주요 버튼은 50px full-pill 형태를 유지한다.
- 카드와 패널은 12px radius와 낮은 알파의 layered shadow를 사용한다.

## 2. 색상 토큰

| Token | Hex / Value | 용도 |
|---|---|---|
| `color.canvas` | `#f2f0eb` | 기본 페이지 배경, 앱 배경 |
| `color.ceramic` | `#edebe9` | 구역 분리, 보조 배경 |
| `color.white` | `#ffffff` | 카드, 모달, 입력 표면 |
| `color.neutralCool` | `#f9f9f9` | 드롭다운, 조용한 유틸리티 표면 |
| `color.textBlack` | `rgba(0,0,0,0.87)` | 기본 제목/본문 |
| `color.textBlackSoft` | `rgba(0,0,0,0.58)` | 보조 텍스트, 메타 |
| `color.starbucksGreen` | `#006241` | 브랜드 heading, 핵심 브랜드 신호 |
| `color.greenAccent` | `#00754A` | 주요 CTA, 활성 상태, floating action |
| `color.houseGreen` | `#1E3932` | 깊은 강조 패널, footer/feature band |
| `color.greenUplift` | `#2b5148` | 보조 dark green, 장식 강조 |
| `color.greenLight` | `#d4e9e2` | 성공/valid tint, light green surface |
| `color.gold` | `#cba258` | 무료 체험, 구독, 멤버십 상태 강조 |
| `color.goldLight` | `#dfc49d` | 구독/등급 보조 배경 |
| `color.goldLightest` | `#faf6ee` | 구독 안내, partnership 성격 패널 |
| `color.red` | `#c82014` | 오류, 위험, destructive |
| `color.yellow` | `#fbbc05` | 경고 |
| `color.hairline` | `rgba(0,0,0,0.12)` | 구분선 |
| `color.shadow` | `rgba(0,0,0,0.14)` | 카드 그림자 |

## 3. 상태 색상

| 상태 | Text | Background | Border |
|---|---|---|---|
| 납부 완료 | `#006241` | `#d4e9e2` | `#9bcdbd` |
| 미납 | `#c82014` | `hsl(4 82% 43% / 5%)` | `rgba(200,32,20,0.24)` |
| 면제 | `rgba(0,0,0,0.58)` | `#edebe9` | `rgba(0,0,0,0.12)` |
| 참석 | `#006241` | `#d4e9e2` | `#9bcdbd` |
| 지각 | `#7a4f00` | `#faf6ee` | `#dfc49d` |
| 결석 | `#c82014` | `hsl(4 82% 43% / 5%)` | `rgba(200,32,20,0.24)` |
| 운영진 전용 | `#ffffff` | `#1E3932` | `#2b5148` |
| 무료 체험/구독 | `#33433d` | `#faf6ee` | `#dfc49d` |

## 4. 타이포그래피

### Web

SoDoSans는 proprietary font이므로 실제 구현에서는 Inter를 기본 substitute로 사용한다. 전체 tracking은 `-0.01em`을 기본값으로 둔다.

| Token | Size | Weight | Line Height | Letter Spacing | 용도 |
|---|---:|---:|---:|---:|---|
| `text.display` | 45px | 600 | 1.2 | -0.16px | 랜딩/큰 빈 상태 |
| `text.pageTitle` | 24px | 600 | 36px | -0.16px | 관리자 페이지 제목 |
| `text.sectionTitle` | 24px | 400 | 36px | -0.16px | 섹션 제목 |
| `text.cardTitle` | 19px | 600 | 1.5 | -0.01em | 카드/패널 제목 |
| `text.body` | 16px | 400 | 1.5 | -0.01em | 기본 본문 |
| `text.meta` | 14px | 400 | 1.5 | -0.01em | 보조 정보 |
| `text.button` | 14px | 600 | 1.2 | -0.01em | 버튼 |
| `text.micro` | 13px | 400 | 1.5 | -0.01em | 작은 라벨 |

### Flutter

| Token | Size | Weight | 용도 |
|---|---:|---:|---|
| `displayLarge` | 32 | 600 | 앱 큰 제목 |
| `headlineMedium` | 24 | 600 | 화면 제목 |
| `titleLarge` | 19 | 600 | 카드 제목 |
| `bodyLarge` | 16 | 400 | 본문 |
| `bodyMedium` | 14 | 400 | 보조 본문 |
| `labelLarge` | 14 | 600 | 버튼 |
| `labelSmall` | 13 | 400 | 메타 |

## 5. 간격

DESIGN.md의 rem scale을 px 기준으로 해석한다.

| Token | Value |
|---|---:|
| `space.1` | 4px |
| `space.2` | 8px |
| `space.3` | 16px |
| `space.4` | 24px |
| `space.5` | 32px |
| `space.6` | 40px |
| `space.7` | 48px |
| `space.8` | 56px |
| `space.9` | 64px |

## 6. Radius

| Token | Value | 용도 |
|---|---:|---|
| `radius.card` | 12px | 카드, 모달, 메뉴 타일 |
| `radius.input` | 4px | 입력창 |
| `radius.pill` | 50px | 모든 버튼 |
| `radius.circle` | 50% | 아바타, floating action |

## 7. Shadow

| Token | Value | 용도 |
|---|---|---|
| `shadow.card` | `0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)` | 기본 카드 |
| `shadow.nav` | `0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)` | 상단/사이드 내비게이션 |
| `shadow.floating` | `0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0.14)` | floating action |

## 8. CSS 변수 초안

```css
:root {
  --color-canvas: #f2f0eb;
  --color-ceramic: #edebe9;
  --color-white: #ffffff;
  --color-neutral-cool: #f9f9f9;
  --color-text-black: rgba(0, 0, 0, 0.87);
  --color-text-black-soft: rgba(0, 0, 0, 0.58);
  --color-starbucks-green: #006241;
  --color-green-accent: #00754a;
  --color-house-green: #1e3932;
  --color-green-uplift: #2b5148;
  --color-green-light: #d4e9e2;
  --color-gold: #cba258;
  --color-gold-light: #dfc49d;
  --color-gold-lightest: #faf6ee;
  --color-red: #c82014;
  --color-yellow: #fbbc05;
  --color-hairline: rgba(0, 0, 0, 0.12);

  --font-primary: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
  --letter-spacing-tight: -0.01em;

  --radius-card: 12px;
  --radius-input: 4px;
  --radius-pill: 50px;
  --radius-circle: 50%;

  --shadow-card: 0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24);
  --shadow-nav: 0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07);
  --shadow-floating: 0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0.14);
}
```

## 9. Flutter Theme 초안

```dart
final crewithColorScheme = ColorScheme.light(
  surface: Color(0xFFF2F0EB),
  primary: Color(0xFF00754A),
  onPrimary: Color(0xFFFFFFFF),
  secondary: Color(0xFF006241),
  tertiary: Color(0xFFCBA258),
  error: Color(0xFFC82014),
  onSurface: Color(0xDD000000),
);

final crewithTheme = ThemeData(
  useMaterial3: true,
  colorScheme: crewithColorScheme,
  scaffoldBackgroundColor: Color(0xFFF2F0EB),
  fontFamily: 'Inter',
);
```

## 10. 컴포넌트 기본값

| 컴포넌트 | 기본값 |
|---|---|
| Primary Button | Green Accent 배경, white 텍스트, 50px pill, active scale 0.95 |
| Secondary Button | 투명 배경, Green Accent border/text, 50px pill |
| Dark Panel Button | white 배경, Green Accent 텍스트 |
| Input | white 배경, 1px hairline border, 4px radius |
| Table Row | white 배경, hairline bottom border |
| Metric Tile | white card, 12px radius, layered soft shadow |
| Status Chip | pill, 13~14px label |
| Floating Action | 56px circle, Green Accent, layered floating shadow |
