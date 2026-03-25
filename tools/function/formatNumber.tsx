import _ from "lodash";

function formatNumber(num: number | string, fixed = 0): string {
  const parsed = Number(num);

  if (_.isNaN(parsed)) {
    return (0).toFixed(fixed);
  }

  const effectiveFixed = fixed === 0 && Math.abs(parsed) > 0 && Math.abs(parsed) < 1 ? 2 : fixed;

  const fixedNum = parsed.toFixed(effectiveFixed);

  if (Number(fixedNum) === 0) {
    return (0).toFixed(effectiveFixed);
  }

  const [intPart, decimalPart] = fixedNum.split(".");

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return effectiveFixed === 0 ? formattedInt : `${formattedInt}.${decimalPart}`;
}

/**
 * Base currency formatter — always 2 decimal places.
 * e.g. formatCurrency(13831460) => "13,831,460.00 "
 */
export function formatCurrency(num: number | string, symbol = ""): string {
  return `${formatNumber(num, 2)} ${symbol}`;
}

export default formatNumber;