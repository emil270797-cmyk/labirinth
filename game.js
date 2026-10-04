const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 40;

const TILE_TYPES = {
    EMPTY: 0,
    MAASDAM: 1,      // Мягкий сыр (-10 энергии)
    PARMESAN: 2,     // Твердый сыр (-30 энергии)
    CHEESE_COIN: 3,  // Бонус (+20 энергии)
    GOAL: 9
};

const levelMap = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 3, 2, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 2, 0, 0, 1],
    [1, 1, 1, 2, 1, 1, 1, 0, 1, 1],
    [1, 3, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 2, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 2, 0, 1, 1, 9, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Динамически подстраиваем размер холста (+50px снизу для интерфейса)
canvas.width = levelMap[0].length * TILE_SIZE;
canvas.height = levelMap.length * TILE_SIZE + 50; 

const player = {
    row: 1,
    col: 1,
    color: '#8e44ad',
    energy: 100,
    maxEnergy: 100
};

let gameState = 'playing'; // 'playing', 'won', 'lost'

function drawMap() {
    for (let row = 0; row < levelMap.length; row++) {
        for (let col = 0; col < levelMap[row].length; col++) {
            let tile = levelMap[row][col];
            let x = col * TILE_SIZE;
            let y = row * TILE_SIZE;

            switch (tile) {
                case TILE_TYPES.EMPTY: ctx.fillStyle = '#fafad2'; break;
                case TILE_TYPES.MAASDAM: ctx.fillStyle = '#f1c40f'; break;
                case TILE_TYPES.PARMESAN: ctx.fillStyle = '#e67e22'; break;
                case TILE_TYPES.CHEESE_COIN:
                    ctx.fillStyle = '#fafad2';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#f39c12';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 5, 0, Math.PI * 2);
                    ctx.fill();
                    continue;
                case TILE_TYPES.GOAL:
                    ctx.fillStyle = '#fafad2';
                    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, 15, 0, Math.PI * 2);
                    ctx.fill();
                    continue;
            }
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#e1b12c';
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        }
    }
}

function drawPlayer() {
    let px = player.col * TILE_SIZE;
    let py = player.row * TILE_SIZE;
    
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE/2, py + TILE_SIZE/2, 12, 0, Math.PI * 2);
    ctx.fill();
}

function drawUI() {
    let uiY = levelMap.length * TILE_SIZE;

    ctx.fillStyle = '#222';
    ctx.fillRect(0, uiY, canvas.width, 50);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Энергия:', 15, uiY + 32);

    ctx.strokeStyle = '#fff';
    ctx.strokeRect(90, uiY + 15, 200, 20);

    let energyWidth = (Math.max(0, player.energy) / player.maxEnergy) * 200;
    ctx.fillStyle = player.energy > 30 ? '#2ecc71' : '#e74c3c';
    ctx.fillRect(90, uiY + 15, energyWidth, 20);

    if (gameState !== 'playing') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = gameState === 'won' ? '#f1c40f' : '#e74c3c';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        let msg = gameState === 'won' ? 'Сыр найден!' : 'Энергия иссякла!';
        ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('Обновите страницу для рестарта', canvas.width / 2, canvas.height / 2 + 40);
        ctx.textAlign = 'left';
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    drawPlayer();
    drawUI();
}

function movePlayer(dRow, dCol) {
    if (gameState !== 'playing') return; 

    const newRow = player.row + dRow;
    const newCol = player.col + dCol;

    if (newRow < 0 || newRow >= levelMap.length || newCol < 0 || newCol >= levelMap[0].length) return;

    const targetTile = levelMap[newRow][newCol];
    let energyCost = 0;

    if (targetTile === TILE_TYPES.MAASDAM) energyCost = 10;
    else if (targetTile === TILE_TYPES.PARMESAN) energyCost = 30;
    
    if (player.energy < energyCost) return;

    player.energy -= energyCost;

    if (energyCost > 0) {
        levelMap[newRow][newCol] = TILE_TYPES.EMPTY;
    }

    if (targetTile === TILE_TYPES.CHEESE_COIN) {
        player.energy = Math.min(player.maxEnergy, player.energy + 20);
        levelMap[newRow][newCol] = TILE_TYPES.EMPTY;
    } 
    else if (targetTile === TILE_TYPES.GOAL) {
        gameState = 'won';
    }

    player.row = newRow;
    player.col = newCol;

    if (player.energy <= 0 && gameState !== 'won') {
        gameState = 'lost';
    }

    draw();
}

// Управление с клавиатуры
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W': movePlayer(-1, 0); break;
        case 'ArrowDown':
        case 's':
        case 'S': movePlayer(1, 0); break;
        case 'ArrowLeft':
        case 'a':
        case 'A': movePlayer(0, -1); break;
        case 'ArrowRight':
        case 'd':
        case 'D': movePlayer(0, 1); break;
    }
});

// Управление свайпами
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 30;

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); 
}, { passive: false });

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
    if (gameState !== 'playing') return;

    let touchEndX = e.changedTouches[0].screenX;
    let touchEndY = e.changedTouches[0].screenY;

    let dx = touchEndX - touchStartX;
    let dy = touchEndY - touchStartY;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) movePlayer(0, 1);
        else movePlayer(0, -1);
    } else {
        if (dy > 0) movePlayer(1, 0);
        else movePlayer(-1, 0);
    }
});

draw();
