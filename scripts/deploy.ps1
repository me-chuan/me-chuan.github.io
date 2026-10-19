#!/usr/bin/env pwsh
# =============================================================================
# 一键部署脚本：建仓 -> 推送 -> 开启 GitHub Pages -> 等待构建
#
# 用法（Windows PowerShell 5.1 / PowerShell 7 均可）:
#   powershell -ExecutionPolicy Bypass -File scripts\deploy.ps1
#
# 前置条件:
#   1. 已安装 gh CLI 并完成登录：  gh auth login
#   2. 已安装 pnpm：              npm i -g pnpm@11
#
# 注意: 本文件必须是 UTF-8 with BOM，否则 Windows PowerShell 5.1 会按 ANSI
#       读取导致中文字符乱码并触发语法解析错误。
# =============================================================================

# 原生命令的 stderr 在 PS 5.1 下会被转成 ErrorRecord；
# 与 $ErrorActionPreference='Stop' 组合会把"预期内的失败"也变成终止性错误。
# 因此这里统一用 Continue，改为显式检查 $LASTEXITCODE。
$ErrorActionPreference = 'Continue'

$repoName    = 'me-chuan.github.io'
$repoOwner   = 'me-chuan'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

function Write-Step($msg)  { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)    { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn2($msg) { Write-Host "    [!!] $msg" -ForegroundColor Yellow }

# --- 0. 前置检查 -------------------------------------------------------------
Write-Step "检查前置条件"

# 刷新 PATH：拾取本次会话之后新装的工具（例如 winget 刚装完的 gh CLI）。
# 不刷新的话，用户没重启终端时脚本会误报"未找到 gh CLI"。
$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
            [System.Environment]::GetEnvironmentVariable('Path', 'User') + ';' + $env:Path

# 解析 gh 可执行文件：先找 PATH，再回退到 winget 的标准安装目录
$gh = $null
if (Get-Command gh -ErrorAction SilentlyContinue) {
    $gh = 'gh'
} else {
    foreach ($candidate in @(
        (Join-Path $env:ProgramFiles 'GitHub CLI\gh.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'GitHub CLI\gh.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\GitHub CLI\gh.exe')
    )) {
        if ($candidate -and (Test-Path $candidate)) { $gh = $candidate; break }
    }
}
if (-not $gh) {
    throw "未找到 gh CLI。安装： winget install --id GitHub.cli -e --source winget"
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    throw "未找到 pnpm。安装： npm i -g pnpm@11"
}
# 用一次真实 API 调用做鉴权校验，比 `gh auth status` 更可靠：
# 后者只读本地 keyring，在子进程里偶发取不到凭据而误报未登录。
$login = $null
for ($i = 1; $i -le 3; $i++) {
    $login = & $gh api user --jq .login 2>$null
    if ($LASTEXITCODE -eq 0 -and $login) { break }
    Start-Sleep -Seconds 2
}
if ($LASTEXITCODE -ne 0 -or -not $login) {
    throw "gh CLI 未登录或网络不可达。请先执行： gh auth login"
}
Write-Ok "gh CLI 已登录 ($login)"

# 推送 .github/workflows/ 需要令牌带 workflow scope，否则 GitHub 会拒绝：
#   "refusing to allow an OAuth App to create or update workflow ... without `workflow` scope"
# 这里提前检查并给出修复命令，避免推到一半才失败。
$scopeLine = (& $gh auth status 2>$null | Select-String -Pattern 'Token scopes' | Select-Object -First 1)
if ("$scopeLine" -notmatch 'workflow') {
    throw ("当前 gh 令牌缺少 workflow 权限，无法推送 .github/workflows/。" +
           "请先执行： gh auth refresh -h github.com -s workflow" +
           "（会给出一次性设备码，在浏览器里确认即可）")
}
Write-Ok "令牌具备 workflow 权限"

# --- 1. 构建校验 -------------------------------------------------------------
Write-Step "类型检查与构建"
pnpm check
if ($LASTEXITCODE -ne 0) { throw "类型检查失败，已中止部署" }
Write-Ok "类型检查通过"

pnpm build
if ($LASTEXITCODE -ne 0) { throw "构建失败，已中止部署" }
Write-Ok "构建成功 -> dist/"

# --- 2. 创建仓库并推送 -------------------------------------------------------
Write-Step "准备 GitHub 仓库 $repoOwner/$repoName"
$repoExists = $false
& $gh repo view "$repoOwner/$repoName" --json name *> $null
if ($LASTEXITCODE -eq 0) { $repoExists = $true }

if ($repoExists) {
    Write-Warn2 "仓库已存在，跳过创建"
    if (-not (git remote get-url origin 2>$null)) {
        git remote add origin "https://github.com/$repoOwner/$repoName.git"
        Write-Ok "已添加远端 origin"
    }
    git branch -M main
    git push -u origin main
    if ($LASTEXITCODE -ne 0) { throw "推送失败" }
} else {
    & $gh repo create $repoName --public --description "Personal homepage" --source . --remote origin --push
    if ($LASTEXITCODE -ne 0) { throw "创建仓库失败" }
    Write-Ok "仓库已创建: https://github.com/$repoOwner/$repoName"
}
Write-Ok "已推送到 main 分支"

# --- 3. 开启 Pages -----------------------------------------------------------
Write-Step "配置 GitHub Pages（Source = GitHub Actions）"

# JSON 请求体走临时文件而不是管道：Windows PowerShell 5.1 管道给原生命令
# 会带 BOM/编码问题，gh 会报 "Problems parsing JSON"。
$jsonPath = Join-Path $env:TEMP 'gh-pages-buildtype.json'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($jsonPath, '{"build_type":"workflow"}', $utf8NoBom)

$currentType = & $gh api "repos/$repoOwner/$repoName/pages" --jq '.build_type' 2>$null
if ($LASTEXITCODE -ne 0) {
    # Pages 站点还不存在
    & $gh api "repos/$repoOwner/$repoName/pages" -X POST --input $jsonPath *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "创建 Pages 失败。请到仓库 Settings -> Pages 手动把 Source 设为 GitHub Actions"
    }
    Write-Ok "Pages 已创建，Source = GitHub Actions"
} elseif ("$currentType" -ne 'workflow') {
    # 已存在但是 legacy（Deploy from a branch）——这会让 GitHub 用 Jekyll 构建
    # 整个仓库源码，把 Astro 的 frontmatter 当 YAML 解析后直接失败。
    Write-Warn2 "当前 Pages build_type = $currentType，切换为 workflow"
    & $gh api "repos/$repoOwner/$repoName/pages" -X PUT --input $jsonPath *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "切换 Pages build_type 失败。请到仓库 Settings -> Pages 手动把 Source 设为 GitHub Actions"
    }
    Write-Ok "Pages build_type 已切换为 workflow"
} else {
    Write-Ok "Pages 已是 GitHub Actions 模式"
}

