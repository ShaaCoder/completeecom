# Simple PowerShell Test for Shiprocket with Active Pickup Location
Write-Host "🚀 Testing Shiprocket with Active Pickup Location" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

$API_BASE = "http://localhost:3000/api"

try {
    # Login
    Write-Host "1️⃣ Logging in..." -ForegroundColor Yellow
    $loginBody = @{
        email = "shaan@gmail.com"
        password = "password"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body $loginBody
    Write-Host "✅ Login successful" -ForegroundColor Green
    $authToken = $loginResponse.data.token

    # Get orders
    Write-Host "2️⃣ Getting orders..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $authToken"
        "Content-Type" = "application/json"
    }

    $ordersResponse = Invoke-RestMethod -Uri "$API_BASE/orders" -Method Get -Headers $headers
    $testOrder = $ordersResponse.data[0]
    Write-Host "✅ Using order: $($testOrder.orderNumber)" -ForegroundColor Green

    # Create shipment
    Write-Host "3️⃣ Creating Shiprocket shipment..." -ForegroundColor Yellow
    $shipmentBody = @{
        orderId = $testOrder._id
        provider = "shiprocket"
    } | ConvertTo-Json

    $shipmentResponse = Invoke-RestMethod -Uri "$API_BASE/delivery/create-shipment" -Method Post -Headers $headers -Body $shipmentBody
    
    if ($shipmentResponse.success) {
        Write-Host "🎉 SUCCESS! Shipment created!" -ForegroundColor Green
        Write-Host "   Shipment ID: $($shipmentResponse.data.shipmentId)" -ForegroundColor White
        Write-Host "   AWB Number: $($shipmentResponse.data.awbNumber)" -ForegroundColor White
        
        if ($shipmentResponse.data.providerResponse.mock) {
            Write-Host "   Note: This was a mock response (FORCE_MOCK_DELIVERY=false to use real API)" -ForegroundColor Yellow
        } else {
            Write-Host "   ✅ This was a REAL Shiprocket API call!" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Shipment creation failed: $($shipmentResponse.message)" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the development server is running!" -ForegroundColor Yellow
}