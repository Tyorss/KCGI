Add-Type -AssemblyName System.IO.Compression.FileSystem

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$BloombergDir = Join-Path $Root "bloomberg"
$KrxDir = Join-Path $Root "KRX"
$GeneratedAt = (Get-Date).ToUniversalTime().ToString("o")
$Invariant = [System.Globalization.CultureInfo]::InvariantCulture
$DataCutoffIso = "2026-05-29"

function Get-DisplayName {
  param([string]$Key)
  switch ($Key) {
    "WTI" { "WTI" }
    "US10Y" { "US 10Y" }
    "CPI" { "CPI" }
    "SPY" { "SPY" }
    "WIRP" { "WIRP" }
    "KOSPI" { "KOSPI PEBD" }
    "KOSPI_MKT" { "KOSPI Market Cap" }
    "KOSPI_FPE" { "KOSPI Forward P/E" }
    "SAMSUNG" { "Samsung Electronics" }
    "HYNIX" { "SK Hynix" }
    "DRAM" { "DRAM ETF" }
    "CSI300" { "CSI300" }
    "HSTECH" { "HSTECH" }
    "STAR50" { "STAR50" }
    "QTUM" { "QTUM" }
    "NASA" { "NASA" }
    "KRX_BREADTH" { "KRX Advancers/Decliners/Unchanged" }
    "KRX_JEONNIK" { "KRX Samsung/Hynix Shares" }
    default { $Key }
  }
}

function Get-ColumnIndex {
  param([string]$Reference)
  $letters = ($Reference -replace "\d", "").ToUpperInvariant()
  $index = 0
  foreach ($char in $letters.ToCharArray()) {
    $index = ($index * 26) + ([int][char]$char - [int][char]'A' + 1)
  }
  return $index - 1
}

function Read-ZipEntryText {
  param($Zip, [string]$EntryName)
  $entry = $Zip.GetEntry($EntryName)
  if (-not $entry) { return $null }
  $stream = $entry.Open()
  try {
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8)
    try { return $reader.ReadToEnd() } finally { $reader.Dispose() }
  } finally {
    $stream.Dispose()
  }
}

function Get-SharedStrings {
  param($Zip)
  $text = Read-ZipEntryText $Zip "xl/sharedStrings.xml"
  if (-not $text) { return @() }
  [xml]$xml = $text
  $strings = New-Object System.Collections.Generic.List[string]
  foreach ($si in $xml.sst.si) {
    [void]$strings.Add($si.InnerText.Trim())
  }
  return $strings.ToArray()
}

function Get-CellValue {
  param($Cell, [string[]]$SharedStrings)
  $type = [string]$Cell.t
  if ($type -eq "inlineStr") { return $Cell.InnerText.Trim() }
  $value = [string]$Cell.v
  if ($type -eq "s" -and $value -ne "") {
    $idx = [int]$value
    if ($idx -ge 0 -and $idx -lt $SharedStrings.Count) { return $SharedStrings[$idx] }
  }
  return $value
}

function Convert-ExcelDate {
  param($Value)
  if ($null -eq $Value) { return $null }
  $text = ([string]$Value).Trim()
  if ($text -eq "") { return $null }

  $serial = 0.0
  if ([double]::TryParse($text, [System.Globalization.NumberStyles]::Float, $Invariant, [ref]$serial)) {
    if ($serial -gt 20000 -and $serial -lt 70000) {
      return ([datetime]"1899-12-30").AddDays($serial).Date
    }
  }

  $date = [datetime]::MinValue
  $styles = [System.Globalization.DateTimeStyles]::AllowWhiteSpaces
  if ([datetime]::TryParse($text, $Invariant, $styles, [ref]$date)) {
    return $date.Date
  }
  return $null
}

function Convert-Number {
  param($Value)
  if ($null -eq $Value) { return $null }
  $text = ([string]$Value).Trim()
  if ($text -eq "" -or $text -like "#N/A*") { return $null }
  $text = $text.Replace(",", "").TrimEnd("%")
  $number = 0.0
  if ([double]::TryParse($text, [System.Globalization.NumberStyles]::Float, $Invariant, [ref]$number)) {
    return $number
  }
  return $null
}

