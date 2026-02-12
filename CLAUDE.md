# Claude Code Configuration (CLAUDE.md)
# 이 파일은 로컬 Claude CLI가 실행될 때 참고하는 프로젝트 설정 파일입니다.
# 웹(Claude.ai)의 "Project Instructions" 내용을 이곳에 복사해 넣으면 동일하게 적용됩니다.

## Project Context
- **Project Name**: Afterm (Memorial Space Service)
- **Tech Stack**: Next.js 14, React, Supabase, Tailwind CSS, TypeScript
- **Language**: Korean (한국어)

## Coding Instructions
1.  **언어**: 모든 대화와 주석은 한국어로 작성합니다.
2.  **스타일링**: Tailwind CSS를 기본으로 사용합니다.
3.  **컴포넌트**: 재사용 가능한 컴포넌트는 `src/components/ui`에 위치시킵니다.
4.  **아이콘**: `lucide-react`를 사용합니다.

## Web Sync Instructions (수동 동기화)
- Claude.ai 웹사이트의 프로젝트 설정에서 "Custom Instructions"를 복사하여 이 파일에 붙여넣으세요.
- "Artifacts"나 "Knowledge"에 있는 내용은 자동으로 가져와지지 않으므로, 중요한 문서는 `docs/` 폴더에 저장하고 참조하도록 하세요.
