export default function updateStats(canvas, stats) {
    const THICKNESS = 35;
    // Start graph from lowest guesses
    let start = 0;
    while (stats[start] === 0) {
        start++;
        // Start from 18 no matter what
        if (start === 18) {
            break;
        }
    }
    // Find score with highest frequency
    let max = 0;
    for (let i = start; i < stats.length; i++) {
        max = Math.max(max, stats[i]);
    }
    // Fix to prevent canvas from looking blurry on Retina displays
    canvas.width = 300 * window.devicePixelRatio;
    canvas.height = THICKNESS * (stats.length - start) * window.devicePixelRatio;
    const ctx = document.getElementById('graph').getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    // Render graph
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = 'larger Rubik';
    let y = 0;
    for (let i = start; i < stats.length; i++) {
        ctx.fillText(i === stats.length - 1 ? 'X' : i, 0, y + 25);
        let value = stats[i] / max * (canvas.width / 2 - THICKNESS);
        if (isNaN(value) || value < THICKNESS) {
            value = THICKNESS;
        }
        ctx.fillRect(THICKNESS, y + 5, value, THICKNESS - 10);
        ctx.fillStyle = 'black';
        const offset = 10 * (String(stats[i]).length - 1);
        ctx.fillText(stats[i], value + 15 - offset, y + 25);
        ctx.fillStyle = 'white';
        y += THICKNESS;
    }
}
