# Operational Plan: Profis Foreign Invoice XML Generator (TD17)

This operational plan outlines the testable milestones for the offline XML generator tool.

---

## Step 1: Data Model and Type Definitions
- **Objective**: Define English TypeScript interfaces for supplier, customer, and invoice state.
- **Verification**: Zero sensitive data, strictly anonymous defaults, TD17 standard schema compliance.

## Step 2: Python Desktop GUI & Test Suite
- **Objective**: Maintain `generatore_xml.py` (Tkinter GUI, 450x520px, 10 fields, `#16a34a` generate button) and `test_generator.py`.
- **Verification**: Pass `python3 python_script/test_generator.py` with 100% assertions green.

## Step 3: Local Server & Automated Launcher
- **Objective**: Clean `server.ts` (offline Express + Vite integration) and `start_local.py` launcher with automatic browser opening and process cleanup.
- **Verification**: Server responds on port 3000; graceful termination on SIGINT/Ctrl+C.

## Step 4: Faithful Web Application UI
- **Objective**: Single-window 450-460px container in `src/App.tsx`, matching Tkinter form layout with IT/EN toggle and Dark Mode.
- **Verification**: Successful build via `npm run build` with zero type errors.
