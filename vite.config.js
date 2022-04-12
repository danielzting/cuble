import { VitePWA } from 'vite-plugin-pwa';

export default {
    base: '/cuble/',
    plugins: [VitePWA({
        manifest: {
            "name": "Cuble",
            "short_name": "Cuble",
            "description": "The Wordle of Rubik's Cubes! Guess the scramble in as few tries as you can.",
            "icons": [
                {
                    "src": "https://raw.githubusercontent.com/DanielZTing/cuble/master/favicon.png",
                    "sizes": "512x512",
                    "type": "image/png"
                }
            ],
            "display": "standalone",
            "background_color": "black",
            "theme_color": "black"
        }
    })],
}
