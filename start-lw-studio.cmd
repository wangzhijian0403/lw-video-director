@echo off
setlocal
chcp 65001 >nul
set "STUDIO=%~dp0visual-studio"
if not exist "%STUDIO%\package.json" (
 echo [LW] Cannot find visual-studio directory beside this launcher.
 pause
 exit /b 1
)
where node >nul 2>&1
if errorlevel 1 (
 echo [LW] Node.js is missing. Please install Node.js 22 or newer.
 pause
 exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
 echo [LW] npm is missing from PATH.
 pause
 exit /b 1
)
if not exist "%STUDIO%\node_modules" (
 echo [LW] First run: installing pinned dependencies...
 pushd "%STUDIO%"
 call npm ci
 if errorlevel 1 (
  echo [LW] npm ci failed. Read the error above.
  pause
  exit /b 1
 )
 popd
)
echo [LW] Starting Visual Studio from "%STUDIO%"
start "LW Visual Studio Server" /D "%STUDIO%" cmd /k "npm run dev"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$u='http://127.0.0.1:4173';$ready=$false;for($i=0;$i -lt 80;$i++){try{$h=Invoke-RestMethod -TimeoutSec 1 -Uri ($u+'/api/health');if($h.service -eq 'LW Visual Studio' -and $h.ready){$ready=$true;break}}catch{};Start-Sleep -Milliseconds 500};if($ready){Write-Host ('[LW] Ready: '+$u);Start-Process $u;exit 0}else{Write-Host '[LW] Server did not become ready. Check the LW Visual Studio Server terminal.';exit 1}"
if errorlevel 1 (
 echo [LW] Inspect the separate server window for errors.
 pause
 exit /b 1
)
echo [LW] Studio is open. Keep the LW Visual Studio Server window running.
exit /b 0
