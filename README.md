# Personal PR Review Sandbox

GitHub pull request와 자동 코드 리뷰 흐름을 확인하기 위한 작은 JavaScript 저장소입니다.

이번 예제는 주문 처리 도메인을 사용해 리뷰에서 살펴볼 만한 변경점을 한곳에 모았습니다.

- 주문 항목, 할인, 세금 계산과 입력값 검증
- 중복 SKU를 합산하는 원자적 재고 차감
- 주문 상태 전이 규칙과 변경 시각 기록
- 성공, 실패, 불변성, 경계 조건을 다루는 단위 테스트

## 실행

Node.js 20 이상에서 별도의 패키지 설치 없이 실행할 수 있습니다.

```bash
npm test
npm run check
```

테스트는 Node.js 내장 `node:test` 러너를 사용합니다.
