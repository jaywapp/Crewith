# Crewith 디자인 토큰

## 1. 기준

이 문서는 `DESIGN.md`와 `docs/UI_ARCHITECTURE.md`를 기반으로 관리자 웹 CSS 토큰과 Flutter Theme 토큰의 기준값을 정의한다.

Crewith는 스포츠 동호회 서비스지만, 운영진이 반복적으로 사용하는 관리 도구이므로 차분하고 명확한 운영 UI를 우선한다.

## 2. 색상 토큰

| Token | Hex | 용도 |
|---|---|---|
| `color.canvas` | `#ffffff` | 기본 배경 |
| `color.ink` | `#212121` | 기본 텍스트 |
| `color.nearBlack` | `#17171c` | CTA, 강한 제목, 상단 강조 |
| `color.muted` | `#93939f` | 보조 텍스트 |
| `color.slate` | `#75758a` | 테이블 메타, 흐린 라벨 |
| `color.hairline` | `#d9d9dd` | 리스트/테이블 구분선 |
| `color.borderLight` | `#e5e7eb` | 입력창, 카드 경계 |
| `color.softStone` | `#eeece7` | 요약 카드, 빈 상태 |
| `color.deepGreen` | `#003c33` | 운영 상태 패널 |
| `color.actionBlue` | `#1863dc` | 링크, 정보 액션 |
| `color.coral` | `#ff7759` | 주의 상태, 필터 칩 |
| `color.softCoral` | `#ffad9b` | 약한 주의 배경/경계 |
| `color.error` | `#b30000` | 오류, 위험 |
| `color.success` | `#0f7a4f` | 납부 완료, 참석 |
| `color.warning` | `#a15c00` | 마감 임박, 지각 |
| `color.info` | `#1863dc` | 정보 상태 |

## 3. 상태 색상

| 상태 | Text | Background | Border |
|---|---|---|---|
| 납부 완료 | `#0f7a4f` | `#edf8f2` | `#b7e2cc` |
| 미납 | `#b30000` | `#fff1ef` | `#ffad9b` |
| 면제 | `#75758a` | `#f5f5f5` | `#d9d9dd` |
| 참석 | `#0f7a4f` | `#edf8f2` | `#b7e2cc` |
| 지각 | `#a15c00` | `#fff7e8` | `#f1c987` |
| 결석 | `#b30000` | `#fff1ef` | `#ffad9b` |
| 운영진 전용 | `#003c33` | `#edfce9` | `#b8dfcc` |

## 4. 타이포그래피

### Web

| Token | Size | Weight | Line Height | 용도 |
|---|---:|---:|---:|---|
| `text.display` | 48px | 400 | 1.1 | 랜딩/큰 빈 상태 |
| `text.pageTitle` | 32px | 500 | 1.2 | 관리자 페이지 제목 |
| `text.sectionTitle` | 24px | 500 | 1.3 | 섹션 제목 |
| `text.cardTitle` | 18px | 500 | 1.4 | 카드/패널 제목 |
| `text.body` | 16px | 400 | 1.5 | 기본 본문 |
| `text.meta` | 14px | 400 | 1.4 | 보조 정보 |
| `text.button` | 14px | 500 | 1.2 | 버튼 |
| `text.micro` | 12px | 400 | 1.4 | 작은 라벨 |
| `text.monoLabel` | 12px | 500 | 1.4 | 상태/시스템 라벨 |

### Flutter

| Token | Size | Weight | 용도 |
|---|---:|---:|---|
| `displayLarge` | 32 | 500 | 앱 큰 제목 |
| `titleLarge` | 24 | 500 | 화면 제목 |
| `titleMedium` | 18 | 500 | 카드 제목 |
| `bodyLarge` | 16 | 400 | 본문 |
| `bodyMedium` | 14 | 400 | 보조 본문 |
| `labelLarge` | 14 | 500 | 버튼 |
| `labelSmall` | 12 | 400 | 메타 |

## 5. 간격

| Token | Value |
|---|---:|
| `space.1` | 4px |
| `space.2` | 8px |
| `space.3` | 12px |
| `space.4` | 16px |
| `space.5` | 20px |
| `space.6` | 24px |
| `space.8` | 32px |
| `space.10` | 40px |
| `space.14` | 56px |
| `space.16` | 64px |
| `space.20` | 80px |

## 6. Radius

| Token | Value | 용도 |
|---|---:|---|
| `radius.xs` | 4px | 작은 입력/썸네일 |
| `radius.sm` | 8px | 카드, 칩 |
| `radius.md` | 16px | 폼 패널, 지도 카드 |
| `radius.lg` | 22px | 빈 상태, 큰 미디어 |
| `radius.pill` | 9999px | CTA, 칩 |

## 7. CSS 변수 초안

```css
:root {
  --color-canvas: #ffffff;
  --color-ink: #212121;
  --color-near-black: #17171c;
  --color-muted: #93939f;
  --color-slate: #75758a;
  --color-hairline: #d9d9dd;
  --color-border-light: #e5e7eb;
  --color-soft-stone: #eeece7;
  --color-deep-green: #003c33;
  --color-action-blue: #1863dc;
  --color-coral: #ff7759;
  --color-soft-coral: #ffad9b;
  --color-error: #b30000;
  --color-success: #0f7a4f;
  --color-warning: #a15c00;

  --font-display: "Space Grotesk", Inter, system-ui, sans-serif;
  --font-body: Inter, Arial, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Consolas, monospace;

  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 22px;
  --radius-pill: 9999px;
}
```

## 8. Flutter Theme 초안

```dart
final crewithColorScheme = ColorScheme.light(
  surface: Color(0xFFFFFFFF),
  primary: Color(0xFF17171C),
  onPrimary: Color(0xFFFFFFFF),
  secondary: Color(0xFF1863DC),
  error: Color(0xFFB30000),
  onSurface: Color(0xFF212121),
);

final crewithTheme = ThemeData(
  useMaterial3: true,
  colorScheme: crewithColorScheme,
  scaffoldBackgroundColor: Color(0xFFFFFFFF),
  fontFamily: 'Inter',
);
```

## 9. 컴포넌트 기본값

| 컴포넌트 | 기본값 |
|---|---|
| Primary Button | near-black 배경, white 텍스트, pill radius |
| Secondary Button | 투명 배경, 밑줄 또는 outline |
| Input | 1px border, 8px radius, focus blue/violet |
| Table Row | 흰 배경, hairline bottom border |
| Metric Tile | white/soft stone, 1px border, 16px radius |
| Bottom Sheet | 모바일 생성/수정 작업 |
| Status Chip | pill, 12~14px label |