function Read-XlsxData {
  param([string]$Path, [string]$Key)
  $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
  try {
    $shared = Get-SharedStrings $zip
    $sheetText = Read-ZipEntryText $zip "xl/worksheets/sheet1.xml"
    if (-not $sheetText) { throw "sheet1.xml을 찾을 수 없습니다." }
    [xml]$sheet = $sheetText
    $rows = New-Object System.Collections.Generic.List[object]
    $allText = New-Object System.Collections.Generic.List[string]

    foreach ($row in $sheet.worksheet.sheetData.row) {
      $map = @{}
      $max = -1
      foreach ($cell in $row.c) {
        $idx = Get-ColumnIndex ([string]$cell.r)
        $value = Get-CellValue $cell $shared
        $map[$idx] = $value
        if ($idx -gt $max) { $max = $idx }
        if ($value) { [void]$allText.Add([string]$value) }
      }
      $values = @()
      for ($i = 0; $i -le $max; $i++) {
        if ($map.ContainsKey($i)) { $values += $map[$i] } else { $values += $null }
      }
      [void]$rows.Add([pscustomobject]@{ RowNumber = [int]$row.r; Values = $values })
    }

    $headerIndex = -1
    for ($i = 0; $i -lt $rows.Count; $i++) {
      if (($rows[$i].Values.Count -gt 0) -and ([string]$rows[$i].Values[0]).Trim() -eq "Date") {
        $headerIndex = $i
        break
      }
    }

    $invalid = (($allText -join " ") -like "*#N/A Requesting Data*")
    if ($headerIndex -lt 0) {
      return [pscustomobject]@{
        key = $Key
        assetName = Get-DisplayName $Key
        fileName = (Split-Path $Path -Leaf)
        sheetName = "sheet1"
        headers = @()
        rows = @()
        metadataText = ($allText -join " ")
        invalid = $true
        invalidReason = "Date 헤더 행을 찾지 못했습니다."
        sourceName = "Bloomberg"
        sourceUrl = "Bloomberg Terminal"
      }
    }

    $headers = @()
    foreach ($header in $rows[$headerIndex].Values) {
      $headers += ([string]$header).Trim()
    }

    $parsedRows = New-Object System.Collections.Generic.List[object]
    for ($i = $headerIndex + 1; $i -lt $rows.Count; $i++) {
      $sourceRow = $rows[$i].Values
      if ($sourceRow.Count -eq 0) { continue }
      $date = Convert-ExcelDate $sourceRow[0]
      if (-not $date) { continue }
      $values = [ordered]@{}
      for ($col = 0; $col -lt $headers.Count; $col++) {
        $header = $headers[$col]
        if ([string]::IsNullOrWhiteSpace($header)) { continue }
        if ($header -eq "Date") { continue }
        $cellValue = if ($col -lt $sourceRow.Count) { $sourceRow[$col] } else { $null }
        $number = Convert-Number $cellValue
        if ($null -ne $number) { $values[$header] = $number }
      }
      [void]$parsedRows.Add([pscustomobject]@{
        dateIso = $date.ToString("yyyy-MM-dd")
        values = $values
      })
    }

    $sortedRows = @($parsedRows | Where-Object { $_.dateIso -le $DataCutoffIso } | Sort-Object dateIso)
    return [pscustomobject]@{
      key = $Key
      assetName = Get-DisplayName $Key
      fileName = (Split-Path $Path -Leaf)
      sheetName = "sheet1"
      headers = $headers
      rows = $sortedRows
      metadataText = ($rows | Select-Object -First $headerIndex | ForEach-Object { $_.Values -join " " }) -join " "
      invalid = [bool]$invalid
      invalidReason = if ($invalid) { "#N/A Requesting Data 포함" } else { "" }
      sourceName = "Bloomberg"
      sourceUrl = "Bloomberg Terminal"
    }
  } finally {
    $zip.Dispose()
  }
}

