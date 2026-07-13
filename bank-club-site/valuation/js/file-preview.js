(function () {
  function isPdfFile(file) {
    return !!file && (file.type === "application/pdf" || /\.pdf$/i.test(file.name));
  }

  function previewFile(file, target) {
    if (!target) return;
    if (!file) {
      target.innerHTML = '<div class="placeholder">尚未選擇檔案</div>';
      return;
    }
    const url = URL.createObjectURL(file);
    target.innerHTML = isPdfFile(file)
      ? `<iframe src="${url}" title="PDF 預覽"></iframe>`
      : `<img src="${url}" alt="影本預覽" />`;
  }

  window.FilePreview = { isPdfFile, previewFile };
})();
