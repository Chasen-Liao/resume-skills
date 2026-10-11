[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$HTML,
    [Parameter(Mandatory = $true, Position = 1)]
    [string]$OutputPdf
)

$ErrorActionPreference = 'Stop'
$previousNpmLogLevel = $env:npm_config_loglevel
$previousConsoleEncoding = [Console]::OutputEncoding
$env:npm_config_loglevel = 'error'
# Node emits UTF-8 JSON. Legacy Windows PowerShell otherwise decodes it as
# the local code page, which can corrupt Chinese messages and JSON quotes.
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

try {
    $htmlPath = (Resolve-Path -LiteralPath $HTML -ErrorAction Stop).Path
    $outputPath = [System.IO.Path]::GetFullPath($OutputPdf)
    $outputDirectory = Split-Path -Parent $outputPath
    if (-not (Test-Path -LiteralPath $outputDirectory -PathType Container)) {
        New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    }

    $previewPath = Join-Path $outputDirectory "$([System.IO.Path]::GetFileNameWithoutExtension($outputPath)).preview.png"
    $rendererScript = Join-Path $PSScriptRoot 'render_resume.mjs'
    $renderOutput = (& node $rendererScript --html $htmlPath --pdf $outputPath --preview $previewPath --json | Out-String).Trim()
    $renderExitCode = $LASTEXITCODE
    Write-Output $renderOutput
    if ($renderExitCode -ne 0) {
        # A measured layout failure still produced diagnostic artifacts. Run
        # validation below to write an invalid manifest for those artifacts.
        $renderReport = $renderOutput | ConvertFrom-Json
        if ($renderReport.status -ne 'fail') {
            exit $renderExitCode
        }
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
    if ($renderExitCode -ne 0) {
        # Preserve the original render verdict even if a later measurement differs.
        $manifestModule = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../../lib/artifact-manifest.mjs'))
        & node --input-type=module -e 'import { pathToFileURL } from "node:url"; const { invalidateArtifactManifest } = await import(pathToFileURL(process.argv[1]).href); invalidateArtifactManifest(process.argv[2], process.argv[3], "PDF renderer layout failed");' $manifestModule $htmlPath $manifestPath
        exit $renderExitCode
    }
} catch {
    Write-Error $_
    exit 1
} finally {
    $env:npm_config_loglevel = $previousNpmLogLevel
    [Console]::OutputEncoding = $previousConsoleEncoding
}
