const DELAY_MINUTES = 10;

export function calculateTimeBuffer(principal: bigint, fixedAnnualRatePPM: number): bigint {
  const principalInDeuro = Number(principal) / 1e18;
  const annualInterest = (principalInDeuro * fixedAnnualRatePPM) / 1_000_000;
  const interestPerSecond = annualInterest / (365 * 24 * 60 * 60);
  return BigInt(Math.ceil(interestPerSecond * DELAY_MINUTES * 60 * 1e18));
}

export function calculateOptimalRepayAmount(params: {
  userInputAmount: bigint;
  currentInterest: bigint;
  walletBalance: bigint;
  reserveContribution: bigint;
  principal: bigint;
  fixedAnnualRatePPM: number;
}): bigint {
  const { userInputAmount, currentInterest, walletBalance, reserveContribution, principal, fixedAnnualRatePPM } = params;

  const timeBufferWei = calculateTimeBuffer(principal, fixedAnnualRatePPM);
  const maxFromWallet = walletBalance > timeBufferWei ? walletBalance - timeBufferWei : 0n;
  const targetUsageFromWallet = userInputAmount < maxFromWallet ? userInputAmount : maxFromWallet;

  if (targetUsageFromWallet <= currentInterest) {
    return targetUsageFromWallet;
  }

  const reserveRate = Number(reserveContribution) / 1_000_000;
  const netPrincipalFromWallet = targetUsageFromWallet - currentInterest;
  const grossPrincipal = BigInt(Math.floor(Number(netPrincipalFromWallet) / (1 - reserveRate)));
  
  return currentInterest + grossPrincipal;
}