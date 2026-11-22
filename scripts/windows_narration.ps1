param([Parameter(Mandatory=$true)][string]$ScriptFile,[Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Speech
$sentences=Get-Content -LiteralPath $ScriptFile -Raw -Encoding UTF8 | ConvertFrom-Json
$voice=New-Object System.Speech.Synthesis.SpeechSynthesizer
$chinese=$voice.GetInstalledVoices() | Where-Object {$_.VoiceInfo.Culture.Name -eq 'zh-CN'} | Select-Object -First 1
if(-not $chinese){throw 'No installed zh-CN system voice; narration is blocked'}
$voice.SelectVoice($chinese.VoiceInfo.Name);$voice.Rate=0
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$records=@()
try {
 for($i=0;$i -lt $sentences.Count;$i++){
  $target=Join-Path $OutputDirectory ('voice-{0:D2}.wav' -f $i)
  if(Test-Path -LiteralPath $target){throw "Refusing to overwrite $target"}
  $voice.SetOutputToWaveFile($target);$voice.Speak([string]$sentences[$i]);$voice.SetOutputToNull()
  $records+=@{file=$target;text=[string]$sentences[$i];voice=$chinese.VoiceInfo.Name;method='separate actual synthesized sentence audio; not ASR';scope='private-test'}
 }
 $records | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'synthesis.json') -Encoding UTF8
}finally{$voice.Dispose()}
