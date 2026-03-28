@echo off
cd /d "C:\Users\ASUS\.openclaw\workspace\CRM-Master"

echo [1/4] Adding changes...
git add -A

echo [2/4] Committing with timestamp...
git commit -m "Update: %date% %time%"

echo [3/4] Pushing to GitHub...
git push origin main

echo [4/4] Done!
pause
