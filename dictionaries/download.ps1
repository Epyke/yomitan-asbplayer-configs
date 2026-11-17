# Downloads the Yomitan dictionaries used by yomitan/yomitan-settings.json into this folder.
#   powershell -ExecutionPolicy Bypass -File dictionaries\download.ps1
#
# The numeric prefix is the priority order. Import them into Yomitan in this order
# (Settings > Dictionaries > Configure installed and enabled dictionaries > Import, select all 7).
#
# NOTE: jmdict-yomitan sometimes publishes a broken "latest" (a ~2 KB zip). The script checks
# the size and you can pin a dated release instead, e.g. .../releases/download/2026-11-15/JMnedict.zip

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

$dicts = [ordered]@{
    '01_jitendex.zip'                  = 'https://github.com/stephenmk/stephenmk.github.io/releases/latest/download/jitendex-yomitan.zip'
    '02_JMnedict.zip'                  = 'https://github.com/yomidevs/jmdict-yomitan/releases/download/2026-11-15/JMnedict.zip'
    '03_KANJIDIC_english.zip'          = 'https://github.com/yomidevs/jmdict-yomitan/releases/download/2026-11-15/KANJIDIC_english.zip'
    '04_kanjium_pitch_accents.zip'     = 'https://github.com/toasted-nutbread/yomichan-pitch-accent-dictionary/releases/download/1.0.0/kanjium_pitch_accents.zip'
    '05_JPDB_v2.2_Frequency_Kana.zip'  = 'https://github.com/Kuuuube/yomitan-dictionaries/releases/download/yomitan-permalink/JPDB_v2.2_Frequency_Kana.zip'
    '06_jiten_freq.zip'                = 'https://api.jiten.moe/api/frequency-list/download?downloadType=yomitan'
    '07_BCCWJ_SUW_LUW_combined.zip'    = 'https://github.com/Kuuuube/yomitan-dictionaries/releases/download/yomitan-permalink/BCCWJ_SUW_LUW_combined.zip'
}

foreach ($name in $dicts.Keys) {
    $dest = Join-Path $here $name
    Write-Host "Downloading $name ..."
    Invoke-WebRequest -Uri $dicts[$name] -OutFile $dest -UseBasicParsing
    $size = (Get-Item $dest).Length
    if ($size -lt 100KB) { Write-Warning "$name is only $size bytes - probably a broken release, pin an older one." }
}
Write-Host 'Done.'
