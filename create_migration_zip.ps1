# RemoteHive Migration Package Creator
# This script creates a clean zip file for migration, excluding unnecessary files

Write-Host "Creating RemoteHive Migration Package..." -ForegroundColor Green

# Define the source directory
$sourceDir = "d:\Remotehive"
$zipPath = "d:\RemoteHive_Migration_Package.zip"

# Remove existing zip if it exists
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
    Write-Host "Removed existing zip file" -ForegroundColor Yellow
}

# Create temporary directory for clean copy
$tempDir = "d:\temp_remotehive_migration"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "Copying essential files..." -ForegroundColor Cyan

# Copy files and directories, excluding unnecessary ones
$excludePatterns = @(
    "node_modules",
    ".history",
    "__pycache__",
    ".pytest_cache",
    "*.log",
    "celerybeat-schedule",
    "debug_*.txt",
    "server_*.txt",
    "*.pyc",
    ".vercel",
    "dist",
    "logs\*.log"
)

# Function to check if path should be excluded
function Should-Exclude($path) {
    foreach ($pattern in $excludePatterns) {
        if ($path -like "*$pattern*") {
            return $true
        }
    }
    return $false
}

# Copy directory structure recursively, excluding unwanted files
function Copy-SelectivelyRecursive($source, $destination) {
    if (!(Test-Path $destination)) {
        New-Item -ItemType Directory -Path $destination -Force | Out-Null
    }
    
    Get-ChildItem $source | ForEach-Object {
        $relativePath = $_.Name
        $sourcePath = $_.FullName
        $destPath = Join-Path $destination $relativePath
        
        if (!(Should-Exclude $sourcePath)) {
            if ($_.PSIsContainer) {
                # It's a directory
                Copy-SelectivelyRecursive $sourcePath $destPath
            } else {
                # It's a file
                Copy-Item $sourcePath $destPath -Force
            }
        } else {
            Write-Host "Excluding: $relativePath" -ForegroundColor DarkGray
        }
    }
}

# Start copying
Copy-SelectivelyRecursive $sourceDir $tempDir

Write-Host "Creating zip archive..." -ForegroundColor Cyan

# Create the zip file
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -CompressionLevel Optimal -Force

# Clean up temporary directory
Remove-Item $tempDir -Recurse -Force

# Get zip file size
$zipSize = (Get-Item $zipPath).Length
$zipSizeMB = [math]::Round($zipSize / 1MB, 2)

Write-Host "" -ForegroundColor Green
Write-Host "SUCCESS: Migration package created successfully!" -ForegroundColor Green
Write-Host "File: $zipPath" -ForegroundColor White
Write-Host "Size: $zipSizeMB MB" -ForegroundColor White
Write-Host "" -ForegroundColor Green
Write-Host "Package Contents:" -ForegroundColor Yellow
Write-Host "   - Complete project source code" -ForegroundColor White
Write-Host "   - Database files and migration backups" -ForegroundColor White
Write-Host "   - Configuration files and environment templates" -ForegroundColor White
Write-Host "   - Migration guides and documentation" -ForegroundColor White
Write-Host "   - macOS setup scripts" -ForegroundColor White
Write-Host "" -ForegroundColor Green
Write-Host "Ready to transfer to your MacBook!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green

# Show what was excluded
Write-Host "Excluded from package:" -ForegroundColor DarkYellow
Write-Host "   - node_modules directories (will be reinstalled)" -ForegroundColor DarkGray
Write-Host "   - Python cache files (__pycache__, .pytest_cache)" -ForegroundColor DarkGray
Write-Host "   - Build artifacts and temporary files" -ForegroundColor DarkGray
Write-Host "   - Log files and debug outputs" -ForegroundColor DarkGray
Write-Host "   - Version control history (.history)" -ForegroundColor DarkGray
Write-Host "" -ForegroundColor Green