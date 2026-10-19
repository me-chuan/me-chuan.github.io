#!/usr/bin/env pwsh
# =============================================================================
# 一键部署脚本：建仓 → 推送 → 开启 GitHub Pages
#
# 用法:
#   pwsh -File scripts/deploy.ps1
#
# 前置条件:
#   1. 已安装 gh CLI 并完成登录：  gh auth login
#   2. 已在仓库 Settings → Pages 把 Build and deployment 的 Source 设为 GitHub Actions
#      （首次运行本脚本会自动设置）
# =============================================================================

$ErrorActionPreference = 'Stop'
$repoName = 'me-chuan.github.io'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn2($msg){ Write-Host "    [!!] $msg" -ForegroundColor Yellow }

# --- 0. 前置检查 -------------------------------------------------------------
Write-Step "检查前置条件"
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "未找到 gh CLI。安装： winget install --id GitHub.cli -e --source winget"
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    throw "未找到 pnpm。安装： npm i -g pnpm@11"
}

$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    throw "gh CLI 未登录。请先执行： gh auth login"
}
Write-Ok "gh CLI 已登录"

# --- 1. 构建校验 -------------------------------------------------------------
Write-Step "类型检查与构建"
pnpm check
if ($LASTEXITCODE -ne 0) { throw "类型检查失败，已中止部署" }
Write-Ok "类型检查通过"

pnpm build
if ($LASTEXITCODE -ne 0) { throw "构建失败，已中止部署" }
Write-Ok "构建成功 -> dist/"

# --- 2. 创建仓库 -------------------------------------------------------------
Write-Step "准备 GitHub 仓库 $repoName"
$repoExists = $false
gh repo view "me-chuan/$repoName" *> $null
if ($LASTEXITCODE -eq 0) { $repoExists = $true }

if ($repoExists) {
    Write-Warn2 "仓库已存在，跳过创建"
} else {
    gh repo create $repoName --public --description "Personal homepage" --source . --remote origin
    if ($LASTEXITCODE -ne 0) { throw "创建仓库失败" }
    Write-Ok "仓库已创建: https://github.com/me-chuan/$repoName"
}

# --- 3. 推送 -----------------------------------------------------------------
Write-Step "推送到 main 分支"
git branch -M main 2>$null
git add -A
git commit -m "chore: 更新站点内容" 2>$null   # 没有改动时忽略失败
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw "推送失败" }
Write-Ok "已推送"

# --- 4. 开启 Pages -----------------------------------------------------------
Write-Step "配置 GitHub Pages（Source = GitHub Actions）"
$pagesJson = gh api "repos/me-chuan/$repoName/pages" 2>$null
if ($LASTEXITCODE -ne 0) {
    '{"build_type":"workflow"}' | gh api "repos/me-chuan/$repoName/pages" -X POST --input -
    Write-Ok "Pages 已创建，Source = GitHub Actions"
} else {
    Write-Warn2 "Pages 配置已存在，请到 Settings → Pages 确认 Source 为 GitHub Actions"
}

# --- 5. 等待构建 -------------------------------------------------------------
Write-Step "等待 GitHub Actions 构建部署"
Write-Host "    可在此查看进度： https://github.com/me-chuan/$repoName/actions"
$deadline = (Get-Date).AddMinutes(10)
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 15
    $runs = gh run list --repo "me-chuan/$repoName" --limit 1 --json status,conclusion,workflowName 2>$null | ConvertFrom-Json
    if ($runs -and $runs[0].workflowName -like '*Deploy*') {
        $s = $runs[0].status
        $c = $runs[0].conclusion
        Write-Host "    状态: $s / $c"
        if ($s -eq 'completed') {
            if ($c -eq 'success') { Write-Ok "部署成功！" } else { Write-Warn2 "部署未成功，请查看 Actions 日志" }
            break
        }
    }
}

Write-Host "`n完成。站点地址： https://me-chuan.github.io" -ForegroundColor Green
