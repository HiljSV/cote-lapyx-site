import './header.scss'

// -------------------------------------------------------------------------------------------------
// Theme toggle — day / night
// -------------------------------------------------------------------------------------------------
const themeToggle = document.querySelector('[data-theme-toggle]');

function applyTheme(theme) {
	document.documentElement.setAttribute('data-theme', theme);
	localStorage.setItem('theme', theme);
}

// Відновлення збереженої теми при завантаженні
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

themeToggle?.addEventListener('click', () => {
	const current = document.documentElement.getAttribute('data-theme');
	applyTheme(current === 'dark' ? 'light' : 'dark');
});

// -------------------------------------------------------------------------------------------------
// Header scroll — додаємо клас .header--scrolled після прокрутки
// -------------------------------------------------------------------------------------------------
const header = document.querySelector('[data-fls-header]');

function updateHeaderScroll() {
	if (!header) return;
	if (window.scrollY > 40) {
		header.classList.add('header--scrolled');
	} else {
		header.classList.remove('header--scrolled');
	}
}

window.addEventListener('scroll', updateHeaderScroll, { passive: true });
updateHeaderScroll(); // перевірка при завантаженні (наприклад, якщо сторінка вже прокручена)

// -------------------------------------------------------------------------------------------------
// Burger menu — мобільна навігація
// -------------------------------------------------------------------------------------------------
const burger = document.querySelector('[data-fls-burger]');
const nav = document.querySelector('#header-nav');
const overlay = document.querySelector('.header__overlay');

function openMenu() {
	burger?.setAttribute('aria-expanded', 'true');
	burger?.classList.add('is-active');
	nav?.classList.add('is-open');
	overlay?.classList.add('is-visible');
	document.body.setAttribute('data-fls-scrolllock', '');
}

function closeMenu() {
	burger?.setAttribute('aria-expanded', 'false');
	burger?.classList.remove('is-active');
	nav?.classList.remove('is-open');
	overlay?.classList.remove('is-visible');
	document.body.removeAttribute('data-fls-scrolllock');
}

burger?.addEventListener('click', () => {
	const isOpen = burger.getAttribute('aria-expanded') === 'true';
	isOpen ? closeMenu() : openMenu();
});

overlay?.addEventListener('click', closeMenu);

// Закриваємо по Escape
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') closeMenu();
});

// Закриваємо при кліку на посилання у мобільному меню
nav?.querySelectorAll('.header__nav-link').forEach((link) => {
	link.addEventListener('click', closeMenu);
});

// -------------------------------------------------------------------------------------------------
// Language switcher
// -------------------------------------------------------------------------------------------------
const langBtns = document.querySelectorAll('[data-lang]');

langBtns.forEach((btn) => {
	btn.addEventListener('click', () => {
		langBtns.forEach((b) => {
			b.classList.remove('header__lang-btn--active');
			b.setAttribute('aria-pressed', 'false');
		});
		btn.classList.add('header__lang-btn--active');
		btn.setAttribute('aria-pressed', 'true');
		// TODO: підключити i18n логіку
	});
});
