# CLAUDE.md

## Rules

1. 많은 부분을 수정해야 한다면 반드시 나에게 물어보고 진행해.
2. 하나의 파일에 코드를 다 넣지 말고, 기능별로 모듈화 해.
3. 내 요청이 명확하지 않을 때 추론 및 실행하지 말고 우선 내 설명을 제대로 이해했는지 물어봐줘.

### 1. TDS 컴포넌트 필수 사용 (최우선 규칙)

- 이 서비스는 반드시 **TDS(Toss Design System) 컴포넌트**를 사용하여 구현해야 한다.
- TDS 외의 자체 UI 컴포넌트를 만들거나, 외부 UI 라이브러리를 사용해서는 안 된다.
- TDS 문서를 먼저 확인하고, TDS에서 제공하는 컴포넌트로 구현 가능한지 반드시 검토한 후 작업한다.

### 2. Apps-in-Toss MCP, Plugin, Docs 기반 구현

- 모든 구현은 **Apps-in-Toss MCP 도구**, **Apps-in-Toss Plugin**, **Apps-in-Toss Developer Center 문서**를 기반으로 한다.
- 추측이나 일반적인 지식이 아닌, 공식 문서와 가이드에 명시된 내용을 바탕으로만 구현해야 한다.
- 구현 전 반드시 관련 문서를 MCP 도구(`search_docs`, `get_doc`, `search_tds_web_docs`, `get_tds_web_doc` 등)로 조회하여 정확한 가이드를 확인한다.
- 문서에서 확인되지 않는 API나 패턴은 사용하지 않는다.
