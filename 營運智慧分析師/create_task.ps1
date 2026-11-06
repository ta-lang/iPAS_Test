# Get the absolute paths based on the script directory
$scriptPath = Join-Path $PSScriptRoot "sync.py"
$pythonwPath = Join-Path $PSScriptRoot ".venv\Scripts\pythonw.exe"
$workingDir = $PSScriptRoot

if (-not (Test-Path $scriptPath)) {
    Write-Error "sync.py not found at $scriptPath"
    exit 1
}

if (-not (Test-Path $pythonwPath)) {
    Write-Error "pythonw.exe not found at $pythonwPath"
    exit 1
}

# Create Action
$Action = New-ScheduledTaskAction -Execute $pythonwPath -Argument "`"$scriptPath`"" -WorkingDirectory $workingDir

# Create Trigger (Start 1 minute from now, repeat every 30 minutes indefinitely)
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 30) -RepetitionDuration (New-TimeSpan -Days 9999)

# Create Settings (Allow start on battery, run when network is available)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

$TaskName = "IPAS_GDrive_Sync"

Write-Host "Registering Scheduled Task '$TaskName'..."
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Syncs co-learning materials from Google Drive to local directory" -Force

Write-Host "------------------------------------------------"
Write-Host "Scheduled Task registered successfully!"
Write-Host "Task Name:        $TaskName"
Write-Host "Python Executable: $pythonwPath"
Write-Host "Python Script:     $scriptPath"
Write-Host "Run Frequency:     Every 30 minutes"
Write-Host "------------------------------------------------"
