# Start Backend Server
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd backend; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload`""

# Start Frontend Server
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`""

Write-Host "Both servers have been started in new windows!"
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend API: http://localhost:8000"
