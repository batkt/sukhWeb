const units = ["", "мянга", "сая", "тэрбум", "их наяд"];
const digits = [
  "тэг",
  "нэг",
  "хоёр",
  "гурван",
  "дөрөв",
  "тав",
  "зургаа",
  "долоо",
  "найм",
  "ес",
];

function formatNumberNershil(num: number): string {
  if (!num) return "тэг";

  let result = "";
  let n = Math.floor(num);

  const parts: string[] = [];

  let unitIndex = 0;
  while (n > 0) {
    const chunk = n % 1000;
    if (chunk > 0) {
      parts.unshift(`${chunkToWords(chunk)} ${units[unitIndex]}`.trim());
    }
    n = Math.floor(n / 1000);
    unitIndex++;
  }

  result = parts.join(" ");
  return result.trim();
}

function chunkToWords(num: number): string {
  const hundred = Math.floor(num / 100);
  const tenUnit = num % 100;
  let str = "";

  if (hundred > 0) {
    str += digits[hundred] + " зуун";
  }

  if (tenUnit > 0) {
    if (str) str += " ";
    if (tenUnit < 10) {
      str += digits[tenUnit];
    } else {
      const ten = Math.floor(tenUnit / 10);
      const unit = tenUnit % 10;
      if (ten > 0) str += digits[ten] + " арван";
      if (unit > 0) str += " " + digits[unit];
    }
  }

  return str.trim();
}

export default formatNumberNershil;
