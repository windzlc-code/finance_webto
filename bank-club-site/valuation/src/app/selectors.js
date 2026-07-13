export function selectedValues(nodeList) {
  return [...(nodeList || [])]
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);
}

export function selectedRadioValue(nodeList, fallback = "") {
  return [...(nodeList || [])].find((radio) => radio.checked)?.value || fallback;
}

export function setRadioValue(nodeList, value) {
  [...(nodeList || [])].forEach((radio) => {
    radio.checked = radio.value === value;
  });
}

export function setCheckboxValues(nodeList, values) {
  const wanted = new Set(Array.isArray(values) ? values : [values].filter(Boolean));
  [...(nodeList || [])].forEach((checkbox) => {
    checkbox.checked = wanted.has(checkbox.value);
  });
}
