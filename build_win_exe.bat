@echo off
TITLE Compilazione EXE - Profis XML Generator
echo ========================================================
echo  Generazione eseguibile autonomo per Windows (.exe)
echo ========================================================
echo.

echo [1/3] Installazione dipendenze Node e build della Web App...
call npm install
call npm run build

echo.
echo [2/3] Installazione PyInstaller (se non presente)...
pip install pyinstaller

echo.
echo [3/3] Compilazione con PyInstaller (Inclusione cartella 'dist')...
pyinstaller --noconsole --onefile --add-data "dist;dist" --name "GeneratoreXML_Profis" main.py

echo.
echo ========================================================
echo  COMPILAZIONE COMPLETATA CON SUCCESSO!
echo  Trovi il file eseguibile nella cartella "dist" (GeneratoreXML_Profis.exe)
echo ========================================================
pause
