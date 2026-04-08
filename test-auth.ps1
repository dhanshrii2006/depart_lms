# 🧪 Acadify Authentication Testing Script
# Run: .\test-auth.ps1

$BaseUrl = "http://localhost:8080"
$TestResults = @()

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n" -NoNewline
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Yellow -BackgroundColor Blue
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
}

function Test-Endpoint {
    param(
        [string]$TestName,
        [string]$Endpoint,
        [hashtable]$Payload,
        [string]$ExpectedResult
    )
    
    Write-Host "`n🧪 $TestName" -ForegroundColor Green
    Write-Host "   Endpoint: POST $Endpoint" -ForegroundColor Gray
    Write-Host "   Payload: $($Payload | ConvertTo-Json -Compress)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl$Endpoint" `
            -Method POST `
            -ContentType "application/json" `
            -Body ($Payload | ConvertTo-Json) `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $statusCode = $response.StatusCode
        $body = $response.Content | ConvertFrom-Json
        
        Write-Host "   ✅ Status: $statusCode" -ForegroundColor Green
        Write-Host "   Response: $($body | ConvertTo-Json -Compress)" -ForegroundColor Green
        
        $result = "PASS"
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.Value
        $body = $_.Exception.Response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        
        if ($body) {
            Write-Host "   ❌ Status: $statusCode" -ForegroundColor Red
            Write-Host "   Response: $($body | ConvertTo-Json -Compress)" -ForegroundColor Red
        } else {
            Write-Host "   ❌ Status: $statusCode" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        $result = "FAIL"
    }
    
    Write-Host "   Expected: $ExpectedResult" -ForegroundColor Cyan
    $TestResults += @{
        Test = $TestName
        Result = $result
        Expected = $ExpectedResult
    }
}

# ═══════════════════════════════════════════════════════════════
# TEST SUITE
# ═══════════════════════════════════════════════════════════════

Write-TestHeader "STUDENT REGISTRATION TESTS"

Test-Endpoint `
    -TestName "TEST 1: Student Signup with NON-College Email (Should REJECT)" `
    -Endpoint "/api/auth/register" `
    -Payload @{
        name = "Hacker User"
        email = "hacker@gmail.com"
        password = "BadPassword123"
    } `
    -ExpectedResult "403 - Only college email allowed"

Test-Endpoint `
    -TestName "TEST 2: Student Signup with VALID College Email (Should SUCCEED)" `
    -Endpoint "/api/auth/register" `
    -Payload @{
        name = "Good Student"
        email = "goodstudent$(Get-Random)@stvincentngp.edu.in"
        password = "GoodPassword123"
        roll_number = "STU$(Get-Random -Maximum 999)"
    } `
    -ExpectedResult "201 - Registration successful"

# ═══════════════════════════════════════════════════════════════

Write-TestHeader "MAGIC LOGIN TESTS"

Test-Endpoint `
    -TestName "TEST 3: Magic Login Request with NON-College Email (Should REJECT)" `
    -Endpoint "/api/auth/magic-login/request" `
    -Payload @{
        email = "outsider@yahoo.com"
    } `
    -ExpectedResult "403 - Only college email allowed"

# ═══════════════════════════════════════════════════════════════

Write-TestHeader "EMAIL VERIFICATION TESTS"

Test-Endpoint `
    -TestName "TEST 4: Resend Verification with NON-College Email (Should REJECT)" `
    -Endpoint "/api/auth/resend-verification" `
    -Payload @{
        email = "nonstudent@hotmail.com"
    } `
    -ExpectedResult "403 - Only college email allowed"

# ═══════════════════════════════════════════════════════════════

Write-TestHeader "PASSWORD RESET TESTS"

Test-Endpoint `
    -TestName "TEST 5: Forgot Password with Non-College Email (Should Return Generic Message)" `
    -Endpoint "/api/auth/forgot-password" `
    -Payload @{
        email = "unknown@outlook.com"
    } `
    -ExpectedResult "200 - Generic security response"

# ═══════════════════════════════════════════════════════════════

Write-TestHeader "TEACHER LOGIN TESTS (NO DOMAIN RESTRICTION)"

Test-Endpoint `
    -TestName "TEST 6: Teacher Login with NON-College Email (Should SUCCEED - Teachers Not Restricted)" `
    -Endpoint "/api/auth/teacher-login" `
    -Payload @{
        name = "John Teacher"
        email = "teacher$(Get-Random)@gmail.com"
        password = "TeacherPass123"
    } `
    -ExpectedResult "201 - Teacher created (any domain allowed)"

# ═══════════════════════════════════════════════════════════════

Write-TestHeader "HEALTH CHECK"

Write-Host "`n🧪 TEST 7: Health Check (Should Always Work)" -ForegroundColor Green
Write-Host "   Endpoint: GET /api/health" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -UseBasicParsing -ErrorAction Stop
    $body = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($body | ConvertTo-Json -Compress)" -ForegroundColor Green
    $TestResults += @{
        Test = "Health Check"
        Result = "PASS"
        Expected = "200 - OK"
    }
}
catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    $TestResults += @{
        Test = "Health Check"
        Result = "FAIL"
        Expected = "200 - OK"
    }
}

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════

Write-TestHeader "TEST SUMMARY"

$passed = ($TestResults | Where-Object { $_.Result -eq "PASS" }).Count
$failed = ($TestResults | Where-Object { $_.Result -eq "FAIL" }).Count
$total = $TestResults.Count

Write-Host "`n📊 Results:" -ForegroundColor Yellow
Write-Host "   ✅ Passed: $passed" -ForegroundColor Green
Write-Host "   ❌ Failed: $failed" -ForegroundColor Red
Write-Host "   📈 Total:  $total" -ForegroundColor Cyan

Write-Host "`n📋 Detailed Results:" -ForegroundColor Yellow
$TestResults | ForEach-Object {
    $emoji = if ($_.Result -eq "PASS") { "✅" } else { "❌" }
    Write-Host "   $emoji $($_.Test)" -ForegroundColor $(if ($_.Result -eq "PASS") { "Green" } else { "Red" })
    Write-Host "      Expected: $($_.Expected)" -ForegroundColor Gray
}

Write-Host "`n" -NoNewline
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "  🎉 ALL TESTS PASSED!" -ForegroundColor Green -BackgroundColor Black
} else {
    Write-Host "  ⚠️  SOME TESTS FAILED" -ForegroundColor Red
}

Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
