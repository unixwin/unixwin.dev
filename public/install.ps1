<#
    niubash - one-line installer for Windows

    Usage:
        irm https://unixwin.dev/install.ps1 | iex

    Design notes:
    * Downloads GitHub's *stable* asset names via /releases/latest/download/,
      so no API call is needed and the unauthenticated rate limit (60/hour)
      can never break an install.
    * Detects x64 and ARM64. niubash does not ship a 32-bit build.
#>

function Install-Niubash {
    $ErrorActionPreference = 'Stop'

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    } catch {
        # TLS12 already available or enforced by policy - continue.
    }

    $Repo = 'unixwin/niubash'
    $Base = "https://github.com/$Repo/releases/latest/download"
    $ReleasesPage = "https://github.com/$Repo/releases"

    # Resolve the real architecture even when running in a 32-bit shell.
    $Arch = $env:PROCESSOR_ARCHITECTURE
    if ($Arch -eq 'x86' -and $env:PROCESSOR_ARCHITEW6432) {
        $Arch = $env:PROCESSOR_ARCHITEW6432
    }

    $Asset = switch -Wildcard ($Arch) {
        'ARM64' { 'niubash-win-arm64-setup.exe' }
        'AMD64' { 'niubash-win-x64-setup.exe' }
        default { $null }
    }

    if (-not $Asset) {
        Write-Host ''
        Write-Host '  niubash requires 64-bit Windows (x64 or ARM64).' -ForegroundColor Red
        Write-Host "  This machine reports: $Arch" -ForegroundColor DarkGray
        Write-Host "  Download a build manually: $ReleasesPage" -ForegroundColor DarkGray
        Write-Host ''
        return
    }

    $Url = "$Base/$Asset"
    $Dest = Join-Path $env:TEMP $Asset

    Write-Host ''
    Write-Host '  niubash' -ForegroundColor Yellow -NoNewline
    Write-Host "   $Asset" -ForegroundColor DarkGray
    Write-Host ''

    try {
        Write-Host '  Downloading...' -ForegroundColor DarkGray
        # GitHub 302s to its CDN; Invoke-WebRequest follows it by default.
        Invoke-WebRequest -Uri $Url -OutFile $Dest -UseBasicParsing
    } catch {
        Write-Host ''
        Write-Host "  Download failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Try the release page instead: $ReleasesPage" -ForegroundColor DarkGray
        Write-Host ''
        return
    }

    # Integrity: verify against the release's own .sha256 sidecar before executing.
    try {
        Write-Host '  Verifying SHA256...' -ForegroundColor DarkGray
        $HashUrl = "$Url.sha256"
        $HashFile = Join-Path $env:TEMP "$Asset.sha256"
        Invoke-WebRequest -Uri $HashUrl -OutFile $HashFile -UseBasicParsing
        $Expected = (Get-Content $HashFile -TotalCount 1).Split()[0].Trim().ToLowerInvariant()
        Remove-Item -LiteralPath $HashFile -Force -ErrorAction SilentlyContinue
        $Actual = (Get-FileHash -LiteralPath $Dest -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($Actual -ne $Expected) {
            Write-Host ''
            Write-Host '  SHA256 MISMATCH - the download is corrupt or tampered.' -ForegroundColor Red
            Write-Host "    expected: $Expected" -ForegroundColor Red
            Write-Host "    actual:   $Actual" -ForegroundColor Red
            Write-Host "  Aborting. Report this at https://github.com/$Repo/issues" -ForegroundColor DarkGray
            Remove-Item -LiteralPath $Dest -Force -ErrorAction SilentlyContinue
            return
        }
        Write-Host '  SHA256 OK' -ForegroundColor Green
    } catch {
        # 校验链路失败不静默放过：报告并中止（fail-closed，不执行未校验的二进制）
        Write-Host ''
        Write-Host "  Could not verify SHA256: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host '  Aborting instead of running an unverified binary.' -ForegroundColor Yellow
        Write-Host "  Download manually from: $ReleasesPage" -ForegroundColor DarkGray
        Remove-Item -LiteralPath $Dest -Force -ErrorAction SilentlyContinue
        return
    }

    Write-Host '  Installing...' -ForegroundColor DarkGray
    $proc = Start-Process -FilePath $Dest -Wait -PassThru
    $code = $proc.ExitCode

    Remove-Item -LiteralPath $Dest -Force -ErrorAction SilentlyContinue

    Write-Host ''
    if ($code -eq 0) {
        Write-Host '  Done. Open a new terminal and run: niu' -ForegroundColor Green
    } else {
        Write-Host "  Installer exited with code $code." -ForegroundColor Red
        Write-Host "  Please report this at https://github.com/$Repo/issues" -ForegroundColor DarkGray
    }
    Write-Host ''
}

Install-Niubash
