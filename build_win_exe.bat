@echo off
setlocal enabledelayedexpansion

:: Determina automaticamente il nome della cartella del progetto (nome della repo GitHub)
for %%I in ("%~dp0.") do set "REPO_NAME=%%~nxI"
if "%REPO_NAME%"=="" set "REPO_NAME=SelfInvoice_XML_Studio"

TITLE Compilazione EXE - %REPO_NAME%
echo ========================================================
echo  Generazione eseguibile autonomo Windows (.exe)
echo  Nome applicazione (Repository): %REPO_NAME%
echo ========================================================
echo.

echo [1/3] Installazione dipendenze e build ottimizzata del frontend...
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRORE] La build del frontend e' fallita!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Verifica / Installazione PyInstaller...
pip install --upgrade pyinstaller

echo.
echo [3/3] Compilazione con PyInstaller (incorporamento cartella 'dist')...
if exist "public\favicon.ico" (
    pyinstaller --noconsole --onefile --clean --icon="public\favicon.ico" --add-data "dist;dist" --name "%REPO_NAME%" main.py
) else (
    pyinstaller --noconsole --onefile --clean --add-data "dist;dist" --name "%REPO_NAME%" main.py
)

if %errorlevel% neq 0 (
    echo.
    echo [ERRORE] La creazione dell'eseguibile e' fallita!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo  COMPILAZIONE COMPLETATA CON SUCCESSO!
echo  Eseguibile generato: dist\%REPO_NAME%.exe
echo ========================================================
echo.
pause
