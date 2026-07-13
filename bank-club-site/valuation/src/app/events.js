export function bindInputEvents(inputs, handler) {
  inputs.filter(Boolean).forEach((input) => {
    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });
}

export function bindClick(button, handler) {
  if (!button) return;
  button.addEventListener("click", handler);
}
