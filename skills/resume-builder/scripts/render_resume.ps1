[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$HTML,
    [Parameter(Mandatory = $true, Position = 1)]
    [string]$OutputPdf
)

$ErrorActionPreference = 'Stop'

try {
    $htmlPath = (Resolve-Path -LiteralPath $HTML -ErrorAction Stop).Path
    $outputPath = [System.IO.Path]::GetFullPath($OutputPdf)
    $outputDirectory = Split-Path -Parent $outputPath
    if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
        New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    }

    $pdfHelp = (& npx --no-install playwright pdf --help 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to run 'npx --no-install playwright pdf --help'."
    }

    $arguments = @('--no-install', 'playwright', 'pdf', '--paper-format', 'A4')
    if ($pdfHelp -match '--print-background') {
        $arguments += '--print-background'
    } else {
        Write-Warning 'This Playwright CLI has no --print-background flag; its PDF defaults are used.'
    }
    if ($pdfHelp -match '--prefer-css-page-size') {
        $arguments += '--prefer-css-page-size'
    } else {
        Write-Warning 'This Playwright CLI has no --prefer-css-page-size flag; --paper-format A4 is used.'
    }
    $arguments += @((New-Object System.Uri($htmlPath)).AbsoluteUri, $outputPath)
    & npx @arguments
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
    if (-not (Test-Path -LiteralPath $outputPath -PathType Leaf)) {
        throw "Playwright completed without creating '$outputPath'."
    }
} catch {
    Write-Error $_
    exit 1
}
