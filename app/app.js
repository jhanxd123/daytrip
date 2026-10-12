import { cars } from "./cars.js";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const carList = document.querySelector("#car-list");
const template = document.querySelector("#car-template");
const dialog = document.querySelector("#car-dialog");

// Reuse the same dialog, replacing every field with the selected car's data.
function showCarDetails(car) {
  const image = document.querySelector("#detail-image");
  image.src = car.image;
  image.alt = `Illustration of ${car.name}`;
  document.querySelector(".detail-art").dataset.color = car.color;
  document.querySelector("#detail-category").textContent = car.category;
  document.querySelector("#detail-title").textContent = car.name;
  document.querySelector("#detail-description").textContent = car.description;
  document.querySelector("#detail-seats").textContent = `${car.seats} people`;
  document.querySelector("#detail-transmission").textContent = car.transmission;
  document.querySelector("#detail-luggage").textContent = car.luggage;
  document.querySelector("#detail-price").textContent = currency.format(car.dailyPrice);
  // The native dialog handles modal focus, Escape, and returning focus on close.
  dialog.showModal();
  dialog.dispatchEvent(new Event("car-details-open"));
}

// The template defines structure; this loop fills it without constructing HTML strings.
for (const [index, car] of cars.entries()) {
  const card = template.content.cloneNode(true);
  const image = card.querySelector("img");
  image.src = car.image;
  image.alt = `Illustration of ${car.name}`;
  card.querySelector(".car-art").dataset.color = car.color;
  card.querySelector(".category-pill").textContent = car.category;
  card.querySelector(".car-index").textContent = `0${index + 1}`;
  card.querySelector(".car-tagline").textContent = car.tagline;
  card.querySelector("h3").textContent = car.name;
  card.querySelector(".car-summary").textContent = `${car.seats} seats · ${car.transmission}`;
  card.querySelector(".price strong").textContent = currency.format(car.dailyPrice);

  const button = card.querySelector("button");
  button.setAttribute("aria-label", `View details for ${car.name}`);
  button.addEventListener("click", () => showCarDetails(car));
  carList.append(card);
}

document.querySelector("#catalog-status").hidden = true;

// Visual enhancements load independently: the catalog and dialog do not depend on them.
import("./motion.js")
  .then(({ initMotion }) => initMotion())
  .catch(() => { /* The complete page remains usable if optional motion is unavailable. */ });
