export function createOfficialSearchRuntime({
  fetchApiJson,
  ensureOfficialCrypto,
  runOfficialSearch,
  runDeedSearch,
  setQueryProgress,
  setQueryProgressStage
}) {
  return {
    fetchApiJson,
    ensureOfficialCrypto,
    runOfficialSearch,
    runDeedSearch,
    setQueryProgress,
    setQueryProgressStage
  };
}
