@echo off
TITLE Compilazione EXE - Profis XML Generator
echo ========================================================
echo  Generazione eseguibile autonomo per Windows (.exe)
echo ========================================================
echo.

echo [1/3] Installazione dipendenze e build della Web App...
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo [ERRORE] La build del frontend e' fallita!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Verifica / Installazione PyInstaller...
pip install --upgrade pyinstaller

echo.
echo [3/3] Compilazione con PyInstaller (Inclusione cartella 'dist')...
if exist public\favicon.ico (
    pyinstaller --noconsole --onefile --icon="public\favicon.ico" --add-data "dist;dist" --name "GeneratoreXML_Profis" main.py
) else (
    pyinstaller --noconsole --onefile --add-data "dist;dist" --name "GeneratoreXML_Profis" main.py
)

echo.
echo ========================================================
echo  COMPILAZIONE COMPLETATA CON SUCCESSO!
echo  Trovi l'eseguibile autonomo in: dist\GeneratoreXML_Profis.exe
echo ========================================================
pause

