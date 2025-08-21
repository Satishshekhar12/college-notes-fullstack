@echo off
echo.
echo ================================================
echo PowerPoint/Word to PDF Conversion Setup (Windows)
echo ================================================
echo.

echo This script will help you install LibreOffice for document conversion.
echo.

echo 1. Checking if LibreOffice is already installed...
libreoffice --version 2>nul
if %errorlevel% equ 0 (
    echo ✅ LibreOffice is already installed!
    echo.
    echo Testing conversion service...
    node test-conversion.js
    goto end
)

echo ❌ LibreOffice is not installed or not in PATH
echo.

echo 2. Would you like to download LibreOffice? (Y/N)
set /p choice="Enter your choice: "

if /i "%choice%"=="Y" (
    echo.
    echo 📥 Opening LibreOffice download page...
    start https://www.libreoffice.org/download/download/
    echo.
    echo 📋 Installation Instructions:
    echo 1. Download LibreOffice from the opened page
    echo 2. Run the installer as Administrator
    echo 3. Accept all default settings
    echo 4. Restart this command prompt
    echo 5. Run this script again to test
    echo.
) else (
    echo.
    echo 📋 Manual Installation Steps:
    echo 1. Go to: https://www.libreoffice.org/download/download/
    echo 2. Download LibreOffice for Windows
    echo 3. Run the installer as Administrator
    echo 4. Accept all default settings
    echo 5. Restart this command prompt
    echo 6. Run: install-libreoffice.bat
    echo.
)

echo 💡 Note: Your server will work without LibreOffice,
echo    but PowerPoint/Word files won't be converted to PDF.
echo    They will be uploaded in their original format.

:end
echo.
echo ================================================
echo Setup Complete
echo ================================================
pause
