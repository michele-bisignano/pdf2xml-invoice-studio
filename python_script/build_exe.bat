@echo off
TITLE Compilatore .EXE - Generatore XML Profis
echo ==========================================
echo  Generazione eseguibile .exe con PyInstaller
echo ==========================================
echo.
python -m pip install --upgrade pip
pip install -r requirements.txt
echo.
echo Compilazione in corso...
pyinstaller --noconsole --onefile --icon="icon.ico" --name "GeneratoreXML_Profis" generatore_xml.py
echo.
echo ==========================================
echo  COMPILAZIONE COMPLETATA!
echo  Trovi l'eseguibile nella cartella "dist".
echo ==========================================
pause
