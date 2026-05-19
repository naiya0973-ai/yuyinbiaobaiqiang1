Write-Host "Starting Voice Confession Wall Preview..." -ForegroundColor Green
Write-Host ""
Write-Host "正在启动预览服务器..." -ForegroundColor Cyan
Write-Host "访问地址: http://localhost:8080" -ForegroundColor Yellow
Write-Host ""

$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "✅ 服务器已启动!" -ForegroundColor Green
    Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Gray
    Write-Host ""

    # 自动打开浏览器
    Start-Process "http://localhost:$port"

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/preview.html" }

        $filePath = Join-Path (Get-Location) $path

        if (Test-Path $filePath -PathType Leaf) {
            $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)

            $response.ContentType = switch ([System.IO.Path]::GetExtension($path)) {
                ".html" { "text/html" }
                ".css"  { "text/css" }
                ".js"   { "application/javascript" }
                ".json" { "application/json" }
                default { "text/plain" }
            }

            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $response.StatusCode = 404
            $message = "404 - File Not Found"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($message)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }

        $response.Close()
    }
}
finally {
    $listener.Stop()
    Write-Host "服务器已停止" -ForegroundColor Red
}