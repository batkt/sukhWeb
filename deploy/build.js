#!/usr/bin/env node
/**
 * АЮУЛГҮЙ BUILD — ажиллаж байгаа сайтыг эвдэхгүй.
 *
 * АСУУДАЛ: `next build` нь анхдагчаар `.next` рүү бичдэг бөгөөд `next start`
 * нь ЯГ ТЭР хавтаснаас түгээдэг. Сервер асаалттай байхад шууд build хийвэл
 * ажиллаж буй процесс нь өөрийн хуучин BUILD_ID-гаар chunk/CSS замыг
 * зааварлаж байхад тэдгээр файлууд нь дарагдан алга болно. Үр дүнд нь
 * хуудас нь CSS, JS-гүйгээр гарч, ЗӨВХӨН «Уншиж байна...» гэсэн бичиг
 * үлддэг (ClientLayout-ийн нэвтрэлт шалгах давхарга — JS ачаалагдаагүй тул
 * хэзээ ч цааш явахгүй).
 *
 * ШИЙДЭЛ: ТУСДАА хавтсанд build хийгээд, АМЖИЛТТАЙ болсны дараа л солино.
 * Build унавал `.next` хөндөгдөөгүй тул сайт ажилласаар байна.
 *
 * ЯАГААД package.json-ы `build` ӨӨРӨӨ ийм вэ: сервер дээр хэн нэгэн зүгээр
 * `npm run build` гэж бичихэд аюулгүй байх ёстой. Санаж байж тусгай тушаал
 * бичих шаардлагатай бол эрт орой хэзээ нэгэн цагт мартагдана.
 *
 * ХЭРЭГЛЭЭ:
 *   npm run build            → .next.build рүү build хийгээд солино
 *   npm run build:shuud      → хуучин зан төлөв (шууд .next рүү)
 *
 * `NEXT_DIST_DIR` тохируулагдсан бол ДУУДАГЧ нь солилтыг өөрөө хариуцна
 * гэсэн үг (deploy/shinechlelt-front.sh яг ингэдэг) — тэр үед энэ скрипт
 * зөвхөн build хийгээд гарна.
 *
 * ЭНЭ СКРИПТ pm2-ыг ДАХИН АСААХГҮЙ. Солилт нь зөвхөн файл солих явдал
 * бөгөөд ажиллаж буй сервер нь хуучин BUILD_ID-гаа хэвээр барина — иймд
 * дахин асаах нь байрлуулалтын скриптийн (эсвэл хүний) шийдвэр хэвээр.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TUR_KHAVTAS = ".next.build";
const KHUUCHIN_KHAVTAS = ".next.khuuchin";
const UNDSEN_KHAVTAS = ".next";

const undesniiZam = path.resolve(__dirname, "..");

/** `next build`-ийг өгөгдсөн гаралтын хавтсаар ажиллуулна. */
function buildKhiiye(distDir) {
  const ur = spawnSync("npx", ["next", "build"], {
    cwd: undesniiZam,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...(distDir ? { NEXT_DIST_DIR: distDir } : {}) },
  });

  if (ur.error) {
    console.error(`❌ next build эхлүүлж чадсангүй: ${ur.error.message}`);
    process.exit(1);
  }
  if (ur.status !== 0) {
    // `.next` хөндөгдөөгүй тул сайт хэвээрээ. Түр хавтсыг дараагийн ажиллалт
    // өөрөө цэвэрлэнэ.
    console.error("\n❌ Build амжилтгүй — `.next` хөндөгдөөгүй, сайт хэвийн.");
    process.exit(ur.status === null ? 1 : ur.status);
  }
}

function ustgaya(khavtas) {
  fs.rmSync(path.join(undesniiZam, khavtas), { recursive: true, force: true });
}

function baikhEsekh(khavtas) {
  return fs.existsSync(path.join(undesniiZam, khavtas));
}

function zuuye(khaanaas, khaashaa) {
  fs.renameSync(
    path.join(undesniiZam, khaanaas),
    path.join(undesniiZam, khaashaa),
  );
}

function main() {
  // Дуудагч өөрөө гаралтын хавтсаа зааж өгсөн бол солилтыг ч өөрөө хийнэ.
  if (process.env.NEXT_DIST_DIR) {
    console.log(
      `→ build → ${process.env.NEXT_DIST_DIR} (солилтыг дуудагч хариуцна)`,
    );
    buildKhiiye(null);
    return;
  }

  console.log(`→ build → ${TUR_KHAVTAS} (сайт энэ хооронд хэвийн)`);

  // Өмнөх амжилтгүй оролдлогын үлдэгдлийг цэвэрлэнэ.
  ustgaya(TUR_KHAVTAS);
  buildKhiiye(TUR_KHAVTAS);

  // Энд хүрсэн бол build АМЖИЛТТАЙ.
  console.log("→ солих");
  ustgaya(KHUUCHIN_KHAVTAS);
  if (baikhEsekh(UNDSEN_KHAVTAS)) {
    zuuye(UNDSEN_KHAVTAS, KHUUCHIN_KHAVTAS);
  }
  zuuye(TUR_KHAVTAS, UNDSEN_KHAVTAS);

  console.log(
    `✅ Дууслаа. Өмнөх build нь ${KHUUCHIN_KHAVTAS} дотор (буцаах шаардлагатай бол).`,
  );
  console.log(
    "ℹ️  Ажиллаж буй сервер хуучин BUILD_ID-тай хэвээр — шинэ build-ыг",
  );
  console.log("   түгээхийн тулд `pm2 restart <нэр>` хийнэ.");
}

main();
