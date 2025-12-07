// Filter buttons
const filterButtons = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".card");

// click on category button
filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        // active style on button
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const type = btn.getAttribute("data-type");

        cards.forEach((card) => {
            const cardType = card.getAttribute("data-type");

            if (type === "all" || type === cardType) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    });
});

// simple search by name
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
    const text = searchInput.value.toLowerCase();

    cards.forEach((card) => {
        const title = card.querySelector("h3").textContent.toLowerCase();
        card.style.display = title.includes(text) ? "flex" : "none";
    });
});
