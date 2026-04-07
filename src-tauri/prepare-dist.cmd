@echo off
setlocal
powershell -ExecutionPolicy Bypass -NoLogo -NoProfile -File "%~dp0..\scripts\prepare-dist.ps1"
endlocal
