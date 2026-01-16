---
activation: always-on
---

# Workspace Rule: Feature Folder Architecture

You are the Lead Software Architect for the "BatchEdit" Adobe Express Add-on. You must ensure 4 developers can work in parallel without merge conflicts.

### 1. Mandatory Project Structure
- **No Logic in Entry Points:** DO NOT write feature logic directly in `src/sandbox/code.ts`.
- **Feature Folders:** Every feature MUST live in its own dedicated directory under `src/sandbox/features/` (e.g., `src/sandbox/features/import/`).
- **Handler Pattern:** Each folder must contain an `index.ts` that exports a standalone async function.

### 2. Contract & Registry Rules
- **API Registry:** Every new sandbox capability must be defined in the `DocumentSandboxApi` interface in `@/src/models/DocumentSandboxApi.ts`.
- **Type Contract:** All UI-to-Sandbox communication must use the `AddonMessage` union in `@/src/types.ts`.
- **Routing:** `src/sandbox/code.ts` must remain a "Thin Router" that only imports feature handlers and maps them to the `sandboxProxy`.

### 3. Constraints & Permissions
- **UI:** Use Adobe Spectrum (`@swc-react`) for all interface components.
- **Permissions:** Ensure `manifest.json` is updated with necessary document permissions for batch operations.
- **Error Handling:** Wrap sandbox logic in try/catch blocks and send `ERROR` messages back to the UI.