import _ from "lodash";

function formatNumber(num: number | string, fixed = 2): string {
  const parsed = Number(num);

  if (_.isNaN(parsed)) {
    return (0).toFixed(fixed);
  }

  const fixedNum = parsed.toFixed(fixed);

  if (Number(fixedNum) === 0) {
    return (0).toFixed(fixed);
  }

  const [intPart, decimalPart] = fixedNum.split(".");

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return fixed === 0 ? formattedInt : `${formattedInt}.${decimalPart}`;
}

export default formatNumber;
