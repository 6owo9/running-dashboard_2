# .claude 디렉터리 안내

이 디렉터리는 Claude Code 템플릿 구조를 기반으로 한 공통 에이전트 문서 모음입니다.

## Codex에서의 의미

- Codex는 루트 `AGENTS.md`와 `.codex/` 문서를 우선합니다.
- `.claude/rules/`는 Codex도 참고하는 세부 규칙입니다.
- `.claude/settings.json`은 Claude Code 호환용 설정이며 Codex에 자동 적용되지 않습니다.
- `.claude/hooks/`, `.claude/commands/`, `.claude/output-styles/`도 Claude Code 호환용 보조 자료입니다.

## 편집 원칙

- 공통 규칙은 `.claude/rules/`에 둡니다.
- Codex 전용 축약 규칙은 `.codex/`에 둡니다.
- 로컬 비밀값은 `.claude/settings.local.json`에 둘 수 있지만 이 파일은 커밋하지 않습니다.
