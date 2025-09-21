# PowerShell Test Script for Shiprocket Integration
Write-Host "🧪 Shiprocket Integration Test" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

$API_BASE = "http://localhost:3000/api"

try {
    # Step 1: Login as admin
    Write-Host "1️⃣ Logging in as admin..." -ForegroundColor Yellow
    $loginBody = @{
        email = "shaan@gmail.com"
        password = "password"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$API_BASE/auth/login" -Method Post -Headers @{"Content-Type"="application/json"} -Body $loginBody
    Write-Host "✅ Login successful" -ForegroundColor Green
    $authToken = $loginResponse.data.token

    # Step 2: Get orders
    Write-Host ""
    Write-Host "2️⃣ Fetching orders..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $authToken"
        "Content-Type" = "application/json"
    }

    $ordersResponse = Invoke-RestMethod -Uri "$API_BASE/orders" -Method Get -Headers $headers
    Write-Host "✅ Found $($ordersResponse.data.Count) orders" -ForegroundColor Green
    
    if ($ordersResponse.data.Count -eq 0) {
        Write-Host "❌ No orders found to test shipment creation" -ForegroundColor Red
        exit 1
    }

    # Find a suitable test order
    $testOrder = $ordersResponse.data | Where-Object { $_.status -in @('pending', 'confirmed', 'processing') } | Select-Object -First 1
    if (-not $testOrder) {
        $testOrder = $ordersResponse.data[0]
    }
    
    Write-Host "📦 Using order: $($testOrder.orderNumber) (Status: $($testOrder.status))" -ForegroundColor Blue
    Write-Host "📍 Delivery Address: $($testOrder.shippingAddress.city), $($testOrder.shippingAddress.state) - $($testOrder.shippingAddress.pincode)" -ForegroundColor Blue

    # Step 3: Create shipment
    Write-Host ""
    Write-Host "4️⃣ Creating Shiprocket shipment..." -ForegroundColor Yellow
    $shipmentBody = @{
        orderId = $testOrder._id
        provider = "shiprocket"
    } | ConvertTo-Json

    $shipmentResponse = Invoke-RestMethod -Uri "$API_BASE/delivery/create-shipment" -Method Post -Headers $headers -Body $shipmentBody
    Write-Host "✅ Shipment creation response received" -ForegroundColor Green
    
    if ($shipmentResponse.success) {
        Write-Host ""
        Write-Host "🎉 SHIPROCKET SHIPMENT CREATED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "📋 Shipment Details:" -ForegroundColor Cyan
        Write-Host "   - Shipment ID: $($shipmentResponse.data.shipmentId)" -ForegroundColor White
        Write-Host "   - AWB Number: $($shipmentResponse.data.awbNumber)" -ForegroundColor White
        Write-Host "   - Tracking URL: $($shipmentResponse.data.trackingUrl)" -ForegroundColor White
        Write-Host "   - Estimated Delivery: $($shipmentResponse.data.estimatedDelivery)" -ForegroundColor White
        Write-Host "   - Shipping Cost: Rs.$($shipmentResponse.data.shippingCost)" -ForegroundColor White
        
        if ($shipmentResponse.data.providerResponse.mock) {
            Write-Host ""
            Write-Host "⚠️ NOTE: This was a MOCK response. Set FORCE_MOCK_DELIVERY=false in your .env file to use real API" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "✅ This was a REAL Shiprocket API call!" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Shipment creation failed" -ForegroundColor Red
        Write-Host "Error: $($shipmentResponse.message)" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "✅ Test completed successfully!" -ForegroundColor Green

} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Troubleshooting Tips:" -ForegroundColor Yellow
    Write-Host "1. Make sure the development server is running (npm run dev)" -ForegroundColor White
    Write-Host "2. Check that Shiprocket credentials are correctly set in .env" -ForegroundColor White
    Write-Host "3. Verify pickup location ID matches your Shiprocket account" -ForegroundColor White
    Write-Host "4. Check server logs for detailed error messages" -ForegroundColor White
    exit 1
}