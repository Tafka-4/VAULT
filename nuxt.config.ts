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
			],
			link: [
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
