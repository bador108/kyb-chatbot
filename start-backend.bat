@echo off
cd /d C:\Users\vacla\ctf-chatbot\backend
set GEMINI_API_KEY=AIzaSyDC2Leg9egm-xsNho0BLNpmsTWleXCifZs
set GOOGLE_CLIENT_ID=341626539218-9imn8407duo6iui5ubg8gjhoqbiuj5ut.apps.googleusercontent.com
C:\Users\vacla\AppData\Local\Programs\Python\Python312\Scripts\uvicorn.exe main:app --port 8001
pause
