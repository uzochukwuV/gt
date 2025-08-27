export const toMainUnit = (amount: bigint, decimals: number) => {
  const B_DECIMALS = BigInt(decimals);
  const B_ONE_UNIT = BigInt(10) ** B_DECIMALS;
  const { quotient, remainder } = divmod(amount, B_ONE_UNIT);
  return Number(quotient) + Number(remainder) / Number(B_ONE_UNIT);
};

export const toBaseUnits = (amount: number, decimals: number) => {
  const B_DECIMALS = BigInt(decimals);
  const B_ONE_UNIT = BigInt(10) ** B_DECIMALS;
  return BigInt(amount) * B_ONE_UNIT;
};

const divmod = (a: bigint, b: bigint) => {
  const quotient = a / b;
  const remainder = a % b;
  return { quotient, remainder };
};