function Resolve-Column {
  param([string[]]$Headers, [string[]]$Candidates)
  foreach ($candidate in $Candidates) {
    foreach ($header in $Headers) {
      if ($header.Trim().ToLowerInvariant() -eq $candidate.Trim().ToLowerInvariant()) { return $header }
    }
  }
  foreach ($candidate in $Candidates) {
    foreach ($header in $Headers) {
      $h = $header.Trim().ToLowerInvariant()
      $c = $candidate.Trim().ToLowerInvariant()
      if ($h.Contains($c) -or $c.Contains($h)) { return $header }
    }
  }
  return $null
}

function Identify-DatasetKey {
  param($Dataset)
  $text = (($Dataset.fileName + " " + $Dataset.metadataText + " " + ($Dataset.headers -join " "))).ToUpperInvariant()
  if ($text -match "USGG10YR" -or $text -match "^10" -or $text -match "\\10") { return "US10Y" }
  if ($text -match "005930") { return "SAMSUNG" }
  if ($text -match "000660") { return "HYNIX" }
  if ($text -match "WTI" -or $text -match "CL1 COMB") { return "WTI" }
  if ($text -match "CPI") { return "CPI" }
  if ($text -match "SPY") { return "SPY" }
  if ($text -match "WIRP") { return "WIRP" }
  if ($text -match "CURRENT MARKET CAP" -or $text -match "KOSPI MKT") { return "KOSPI_MKT" }
  if ($text -match "BEST P/E RATIO" -or $text -match "KSOPI_FPE") { return "KOSPI_FPE" }
  if ($text -match "KOSPI" -or $text -match "PEBD") { return "KOSPI" }
  if ($text -match "DRAM") { return "DRAM" }
  if ($text -match "CSI300") { return "CSI300" }
  if ($text -match "HSTECH") { return "HSTECH" }
  if ($text -match "STAR50" -or $text -match "STAR 50") { return "STAR50" }
  if ($text -match "QTUM") { return "QTUM" }
  if ($text -match "NASA") { return "NASA" }
  return $null
}

function Get-MayRows {
  param($Dataset)
  return @($Dataset.rows | Where-Object { $_.dateIso -ge "2026-05-01" -and $_.dateIso -le $DataCutoffIso })
}

function Get-PeriodRows {
  param($Dataset, [string]$Period)
  if ($Period -eq "all") { return @($Dataset.rows) }
  $rows = @($Dataset.rows | Sort-Object dateIso)
  if ($rows.Count -eq 0) { return @() }
  $lastDate = [datetime]::ParseExact($rows[$rows.Count - 1].dateIso, "yyyy-MM-dd", $Invariant)
  $months = switch ($Period) {
    "1m" { 1 }
    "6m" { 6 }
    "1y" { 12 }
    default { 1 }
  }
  $startDate = $lastDate.AddMonths(-1 * $months)
  return @($rows | Where-Object {
    $date = [datetime]::ParseExact($_.dateIso, "yyyy-MM-dd", $Invariant)
    $date -ge $startDate -and $date -le $lastDate
  })
}

function Get-ReturnRow {
  param($Dataset, [string[]]$Columns, [string]$Period)
  if (-not $Dataset -or $Dataset.invalid) { return $null }
  $column = Resolve-Column $Dataset.headers $Columns
  if (-not $column) { return $null }
  $rows = @(Get-PeriodRows $Dataset $Period | Where-Object { $null -ne $_.values.$column })
  if ($rows.Count -lt 2) { return $null }
  $first = $rows[0]
  $last = $rows[$rows.Count - 1]
  if ($Period -ne "all") {
    $months = switch ($Period) {
      "1m" { 1 }
      "6m" { 6 }
      "1y" { 12 }
      default { 1 }
    }
    $lastDate = [datetime]::ParseExact($last.dateIso, "yyyy-MM-dd", $Invariant)
    $requiredStart = $lastDate.AddMonths(-1 * $months).AddDays(10)
    $firstDate = [datetime]::ParseExact($first.dateIso, "yyyy-MM-dd", $Invariant)
    if ($firstDate -gt $requiredStart) { return $null }
  }
  $firstValue = [double]$first.values.$column
  $lastValue = [double]$last.values.$column
  if ($firstValue -eq 0) { return $null }
  return [pscustomobject]@{
    period = $Period
    asset_name = $Dataset.assetName
    first_date = $first.dateIso
    first_value = [math]::Round($firstValue, 6)
    last_date = $last.dateIso
    last_value = [math]::Round($lastValue, 6)
    return_pct = [math]::Round((($lastValue / $firstValue) - 1) * 100, 4)
    source_file = $Dataset.fileName
  }
}

