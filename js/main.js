@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Playfair+Display:wght@400;700&display=swap');

:root {
  --color-primary: #C62828; /* primary red */
  --color-secondary: #2E7D32; /* green */
  --color-bg: #FFF9F4; /* cream */
  --color-accent: #FFD700; /* gold */
  --text: #222;
  --muted: #666;
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  --font-display: "Playfair Display", Georgia, serif;
  --radius: 10px;
  --container-max: 1100px;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--font-sans);
  color: var(--text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.container {
  padding-left: 10px;
  padding-right: 20px;
}

/* Header */
.site-header {
  background: var(--color-primary);
  border-bottom: 1px solid rgba(0,0,0,0.1);
  position: relative;
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100px;
  gap: 40px;
}
.logo { height: 80px; width: auto; }
.nav {
  display: flex;
  gap: 40px;
  align-items: center;
}
.nav-link {
  text-decoration: none;
  color: #fff;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 20px;
  background: none;
  border: none;
  cursor: pointer;
}
.nav-link:hover { background: rgba(255,255,255,0.15); }

/* Hamburger menu for mobile */
.hamburger {
  display: none;
  flex-direction: column;
  cursor: pointer;
  gap: 6px;
}
.hamburger span {
  display: block;
  width: 28px;
  height: 3px;
  background: #fff;
  border-radius: 2px;
}

/* Hero */
.hero {
  position: relative;
  background-image: url('../assets/images/Hero-Image.png');
  background-size: cover;
  background-position: center;
  min-height: 520px;
}
.hero-overlay {
  position: absolute;
  left: 4%;
  top: 18%;
  width: 46%;
  background: rgba(6, 100, 30, 0.55);
  color: #fff;
  padding: 40px 48px;
  border-radius: 14px;
  backdrop-filter: blur(2px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
}
.hero-overlay h1 {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(32px, 5vw, 56px);
  line-height: 1.02;
  margin: 0 0 14px;
  color: #f8fbf8;
  text-shadow: 0 1px 0 rgba(0,0,0,0.12);
}
.hero-overlay .lead {
  font-family: var(--font-sans);
  font-size: 16px;
  margin: 0 0 22px;
  color: rgba(255,255,255,0.95);
}
.btn.donate-btn {
  display: inline-block;
  background: #d32f2f;
  color: #fff;
  padding: 10px 22px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 700;
  font-family: var(--font-sans);
  box-shadow: 0 6px 14px rgba(211,47,47,0.24);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.btn.donate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(211,47,47,0.28);
}

/* Section Headers – FULL WIDTH */
.section-header {
  background: var(--color-primary);
  text-align: center;
  padding: 20px 0;
  width: 100vw;
  position: relative;
  left: 50%;
  margin-left: -50vw;
  box-sizing: border-box;
}
.section-header h2 {
  color: #fdf6e3;
  font-size: 2rem;
  margin: 0;
  font-weight: 700;
  font-family: var(--font-display);
}

/* Kids, About, Events, Get Involved remain unchanged (see previous CSS) */

/* Responsive Navigation */
@media (max-width: 900px) {
  .nav {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--color-primary);
    width: 200px;
    padding: 20px;
    gap: 12px;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  .nav.show {
    display: flex;
  }
  .hamburger {
    display: flex;
  }
}
@media (max-width: 768px) {
  .hero-overlay {
    position: relative;
    left: auto;
    top: auto;
    width: calc(100% - 48px);
    margin: 30px auto;
    padding: 28px;
  }
  .hero { padding-bottom: 28px; min-height: 380px; }
  .hero-overlay h1 { font-size: 28px; text-align: center; }
  .hero-overlay .lead { text-align: center; }
  .btn.donate-btn { display: block; margin: 18px auto 0; }
}
