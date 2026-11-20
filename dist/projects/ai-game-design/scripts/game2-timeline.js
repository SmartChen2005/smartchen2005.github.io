(() => {
  const snapshots = document.querySelectorAll("[data-snapshot]");

  function loadSnapshot(details) {
    const frame = details.querySelector("iframe[data-src]");
    if (frame && !frame.src) frame.src = frame.dataset.src;
  }

  snapshots.forEach((details) => {
    details.addEventListener("toggle", () => {
      if (details.open) loadSnapshot(details);
    });

    details.querySelector("[data-reload-snapshot]")?.addEventListener("click", () => {
      const frame = details.querySelector("iframe");
      loadSnapshot(details);
      if (frame.src) frame.src = frame.src;
    });

    if (details.open) loadSnapshot(details);
  });
})();
