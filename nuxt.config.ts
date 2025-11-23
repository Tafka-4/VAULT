// nuxt.config.ts
import { defineNuxtConfig } from "nuxt/config";
export default defineNuxtConfig({
	typescript: { strict: true },
	app: {
		head: {
			title: "VAULT — Cloud Storage",
			meta: [
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{ name: "application-name", content: "VAULT" },
				{ name: "apple-mobile-web-app-capable", content: "yes" },
				{ name: "apple-mobile-web-app-status-bar-style", content: "black" },
				{ name: "apple-mobile-web-app-title", content: "VAULT" },
				{ name: "mobile-web-app-capable", content: "yes" },
				{ name: "theme-color", content: "#09090b" },
			],
			link: [
				{ rel: "manifest", href: "/manifest.webmanifest" },
				{
					rel: "icon",
					type: "image/png",
					sizes: "192x192",
					href: "/icons/icon-192.png",
				},
				{
					rel: "icon",
					type: "image/png",
					sizes: "512x512",
					href: "/icons/icon-512.png",
				},
				{
					rel: "apple-touch-icon",
					sizes: "180x180",
					href: "/icons/apple-touch-icon.png",
				},
				{ rel: "preconnect", href: "https://fonts.googleapis.com" },
				{
					rel: "preconnect",
					href: "https://fonts.gstatic.com",
					crossorigin: "",
				},
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap",
				},
			],
		},
	},
	css: ["@/assets/css/tailwind.css"],
	postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {},
		},
	},
	nitro: { prerender: { routes: ["/"] } },
});