# --- 4. 等待构建 -------------------------------------------------------------
Write-Step "等待 GitHub Actions 构建部署"
Write-Host "    进度: https://github.com/$repoOwner/$repoName/actions"
$deadline = (Get-Date).AddMinutes(12)
$seen = $false
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 15
    $json = & $gh run list --repo "$repoOwner/$repoName" --limit 5 --json workflowName,status,conclusion 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $json) { continue }
    $runs = $json | ConvertFrom-Json
    $deploy = $runs | Where-Object { $_.workflowName -like '*Deploy*' } | Select-Object -First 1
    if (-not $deploy) { continue }
    if (-not $seen) { $seen = $true; Write-Host "    已触发: $($deploy.workflowName)" }
    Write-Host "    状态: $($deploy.status) / $($deploy.conclusion)"
    if ($deploy.status -eq 'completed') {
        if ($deploy.conclusion -eq 'success') { Write-Ok "部署成功" }
        else { Write-Warn2 "部署未成功，请查看 Actions 日志" }
        break
    }
}
if (-not $seen) { Write-Warn2 "12 分钟内未检测到部署运行，请手动查看 Actions 页面" }

Write-Host "`n站点地址: https://$repoOwner.github.io" -ForegroundColor Green
Write-Host "Actions : https://github.com/$repoOwner/$repoName/actions" -ForegroundColor Green
