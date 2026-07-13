(function () {
  function townhouseUnitPrice(totalPrice, landTransferArea) {
    const price = Number(totalPrice);
    const area = Number(landTransferArea);
    if (!Number.isFinite(price) || !Number.isFinite(area) || area <= 0) return null;
    return +(price / area).toFixed(3);
  }

  function estimateValue(totalArea, avgUnitPrice, avgParkingPrice = 0) {
    const area = Number(totalArea) || 0;
    const unit = Number(avgUnitPrice) || 0;
    const parking = Number(avgParkingPrice) || 0;
    return +(area * unit + parking).toFixed(3);
  }

  function parkingPricingInfo(parkingAreaPing) {
    const area = Math.max(0, Number(parkingAreaPing) || 0);
    if (area <= 0) return { count: 0, fullCount: 0, hasDiscountPart: false, priceMultiplier: 0 };
    if (area < 8) return { count: 1, fullCount: 0, hasDiscountPart: true, priceMultiplier: 0.7 };
    if (area < 15) return { count: 1, fullCount: 1, hasDiscountPart: false, priceMultiplier: 1 };
    const count = Math.ceil(area / 8);
    return { count, fullCount: count, hasDiscountPart: false, priceMultiplier: count };
  }

  window.Valuation = {
    townhouseUnitPrice,
    estimateValue,
    parkingPricingInfo
  };
})();
