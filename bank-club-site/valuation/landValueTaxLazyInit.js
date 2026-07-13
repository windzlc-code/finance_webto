let landValueTaxModulePromise = null;

function initLandValueTax() {
  if (!document.getElementById("landValueTaxRoot")) return null;
  if (!landValueTaxModulePromise) {
    landValueTaxModulePromise = import("./landValueTaxApp.js?v=20260625-multi-upload-land-tax-sync");
  }
  return landValueTaxModulePromise;
}

document.getElementById("tabLandValueTax")?.addEventListener("click", () => {
  initLandValueTax()?.catch((error) => console.error("土地增值稅試算載入失敗", error));
});

if (document.querySelector("#landValueTaxTab.active")) {
  initLandValueTax()?.catch((error) => console.error("土地增值稅試算載入失敗", error));
}

window.initLandValueTaxApp = initLandValueTax;
