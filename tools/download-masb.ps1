param([string]$Python = 'python')
$ErrorActionPreference = 'Stop'
$taskPage = Invoke-WebRequest -Uri 'https://sites.google.com/view/vegshark/game/multiverse-all-star-battlefront' -SessionVariable taskWeb
[IO.File]::WriteAllText((Join-Path $PWD 'tools/masb-source/google-sites.html.txt'), $taskPage.Content, [Text.UTF8Encoding]::new($false))
$taskDocument = Invoke-WebRequest -Uri 'https://docs.google.com/document/d/e/2PACX-1vSvdWc_fM8-JNhXYQImOG3Us_UvJHnobgDF9NHJ6WXhd2HMml4cmfRdVkVicPolj4_bionlM4_6waLG/pub?embedded=true' -WebSession $taskWeb
[IO.File]::WriteAllText((Join-Path $PWD 'tools/masb-source/technical-document.html.txt'), $taskDocument.Content, [Text.UTF8Encoding]::new($false))
& $Python tools/import-masb.py
if ($LASTEXITCODE -ne 0) { throw 'Source import failed' }
$taskData = Get-Content tools/masb-source/content.json -Raw | ConvertFrom-Json
$taskItems = @($taskData.media) + @($taskData.blocks | Where-Object kind -eq 'image')
foreach ($taskItem in $taskItems) {
    Invoke-WebRequest -Uri $taskItem.url -WebSession $taskWeb -OutFile (Join-Path 'dist/projects/multiverse-all-star-battlefront/assets' $taskItem.file)
    Write-Output $taskItem.file
}
& $Python tools/import-masb.py
if ($LASTEXITCODE -ne 0) { throw 'Asset metadata verification failed' }
& $Python tools/prepare-masb-assets.py
if ($LASTEXITCODE -ne 0) { throw 'Lossless display preparation failed' }
