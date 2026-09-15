@echo off
setlocal enabledelayedexpansion
title Generazione Eseguibile Windows - Fatture Profis XML

echo ============================================================
echo   Generatore XML Fatture Estere (TD17 / TD18 / TD19)
echo   Script di compilazione per Windows (.exe standalone)
echo ============================================================
echo.

:: 1. Verifica presenza di Node.js nel sistema
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRORE] Node.js non e' installato o non e' presente nel PATH di sistema.
    echo Per favore scarica e installa Node.js da: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Verifica presenza di npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRORE] npm non e' disponibile nel PATH di sistema.
    echo.
    pause
    exit /b 1
)

echo [1/3] Installazione dipendenze di progetto (npm install)...
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERRORE] Errore durante l'installazione delle dipendenze.
    echo.
    pause
    exit /b 1
)
echo      -> Dipendenze installate correttamente.
echo.

echo [2/3] Compilazione applicazione frontend e server (npm run build)...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERRORE] Errore durante la compilazione (npm run build).
    echo.
    pause
    exit /b 1
)
echo      -> Compilazione completata con successo.
echo.

echo [3/3] Generazione file eseguibile Windows (GeneratoreXML.exe)...
call npx @yao-pkg/pkg dist/server.cjs --target node22-win-x64 --fallback-to-source --output dist/GeneratoreXML.exe
if %ERRORLEVEL% neq 0 (
    echo [ATTENZIONE] Tentativo fallback con target generico node20...
    call npx @yao-pkg/pkg dist/server.cjs --target node20-win-x64 --fallback-to-source --output dist/GeneratoreXML.exe
    if %ERRORLEVEL% neq 0 (
        echo [ERRORE] Creazione dell'eseguibile non riuscita.
        pause
        exit /b 1
    )
)

echo [4/4] Applicazione icona applicazione a GeneratoreXML.exe...
call node scripts/set-exe-icon.mjs

echo.
echo ============================================================
echo   COMPILAZIONE COMPLETATA CON SUCCESSO!
echo ============================================================
echo.
echo   Il file eseguibile e' stato creato in:
echo   dist\GeneratoreXML.exe
echo.
echo   Per avviare l'applicazione e' sufficiente fare doppio click
echo   su dist\GeneratoreXML.exe: aprira' automaticamente il browser
echo   alla pagina http://localhost:3000 pronta all'uso!
echo.
echo ============================================================
echo.
pause
