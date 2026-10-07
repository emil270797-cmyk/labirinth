// Инициализируем приложение в клиенте ВКонтакте
// Инициализируем приложение
vkBridge.send('VKWebAppInit');

// Отключаем системный жест свайпа "назад" (закрытие приложения)
vkBridge.send('VKWebAppSetSwipeSettings', { history: false });

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// ... дальше идет остальной код ...

// ... дальше идет весь твой остальной код ...

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
    // Настраиваем шрифт для эмодзи
    ctx.font = '28px Arial'; 
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    for (let row = 0; row < levelMap.length; row++) {
        for (let col = 0; col < levelMap[row].length; col++) {
            let tile = levelMap[row][col];
            let x = col * TILE_SIZE;
            let y = row * TILE_SIZE;
            let centerX = x + TILE_SIZE / 2;
            let centerY = y + TILE_SIZE / 2;

            // Сначала всегда рисуем красивый светлый пол
            ctx.fillStyle = '#fdf3e7'; 
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            
            // Легкая сетка плитки на полу
            ctx.strokeStyle = 'rgba(0,0,0,0.05)';
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

            // Отрисовываем объекты поверх пола
            switch (tile) {
                case TILE_TYPES.MAASDAM:
                    ctx.fillText('🧀', centerX, centerY);
                    break;
                case TILE_TYPES.PARMESAN:
                    // Пармезан сделаем в виде кирпичной стены, так как он твердый
                    ctx.fillText('🧱', centerX, centerY); 
                    break;
                case TILE_TYPES.CHEESE_COIN:
                    // Светящийся эффект под монетой
                    ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillText('⭐', centerX, centerY);
                    break;
                case TILE_TYPES.GOAL:
                    ctx.fillText('🏆', centerX, centerY);
                    break;
            }
        }
    }
}

function drawPlayer() {
    let centerX = player.col * TILE_SIZE + TILE_SIZE / 2;
    let centerY = player.row * TILE_SIZE + TILE_SIZE / 2;
    
    // Тень под мышью
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.arc(centerX, centerY + 8, 10, 0, Math.PI * 2);
    ctx.fill();

    // Сама мышь
    ctx.font = '30px Arial';
    ctx.fillText('🐁', centerX, centerY);
}

function drawUI() {
    let uiY = levelMap.length * TILE_SIZE;

    // Темная нижняя панель
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, uiY, canvas.width, 50);

    // Текст
    ctx.fillStyle = '#ecf0f1';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Энергия:', 15, uiY + 31);

    // Фон полоски энергии (скругленный)
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.roundRect(95, uiY + 15, 200, 20, 10);
    ctx.fill();

    // Сама энергия с плавным изменением цвета
    let energyWidth = (Math.max(0, player.energy) / player.maxEnergy) * 200;
    
    // Создаем красивый градиент для шкалы
    let gradient = ctx.createLinearGradient(95, 0, 295, 0);
    if (player.energy > 40) {
        gradient.addColorStop(0, '#27ae60'); // Зеленый
        gradient.addColorStop(1, '#2ecc71');
    } else {
        gradient.addColorStop(0, '#c0392b'); // Красный, если мало энергии
        gradient.addColorStop(1, '#e74c3c');
    }

    if (energyWidth > 0) {
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(95, uiY + 15, energyWidth, 20, 10);
        ctx.fill();
    }

    // Экраны конца игры
    if (gameState !== 'playing') {
        ctx.fillStyle = 'rgba(44, 62, 80, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        
        if (gameState === 'won') {
            ctx.fillStyle = '#f1c40f';
            ctx.font = 'bold 36px sans-serif';
            ctx.fillText('Победа! 🎉', canvas.width / 2, canvas.height / 2 - 20);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.font = 'bold 36px sans-serif';
            ctx.fillText('Сил не осталось 💀', canvas.width / 2, canvas.height / 2 - 20);
        }
        
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#bdc3c7';
        ctx.fillText('Тапните или нажмите F5 для рестарта', canvas.width / 2, canvas.height / 2 + 30);
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
