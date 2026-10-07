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

# НЭГ Л ЗЭРЭГ АЖИЛЛАНА.
#
# Бэкенд дэх «аль хэдийн ажиллаж байна» хамгаалалт нь тухайн процессын
# САНАХ ОЙД (tuluvuud) сууддаг. Бэкенд ДАХИН АСАХАД тэр санах ой
# цэвэрлэгдэнэ — ГЭВЧ түүний асаасан bash/next build нь үхэхгүй, init
# рүү өвлөгдөөд ҮРГЭЛЖЛҮҮЛЭН ажиллана. Дараагийн хүсэлт хоосон
# хамгаалалтыг хараад ХОЁР ДАХЬ build-ыг зэрэг эхлүүлнэ. Гараас
# ажиллуулсан скрипт ч самбараас эхэлсэнтэй мөн адил мөргөлдөнө.
# Хоёр build зэрэг явбал:
#   • хоёулаа нэг $SHINE_DIR рүү бичнэ,
#   • нэг нь нөгөөгийнхөө хагас бэлэн хавтсыг rm -rf хийнэ,
#   • хоёулаа .next-ийг зөөхөөр оролдоно.
# Файлын түгжээ нь процессоос ҮЛ ХАМААРНА. Скрипт дуусахад fd хаагдаж
# түгжээ өөрөө суллагдана — гацсан түгжээ үлдэхгүй.
TUGJEENII_ZAM="/tmp/shinechlelt-${PM2_NER}.lock"
exec 9>"$TUGJEENII_ZAM"
if ! flock -n 9; then
  echo "⛔ ${PM2_NER}: өөр шинэчлэлт аль хэдийн ажиллаж байна." >&2
  exit 1
fi

cd "$APP_ZAM"
echo "→ Хавтас: $APP_ZAM (pm2: $PM2_NER)"

echo "→ git pull"
git pull

# ЗААВАЛ --include=dev. next build нь typescript, @types/*, tailwindcss,
# @tailwindcss/postcss зэргийг ШААРДДАГ атлаа эдгээр нь package.json-ий
# devDependencies дотор байдаг. Энэ скриптийг самбараас ажиллуулахад
# pm2 -> sukhBackv2 -> exec() гинжээр NODE_ENV=production өвлөгдөж, npm
# нь dev багцуудыг алгасдаг. Улмаар build нь
#     Error: Cannot find module '@tailwindcss/postcss'
# гэж унана. Гараас ажиллуулахад NODE_ENV хоосон тул ХЭВИЙН болдог нь
# оношлоход төөрөгдүүлдэг — иймд орчноос ХАМААРУУЛАХГҮЙ шууд зааж өгнө.
echo "→ npm i --include=dev"
npm i --include=dev

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

# --update-env-ийг ХЭРЭГЛЭХГҮЙ.
#
# Энэ скриптийг самбараас ажиллуулахад гинж нь:
#     pm2 -> sukhBackv2 -> exec() -> bash
# тул БЭКЕНДИЙН орчин бүхэлдээ өвлөгддөг — түүний дотор PORT нь
# бэкендийн порт (8081). `--update-env` нь яг тэр орчныг фронт дээр
# ХУУЛЖ тавьдаг учир `next start` нь 3005 биш 8081 дээр сонсохыг
# оролдож, бэкендтэйгээ мөргөлдөн EADDRINUSE-аар давтан унана.
# Сайт 3005 дээр хоосон үлдэж, nginx 502 буцаана — хэрэглэгчид
# «Шинэчилж байна» хуудас ТАСРАЛТГҮЙ харагдана.
#
# Үүнгүйгээр pm2 нь процессынхоо АНХ бүртгэгдсэн орчныг хэвээр
# ашиглана — порт нь зөв хэвээр үлдэнэ.
echo "→ pm2 restart $PM2_NER"
pm2 restart "$PM2_NER"

echo "✅ Дууслаа"
