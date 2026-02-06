#!/bin/bash

# URLs to check
URLS=("https://afterm.co.kr" "https://afterm.vercel.app")
KEYWORD="Digital Waste" # New text added in v0.2.0

echo "🔍 배포 상태 확인 중..."
echo "확인할 키워드: '$KEYWORD'"
echo "----------------------------------------"

for url in "${URLS[@]}"; do
    echo "Checking $url ..."
    if curl -s -L "$url" | grep -q "$KEYWORD"; then
        echo "✅ 배포 완료됨! ($url)"
        echo "사이트에 '$KEYWORD' 문구가 발견되었습니다."
    else
        echo "⏳ 아직 반영 안됨 ($url)"
    fi
    echo "----------------------------------------"
done

echo "💡 Tip: 대시보드가 안 보일 땐 이 스크립트로 확인하세요."
