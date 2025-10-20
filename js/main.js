document.addEventListener("DOMContentLoaded", () => {
  const kidsGrid = document.getElementById("kidsGrid");
  const toggleBtn = document.getElementById("toggleKids");
  const modal = document.getElementById("modal");
  const modalClose = document.getElementById("modalClose");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const modalForm = document.getElementById("modalForm");
  const kidNameInput = document.getElementById("kidName");
  const kidWishlistInput = document.getElementById("kidWishlist");
  const modalStatus = document.getElementById("modalStatus");

  // Sample data - replace this array with your real data or fetch call
  const kids = [
    { name: "Liam, Age 7", wishlist: "Lego sets, warm clothes, drawing supplies" },
    { name: "Ava, Age 9", wishlist: "Dolls, art supplies, boots" },
    { name: "Noah, Age 6", wishlist: "Toy cars, puzzles, story books" },
    { name: "Emma, Age 10", wishlist: "Board games, jacket, sneakers" },
    { name: "Ethan, Age 8", wishlist: "Action figures, backpack, gloves" },
    { name: "Olivia, Age 5", wishlist: "Stuffed animals, coloring books" },
  ];

  // Populate kids grid
  kids.forEach((kid) => {
    const card = document.createElement("div");
    card.className = "kid-card";
    card.innerHTML = `
      <h3>${kid.name}</h3>
      <p><strong>Wishlist:</strong> ${kid.wishlist}</p>
      <button class="donate-btn kid-donate" data-name="${kid.name}" data-wishlist="${kid.wishlist}">Donate</button>
    `;
    kidsGrid.appendChild(card);
  });

  // Show All toggle
  let expanded = false;
  const updateGridView = () => {
    if (expanded) {
      kidsGrid.classList.remove("collapsed");
      toggleBtn.textContent = "Show Less";
    } else {
      kidsGrid.classList.add("collapsed");
      toggleBtn.textContent = "Show All";
    }
  };

  toggleBtn.addEventListener("click", () => {
    expanded = !expanded;
    updateGridView();
  });

  updateGridView(); // initial state

  // Handle modal open from Donate or Contact buttons
  const openModal = (title, desc, kidName = "", kidWishlist = "") => {
    modal.style.display = "flex";
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    kidNameInput.value = kidName;
    kidWishlistInput.value = kidWishlist;
  };

  // Universal modal openers
  document.querySelectorAll(".nav-donate, .donate-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const kidName = btn.getAttribute("data-name");
      const kidWishlist = btn.getAttribute("data-wishlist");
      if (kidName) {
        openModal(`Donate for ${kidName}`, `Wishlist: ${kidWishlist}`, kidName, kidWishlist);
      } else if (btn.textContent.toLowerCase().includes("contact")) {
        openModal("Contact Us", "Please fill out the form below to get in touch.");
      } else {
        openModal("Donate to Christmas at Carl’s", "Your generosity helps families in need.");
      }
    });
  });

  // Close modal
  modalClose.addEventListener("click", () => {
    modal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Handle form submission (Formspree)
  modalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    modalStatus.textContent = "Submitting...";
    const formData = new FormData(modalForm);

    try {
      const response = await fetch("https://formspree.io/f/movklbol", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        modalStatus.textContent = "Thank you! Your message has been sent.";
        modalForm.reset();
      } else {
        modalStatus.textContent = "Oops! Something went wrong. Please try again.";
      }
    } catch (err) {
      modalStatus.textContent = "Error connecting to server.";
    }
  });

  // Handle bottom contact form
  const bottomForm = document.getElementById("bottomContactForm");
  if (bottomForm) {
    bottomForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(bottomForm);
      try {
        await fetch("https://formspree.io/f/movklbol", {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });
        alert("Your message has been sent. Thank you!");
        bottomForm.reset();
      } catch (err) {
        alert("There was a problem submitting your message.");
      }
    });
  }
});
