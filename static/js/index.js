document.addEventListener("DOMContentLoaded", function () {
    const fadeElements = document.querySelectorAll(".info-box");

    function checkVisibility() {
      fadeElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.85) {
          el.classList.add("visible");
        }
      });
    }

    window.addEventListener("scroll", checkVisibility);
    checkVisibility();
  });