function Read-KrxBreadthData {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  $rows = New-Object System.Collections.Generic.List[object]
  foreach ($file in (Get-ChildItem -LiteralPath $Path -Filter "*.csv")) {
    if ($file.Name -notmatch "^(\d{1,2})\.(\d{1,2}).*\.csv$") { continue }
    $month = [int]$Matches[1]
    $day = [int]$Matches[2]
    $date = Get-Date -Year 2026 -Month $month -Day $day
    $advancers = 0
    $decliners = 0
    $unchanged = 0
    foreach ($row in (Import-Csv -LiteralPath $file.FullName)) {
      $change = Convert-Number $row.Change
      if ($null -eq $change) { continue }
      if ($change -gt 0) { $advancers += 1 }
      elseif ($change -lt 0) { $decliners += 1 }
      else { $unchanged += 1 }
    }
    [void]$rows.Add([pscustomobject]@{
      dateIso = $date.ToString("yyyy-MM-dd")
      values = [ordered]@{
        Advancers = $advancers
        Decliners = $decliners
        Unchanged = $unchanged
      }
    })
  }
  $sortedRows = @($rows | Where-Object { $_.dateIso -le $DataCutoffIso } | Sort-Object dateIso)
  if ($sortedRows.Count -eq 0) { return $null }
  return [pscustomobject]@{
    key = "KRX_BREADTH"
    assetName = Get-DisplayName "KRX_BREADTH"
    fileName = "KRX price change CSV"
    sheetName = ""
    headers = @("Date", "Advancers", "Decliners", "Unchanged")
    rows = $sortedRows
    metadataText = "KRX KOSPI daily price change files"
    invalid = $false
    invalidReason = ""
    sourceName = "KRX"
    sourceUrl = "KRX CSV"
  }
}

function Read-KrxJeonnikData {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  $rows = New-Object System.Collections.Generic.List[object]
  foreach ($file in (Get-ChildItem -LiteralPath $Path -Filter "*.csv")) {
    if ($file.Name -notmatch "^(\d{1,2})\.(\d{1,2}).*\.csv$") { continue }
    $month = [int]$Matches[1]
    $day = [int]$Matches[2]
    $date = Get-Date -Year 2026 -Month $month -Day $day
    $csvRows = @(Import-Csv -LiteralPath $file.FullName)
    $samsung = $csvRows | Where-Object { $_.'Issue code' -eq '5930' } | Select-Object -First 1
    $hynix = $csvRows | Where-Object { $_.'Issue code' -eq '660' } | Select-Object -First 1
    if (-not $samsung -or -not $hynix) { continue }
    [void]$rows.Add([pscustomobject]@{
      dateIso = $date.ToString("yyyy-MM-dd")
      values = [ordered]@{
        SamsungMarketCap = [double](Convert-Number $samsung.'Market cap.')
        HynixMarketCap = [double](Convert-Number $hynix.'Market cap.')
        SamsungShares = [double](Convert-Number $samsung.'No.of listed shares')
        HynixShares = [double](Convert-Number $hynix.'No.of listed shares')
      }
    })
  }
  $sortedRows = @($rows | Where-Object { $_.dateIso -le $DataCutoffIso } | Sort-Object dateIso)
  if ($sortedRows.Count -eq 0) { return $null }
  return [pscustomobject]@{
    key = "KRX_JEONNIK"
    assetName = Get-DisplayName "KRX_JEONNIK"
    fileName = "KRX price change CSV"
    sheetName = ""
    headers = @("Date", "SamsungMarketCap", "HynixMarketCap", "SamsungShares", "HynixShares")
    rows = $sortedRows
    metadataText = "KRX Samsung Electronics and SK Hynix market cap and listed shares"
    invalid = $false
    invalidReason = ""
    sourceName = "KRX"
    sourceUrl = "KRX CSV"
  }
}

