
# Test Acadify Authentication
$BaseUrl = "http://localhost:8080"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ACADIFY AUTHENTICATION TEST SUITE" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$results = @()

# Test 1: Non-college email (should fail)
Write-Host "[TEST 1] Register with NON-college email (@gmail.com)" -ForegroundColor Green
$payload = @{
    name = "Test User"
    email = "testuser@gmail.com"
    password = "TestPass123"
} | ConvertTo-Json

try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/auth/register" -Method POST -ContentType "application/json" -Body $payload -UseBasicParsing -ErrorAction Stop
    Write-Host "  UNEXPECTED PASS (Status: $($resp.StatusCode))" -ForegroundColor Red
    $results += "FAIL"
}
catch {
    $msg = $_.Exception.Message
    if ($msg -like "*Only college email*") {
        Write-Host "  PASS - Correctly rejected non-college email" -ForegroundColor Green
        $results += "PASS"
    } else {
        Write-Host "  FAIL - Error: $msg" -ForegroundColor Red
        $results += "FAIL"
    }
}

# Test 2: College email (should succeed)
Write-Host "`n[TEST 2] Register with COLLEGE email (@stvincentngp.edu.in)" -ForegroundColor Green
$randomId = Get-Random -Minimum 1000 -Maximum 9999
$payload = @{
    name = "College Student"
    email = "student$randomId@stvincentngp.edu.in"
    password = "TestPass123"
} | ConvertTo-Json

try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/auth/register" -Method POST -ContentType "application/json" -Body $payload -UseBasicParsing -ErrorAction Stop
    Write-Host "  PASS - College email accepted (Status: $($resp.StatusCode))" -ForegroundColor Green
    $results += "PASS"
}
catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "  PASS - Email already exists (domain validation passed)" -ForegroundColor Green
        $results += "PASS"
    } else {
        Write-Host "  FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        $results += "FAIL"
    }
}

# Test 3: Magic login with non-college (should fail)
Write-Host "`n[TEST 3] Magic login request with non-college email (@hotmail.com)" -ForegroundColor Green
$payload = @{
    email = "user@hotmail.com"
} | ConvertTo-Json

try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/auth/magic-login/request" -Method POST -ContentType "application/json" -Body $payload -UseBasicParsing -ErrorAction Stop
    Write-Host "  UNEXPECTED PASS" -ForegroundColor Red
    $results += "FAIL"
}
catch {
    if ($_.Exception.Message -like "*Only college email*") {
        Write-Host "  PASS - Correctly rejected non-college email" -ForegroundColor Green
        $results += "PASS"
    } else {
        Write-Host "  FAIL - Wrong error: $($_.Exception.Message)" -ForegroundColor Red
        $results += "FAIL"
    }
}

# Test 4: Resend verification with non-college (should fail)
Write-Host "`n[TEST 4] Resend verification with non-college email (@yahoo.com)" -ForegroundColor Green
$payload = @{
    email = "user@yahoo.com"
} | ConvertTo-Json

try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/auth/resend-verification" -Method POST -ContentType "application/json" -Body $payload -UseBasicParsing -ErrorAction Stop
    Write-Host "  UNEXPECTED PASS" -ForegroundColor Red
    $results += "FAIL"
}
catch {
    if ($_.Exception.Message -like "*Only college email*") {
        Write-Host "  PASS - Correctly rejected non-college email" -ForegroundColor Green
        $results += "PASS"
    } else {
        Write-Host "  FAIL - Wrong error: $($_.Exception.Message)" -ForegroundColor Red
        $results += "FAIL"
    }
}

# Test 5: Teacher login with non-college (should work)
Write-Host "`n[TEST 5] Teacher login with NON-college email (should work)" -ForegroundColor Green
$randomId = Get-Random -Minimum 1000 -Maximum 9999
$payload = @{
    name = "Test Teacher"
    email = "teacher$randomId@gmail.com"
    password = "TeacherPass123"
} | ConvertTo-Json

try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/auth/teacher-login" -Method POST -ContentType "application/json" -Body $payload -UseBasicParsing -ErrorAction Stop
    Write-Host "  PASS - Teacher login allowed with any email (Status: $($resp.StatusCode))" -ForegroundColor Green
    $results += "PASS"
}
catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "  PASS - User already exists (no domain restriction)" -ForegroundColor Green
        $results += "PASS"
    } else {
        Write-Host "  FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
        $results += "FAIL"
    }
}

# Test 6: Health check (should always work)
Write-Host "`n[TEST 6] Health check endpoint" -ForegroundColor Green
try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "  PASS - Health check OK (Status: $($resp.StatusCode))" -ForegroundColor Green
    $results += "PASS"
}
catch {
    Write-Host "  FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $results += "FAIL"
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
$passed = ($results | Where-Object { $_ -eq "PASS" }).Count
$failed = ($results | Where-Object { $_ -eq "FAIL" }).Count
Write-Host "RESULTS: $passed PASSED, $failed FAILED" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "SUCCESS! All tests passed." -ForegroundColor Green
} else {
    Write-Host "FAILURE! Some tests failed." -ForegroundColor Red
}
