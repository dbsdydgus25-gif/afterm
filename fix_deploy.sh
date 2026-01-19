#!/bin/bash
set -e

echo "🛠️ 파일명 수정 및 배포 복구 중..."

# 1. 파일명 변경 (한글 -> 영문)
# 파일이 있는지 확인 후 이동
if [ -f "public/제목을 입력해주세요..icon.jpg" ]; then
    mv "public/제목을 입력해주세요..icon.jpg" "public/logo.jpg"
    echo "✅ 파일명 변경 완료: logo.jpg"
else
    echo "ℹ️  이미 파일명이 변경되었거나 파일이 없습니다."
fi

# 2. 변경사항 깃허브에 올리기
git add .
git commit -m "Fix: Rename logo file to ASCII for Vercel deployment" || echo "커밋할 변경사항이 없습니다."
git push

echo "🚀 수정 완료! Vercel에서 자동으로 다시 배포가 시작될 거예요."
