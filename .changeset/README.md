# Changesets

`packages/core`와 `packages/cli`의 공개 동작을 바꾸는 PR에는 Changeset을 추가한다.

```bash
pnpm changeset
```

첫 공개 릴리스 기준선은 다음과 같다.

- `@lyrd/core`: `0.1.0`
- `@lyrd/cli`: `0.1.0`

두 패키지는 독립 버전으로 관리한다. CLI 템플릿이 요구하는 코어 API가 바뀌면 두 패키지의 Changeset을 함께 추가한다.

실제 npm 배포는 GitHub Actions의 `npm 배포` 수동 워크플로에서만 수행한다. npm Trusted Publishing 설정과 패키지 접근 권한을 먼저 확인한 뒤 실행한다.