function Convert-ToCsv {
  param([object[]]$Rows, [string[]]$Headers)
  $lines = New-Object System.Collections.Generic.List[string]
  [void]$lines.Add(($Headers -join ","))
  foreach ($row in $Rows) {
    $values = foreach ($header in $Headers) {
      $value = [string]$row.$header
      '"' + $value.Replace('"', '""') + '"'
    }
    [void]$lines.Add(($values -join ","))
  }
  return ($lines -join "`r`n")
}

$datasetsByKey = @{}
foreach ($file in (Get-ChildItem -LiteralPath $BloombergDir -Filter *.xlsx)) {
  $dataset = Read-XlsxData -Path $file.FullName -Key "UNKNOWN"
  $key = Identify-DatasetKey $dataset
  if (-not $key) { continue }
  $dataset.key = $key
  $dataset.assetName = Get-DisplayName $key
  $datasetsByKey[$key] = $dataset
}

$datasetOrder = @("WTI", "US10Y", "CPI", "SPY", "WIRP", "KOSPI", "KOSPI_MKT", "KOSPI_FPE", "SAMSUNG", "HYNIX", "DRAM", "CSI300", "HSTECH", "STAR50", "QTUM", "NASA")
$datasets = New-Object System.Collections.Generic.List[object]
foreach ($key in $datasetOrder) {
  if ($datasetsByKey.ContainsKey($key)) { [void]$datasets.Add($datasetsByKey[$key]) }
}

$krxBreadth = Read-KrxBreadthData $KrxDir
if ($krxBreadth) { [void]$datasets.Add($krxBreadth) }
$krxJeonnik = Read-KrxJeonnikData $KrxDir
if ($krxJeonnik) { [void]$datasets.Add($krxJeonnik) }

$payload = [pscustomobject]@{
  generatedAt = $GeneratedAt
  sourceFolder = "bloomberg + KRX"
  datasets = $datasets
}

$json = $payload | ConvertTo-Json -Depth 20 -Compress
[System.IO.File]::WriteAllText((Join-Path $Root "preloaded-data.js"), "window.PRELOADED_DATASETS = $json;`n", [System.Text.Encoding]::UTF8)

$datasetMap = @{}
foreach ($dataset in $datasets) { $datasetMap[$dataset.key] = $dataset }
$returnSpecs = @(
  @("WTI", @("PX_LAST")),
  @("SPY", @("PX_LAST")),
  @("DRAM", @("PX_LAST")),
  @("QTUM", @("PX_LAST")),
  @("NASA", @("PX_LAST")),
  @("STAR50", @("PX_LAST")),
  @("CSI300", @("PX_LAST")),
  @("HSTECH", @("PX_LAST")),
  @("SAMSUNG", @("PX_LAST")),
  @("HYNIX", @("PX_LAST")),
  @("KOSPI", @("Price"))
)

$returns = New-Object System.Collections.Generic.List[object]
foreach ($spec in $returnSpecs) {
  foreach ($period in @("1m", "6m", "1y")) {
    $row = Get-ReturnRow -Dataset $datasetMap[$spec[0]] -Columns $spec[1] -Period $period
    if ($row) { [void]$returns.Add($row) }
  }
}

$returnHeaders = @("period", "asset_name", "first_date", "first_value", "last_date", "last_value", "return_pct", "source_file")
[System.IO.File]::WriteAllText((Join-Path $Root "computed_returns.csv"), (Convert-ToCsv -Rows $returns -Headers $returnHeaders), [System.Text.Encoding]::UTF8)

Write-Host "Generated preloaded-data.js with $($datasets.Count) datasets."
Write-Host "Generated computed_returns.csv with $($returns.Count) rows."
