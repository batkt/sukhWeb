#!/bin/bash
#
# ФРОНТЫН ШИНЭЧЛЭЛТ — ажиллаж байгаа сайтыг ЭВДЭХГҮЙГЭЭР.
#
# АСУУДАЛ: `npm run build` нь анхдагчаар `.next` рүү бичдэг. Гэтэл
# `next start` нь ЯГ ТЭР хавтаснаас түгээж байдаг. Build явж байх хооронд
# хэрэглэгч орвол хагас бичигдсэн chunk, манифест таарч:
#     Application error: a client-side exception has occurred
# гэсэн алдаа гардаг. Сервер нь АСААЛТТАЙ учир nginx 502 буцаахгүй —
# улмаас «Шинэчилж байна» хуудас ч гарахгүй.
#
# ШИЙДЭЛ: ТУСДАА хавтсанд build хийнэ. Энэ хооронд хуучин `.next` бүрэн
# бүтэн хэвээр тул сайт ХЭВИЙН ажиллана. Build амжилттай болсны ДАРАА л
# хавтсуудыг солиод дахин асаана — зөвхөн тэр хэдэн секунд л тасарна,
# түүнийг nginx-ийн error_page (shinechlelt.html) хаана.
#
# Build УНАвал: хуучин `.next` хөндөгдөөгүй, сайт ажилласаар байна.
#
# Хэрэглээ (tokhirgoo.env дотор):
#   SHINECHLELT_FRONT_TUSHAAL=bash /root/devamarhome/devSukhWeb/deploy/shinechlelt-front.sh devSukhWeb
#
set -euo pipefail

PM2_NER="${1:?pm2 процессын нэрийг эхний аргумент болгон өгнө үү}"
APP_ZAM="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHINE_DIR=".next.build"

cd "$APP_ZAM"
echo "→ Хавтас: $APP_ZAM (pm2: $PM2_NER)"

echo "→ git pull"
git pull

echo "→ npm i"
npm i

# Өмнөх амжилтгүй оролдлогын үлдэгдлийг цэвэрлэнэ.
rm -rf "$SHINE_DIR"

echo "→ build → $SHINE_DIR (сайт энэ хооронд хэвийн)"
NEXT_DIST_DIR="$SHINE_DIR" npm run build

# Энд хүрсэн бол build АМЖИЛТТАЙ (`set -e` унагах байсан).
echo "→ солих"
rm -rf .next.khuuchin
if [ -d .next ]; then
  mv .next .next.khuuchin
fi
mv "$SHINE_DIR" .next

echo "→ pm2 restart $PM2_NER"
pm2 restart "$PM2_NER" --update-env

echo "✅ Дууслаа"
