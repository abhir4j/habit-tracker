let snakeInterval = null;
let isSnakeRunning = false;
let snakeBody = [];
let currentTarget = null;
let eatenBoxesCount = 0;

window.toggleSnakeGame = function() {
    if (isSnakeRunning) {
        stopSnakeGame();
    } else {
        startSnakeGame();
    }
};

function startSnakeGame() {
    const initialCompleted = document.querySelectorAll('.heatmap-cell[data-completed="true"]:not(.snake-eaten)');
    if (initialCompleted.length === 0) {
        alert("Add some completed habits on the heatmap first to play Snake!");
        return;
    }

    isSnakeRunning = true;
    eatenBoxesCount = 0;
    els.snakePlayIcon.classList.add('hidden');
    els.snakeStopIcon.classList.remove('hidden');
    els.snakeBtnText.textContent = 'Stop Snake (Eaten: 0)';

    snakeBody = [
        { col: 0, row: 3 },
        { col: 0, row: 2 },
        { col: 0, row: 1 },
        { col: 0, row: 0 }
    ];
    pickNextFoodTarget();

    snakeInterval = setInterval(snakeStep, 190);
}

function stopSnakeGame() {
    isSnakeRunning = false;
    if (snakeInterval) clearInterval(snakeInterval);
    snakeInterval = null;

    els.snakePlayIcon.classList.remove('hidden');
    els.snakeStopIcon.classList.add('hidden');
    els.snakeBtnText.textContent = 'Play Snake';

    renderHeatmap();
}

function pickNextFoodTarget() {
    const completedCells = Array.from(document.querySelectorAll('.heatmap-cell[data-completed="true"]:not(.snake-eaten)'));
    if (completedCells.length === 0) {
        if (snakeInterval) clearInterval(snakeInterval);
        snakeInterval = null;
        setTimeout(() => {
            stopSnakeGame();
        }, 500);
        return;
    }

    const randomIndex = Math.floor(Math.random() * completedCells.length);
    const cell = completedCells[randomIndex];
    const col = parseInt(cell.getAttribute('data-col'));
    const row = parseInt(cell.getAttribute('data-row'));
    currentTarget = { el: cell, col, row };
}

function snakeStep() {
    if (!currentTarget) {
        pickNextFoodTarget();
        if (!currentTarget) return;
    }

    const head = snakeBody[0];
    let nextCol = head.col;
    let nextRow = head.row;
    const colDiff = currentTarget.col - head.col;
    const rowDiff = currentTarget.row - head.row;

    if (colDiff !== 0 && rowDiff !== 0) {
        if (Math.random() < 0.5) {
            nextCol += Math.sign(colDiff);
        } else {
            nextRow += Math.sign(rowDiff);
        }
    } else if (colDiff !== 0) {
        nextCol += Math.sign(colDiff);
    } else if (rowDiff !== 0) {
        nextRow += Math.sign(rowDiff);
    }

    snakeBody.unshift({ col: nextCol, row: nextRow });

    while (snakeBody.length > 4) {
        snakeBody.pop();
    }

    const touchedCell = document.querySelector(`.heatmap-cell[data-col="${nextCol}"][data-row="${nextRow}"]`);
    if (touchedCell && touchedCell.getAttribute('data-completed') === 'true' && !touchedCell.classList.contains('snake-eaten')) {
        eatenBoxesCount++;
        els.snakeBtnText.textContent = `Stop Snake (Eaten: ${eatenBoxesCount})`;
        touchedCell.classList.add('snake-eaten');
        touchedCell.setAttribute('data-completed', 'false');

        touchedCell.classList.remove('bg-heat1', 'bg-heat2', 'bg-heat3', 'bg-heat4');
        touchedCell.classList.add('bg-heatEmpty');
        touchedCell.style.opacity = '0.25';

        if (currentTarget && currentTarget.el === touchedCell) {
            currentTarget = null;
            pickNextFoodTarget();
        }
    }

    drawSnake();
}

function drawSnake() {
    document.querySelectorAll('.snake-seg-0, .snake-seg-1, .snake-seg-2, .snake-seg-3').forEach(el => {
        el.classList.remove('snake-seg-0', 'snake-seg-1', 'snake-seg-2', 'snake-seg-3');
        if (el.classList.contains('snake-eaten')) {
            el.classList.remove('bg-heat1', 'bg-heat2', 'bg-heat3', 'bg-heat4');
            el.classList.add('bg-heatEmpty');
            el.style.opacity = '0.25';
        } else {
            el.style.opacity = '1';
        }
    });

    snakeBody.forEach((seg, index) => {
        const cell = document.querySelector(`.heatmap-cell[data-col="${seg.col}"][data-row="${seg.row}"]`);
        if (cell && index < 4) {
            cell.classList.add(`snake-seg-${index}`);
            cell.style.opacity = '1';
        }
    });
}
