/**
 * Swiper carousels. Each entry is only constructed when its container is
 * actually present on the page, so every page can share this one module.
 */

const SHARED_AUTOPLAY = { delay: 5000, disableOnInteraction: false };

const CAROUSELS = [
  {
    selector: ".servicesSwiper",
    options: {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
      autoplay: SHARED_AUTOPLAY,
      pagination: { el: ".swiper-pagination", clickable: true },
    },
  },
  {
    selector: ".testimonialsSwiper",
    options: {
      slidesPerView: 3,
      spaceBetween: 30,
      loop: true,
      autoplay: SHARED_AUTOPLAY,
      pagination: { el: ".swiper-pagination", clickable: true },
      navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
      breakpoints: {
        300: { slidesPerView: 1 },
        768: { slidesPerView: 2, spaceBetween: 20 },
        1200: { slidesPerView: 3, spaceBetween: 30 },
      },
    },
  },
  {
    selector: ".worksSwiper",
    options: {
      slidesPerView: 3,
      spaceBetween: 30,
      loop: false,
      pagination: { el: ".works-swiper-pagination", clickable: true },
      navigation: { nextEl: ".works-swiper-next", prevEl: ".works-swiper-prev" },
      breakpoints: {
        0: { slidesPerView: 1, spaceBetween: 20 },
        768: { slidesPerView: 2, spaceBetween: 25 },
        992: { slidesPerView: 3, spaceBetween: 30 },
      },
    },
  },
  {
    selector: ".articlesSwiper",
    options: {
      slidesPerView: 3,
      spaceBetween: 20,
      loop: true,
      autoplay: { delay: 4500, disableOnInteraction: false },
      pagination: { el: ".swiper-pagination", clickable: true },
      navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
      breakpoints: {
        300: { slidesPerView: 1 },
        768: { slidesPerView: 2, spaceBetween: 20 },
        1200: { slidesPerView: 3, spaceBetween: 30 },
      },
    },
  },
  {
    selector: ".logosSwiper",
    options: {
      slidesPerView: 2,
      spaceBetween: 30,
      loop: true,
      autoplay: { delay: 2000, disableOnInteraction: false },
      breakpoints: {
        576: { slidesPerView: 1, spaceBetween: 30 },
        768: { slidesPerView: 3, spaceBetween: 40 },
        992: { slidesPerView: 5, spaceBetween: 50 },
      },
    },
  },
];

export function initCarousels() {
  if (typeof window.Swiper === "undefined") return;

  for (const { selector, options } of CAROUSELS) {
    if (document.querySelector(selector)) {
      new window.Swiper(selector, options);
    }
  }
}
