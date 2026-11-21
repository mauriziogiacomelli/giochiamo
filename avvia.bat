@echo off
rem Avvia il gioco in locale e apre il browser.
rem Per installarlo come app: in Chrome/Edge clicca l'icona "Installa" nella barra degli indirizzi.
cd /d "%~dp0"
start "" http://localhost:8765/
python -m http.server 8765
