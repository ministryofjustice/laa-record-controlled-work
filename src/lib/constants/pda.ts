// Carries the current session's LAA_ACCOUNTS office codes to the MSW PDA
// mock (msw/handlers/pda.ts) so mocked offices align with the real Entra
// user's claims. Only sent when PDA is in msw mode.
export const PDA_MSW_LAA_ACCOUNTS_HEADER = "x-pda-msw-laa-accounts";
