#!/bin/bash

# Error handling
set -e

echo "🚀 GitHub 업로드를 시작합니다..."

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "📦 Git 초기화 중..."
    git init
else
    echo "ℹ️  이미 Git이 초기화되어 있습니다."
fi

# Add all files
echo "📂 파일 추가 중..."
git add .

# Commit
echo "💾 커밋 생성 중..."
# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    echo "ℹ️  변경 사항이 없거나 이미 커밋되었습니다."
else
    git commit -m "Visit Afterm MVP: Publ style landing page & User flow"
fi

# Branch setup
echo "🌿 브랜치 설정 (main)..."
git branch -M main

# Remote setup
echo "🔗 원격 저장소 연결 중..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/dbsdydgus25-gif/afterm.git

# Push
echo "⬆️  GitHub로 푸시 중..."
git push -u origin main

echo "✅ 업로드가 완료되었습니다!"
