[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$HTML,
    [Parameter(Mandatory = $true, Position = 1)]
    [string]$OutputPdf
)

$ErrorActionPreference = 'Stop'
$previousNpmLogLevel = $env:npm_config_loglevel
$env:npm_config_loglevel = 'error'

try {
    $htmlPath = (Resolve-Path -LiteralPath $HTML -ErrorAction Stop).Path
    $outputPath = [System.IO.Path]::GetFullPath($OutputPdf)
    $outputDirectory = Split-Path -Parent $outputPath
    if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
        New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    }

    $previewPath = Join-Path $outputDirectory "$([System.IO.Path]::GetFileNameWithoutExtension($outputPath)).preview.png"
    $rendererScript = Join-Path $PSScriptRoot 'render_resume.mjs'
    & node $rendererScript --html $htmlPath --pdf $outputPath --preview $previewPath --json
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
    if (-not (Test-Path -LiteralPath $outputPath -PathType Leaf)) {
        throw "Playwright completed without creating '$outputPath'."
    }

    $versionOutput = (& node -e "console.log(require('playwright/package.json').version)" 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or $versionOutput -notmatch '^(\d+\.\d+\.\d+)$') {
        throw "Unable to determine the installed Playwright version."
    }
    $renderer = "playwright@$versionOutput"
    $manifestPath = Join-Path $outputDirectory "$([System.IO.Path]::GetFileNameWithoutExtension($outputPath)).resume-manifest.json"
    $validator = Join-Path $PSScriptRoot 'validate_resume.py'
    & python $validator --html $htmlPath --pdf $outputPath --mode visual --check-overflow --check-layout --min-fill-ratio 0.98 --preview $previewPath --manifest $manifestPath --renderer $renderer --json
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
} catch {
    Write-Error $_
    exit 1
} finally {
    $env:npm_config_loglevel = $previousNpmLogLevel
}
