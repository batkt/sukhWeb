import _ from "lodash";

const toonNershil = ["", "мянга", "сая", "тэрбум", "их наяд"];

function formatNumberNershil(num: number, fixed: number = 0): string | number {
  if (num === 0) return 0;

  const nariivchlal = Math.floor(Math.log10(Math.abs(num)) / 3);

  if (nariivchlal === 0) return num;

  const suffix = toonNershil[nariivchlal] ?? "";
  const scale = Math.pow(10, nariivchlal * 3);

  const scaled = num / scale;

  return scaled.toFixed(fixed > 0 ? fixed : 1) + suffix;
}

export default formatNumberNershil;
