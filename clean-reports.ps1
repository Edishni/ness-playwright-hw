#!/usr/bin/env pwsh
# Clean test reports but preserve directory structure

Write-Host " Cleaning test report contents (preserving folders)..." -ForegroundColor Cyan

# Clean test-results contents
if (Test-Path "test-results") {
    Get-ChildItem "test-results" -Recurse | Remove-Item -Force -Recurse
    Write-Host "  ✅ test-results/* cleaned" -ForegroundColor Green
}

# Clean allure-results contents  
if (Test-Path "allure-results") {
    Get-ChildItem "allure-results" -Recurse | Remove-Item -Force -Recurse
    Write-Host "  ✅ allure-results/* cleaned" -ForegroundColor Green
}

# Clean playwright-report contents
if (Test-Path "playwright-report") {
    Get-ChildItem "playwright-report" -Recurse | Remove-Item -Force -Recurse
    Write-Host "  ✅ playwright-report/* cleaned" -ForegroundColor Green
}

# Clean allure-report if it exists
if (Test-Path "allure-report") {
    Get-ChildItem "allure-report" -Recurse | Remove-Item -Force -Recurse
    Write-Host "  ✅ allure-report/* cleaned" -ForegroundColor Green
}

# Recreate necessary subdirectories
New-Item -ItemType Directory -Force -Path "test-results\screenshots" | Out-Null
New-Item -ItemType Directory -Force -Path "test-results\videos" | Out-Null

Write-Host " 🎯 Report cleanup complete - directories preserved!" -ForegroundColor Yellow
Write-Host ""
Write-Host " Directory Structure:" -ForegroundColor Cyan
Write-Host "  test-results/" -ForegroundColor White
Write-Host "    screenshots/ (ready)" -ForegroundColor Green  
Write-Host "    videos/ (ready)" -ForegroundColor Green
Write-Host "  allure-results/ (ready)" -ForegroundColor Green
Write-Host "  playwright-report/ (ready)" -ForegroundColor Green