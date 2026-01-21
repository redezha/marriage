// Initial State
// Dictionary for translations
const TRANSLATIONS = {
    en: {
        title: "Marriage",
        addRound: "Add Round",
        history: "History",
        roundResults: "Round Results",
        cancel: "Cancel",
        save: "Save",
        resetConfirm: "Are you sure you want to start a new game? All scores will be reset.",
        defaultPlayer: "Player",
        newGameTitle: "New Game",
        edit: "Edit",
        delete: "Delete",
        addPlayer: "Add Player",
        confirmDeletePlayer: "Are you sure you want to remove this player?"
    },
    ru: {
        title: "Марьяж",
        addRound: "Добавить Раунд",
        history: "История",
        roundResults: "Результаты Раунда",
        cancel: "Отмена",
        save: "Сохранить",
        resetConfirm: "Вы уверены, что хотите начать новую игру? Все очки будут сброшены.",
        defaultPlayer: "Игрок",
        newGameTitle: "Новая игра",
        edit: "Редактировать",
        delete: "Удалить",
        addPlayer: "Добавить Игрока",
        confirmDeletePlayer: "Вы уверены, что хотите удалить этого игрока?"
    },
    es: {
        title: "Matrimonio",
        addRound: "Añadir Ronda",
        history: "Historial",
        roundResults: "Resultados",
        cancel: "Cancelar",
        save: "Guardar",
        resetConfirm: "¿Estás seguro de que quieres empezar un nuevo juego? Se restablecerán todas las puntuaciones.",
        defaultPlayer: "Jugador",
        newGameTitle: "Nuevo Juego",
        edit: "Editar",
        delete: "Eliminar",
        addPlayer: "Añadir Jugador",
        confirmDeletePlayer: "¿Estás seguro de que quieres eliminar a este jugador?"
    }
};

let currentLang = localStorage.getItem('mariage_lang') || 'en';

let players = JSON.parse(localStorage.getItem('mariage_players'));

// If no players saved, create defaults using current lang
if (!players) {
    const pName = TRANSLATIONS[currentLang].defaultPlayer;
    players = [
        { id: 1, name: `${pName} 1`, score: 0 },
        { id: 2, name: `${pName} 2`, score: 0 },
        { id: 3, name: `${pName} 3`, score: 0 }
    ];
}

let history = JSON.parse(localStorage.getItem('mariage_history')) || [];
let editingRoundIndex = -1;


// DOM Elements
const playersContainer = document.getElementById('players-container');
const historyTableHead = document.querySelector('#history-table thead tr');
const historyTableBody = document.querySelector('#history-table tbody');
const addRoundBtn = document.getElementById('add-round-btn');
const modal = document.getElementById('score-modal');
const modalInputs = document.getElementById('modal-inputs');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const addPlayerBtn = document.getElementById('add-player-btn');
const langBtns = document.querySelectorAll('.lang-btn');

// --- Localization Functions ---

function isDefaultName(name, index) {
    const id = index + 1;
    for (const langKey in TRANSLATIONS) {
        if (name === `${TRANSLATIONS[langKey].defaultPlayer} ${id}`) {
            return true;
        }
    }
    return false;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('mariage_lang', lang);

    // Update translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (TRANSLATIONS[lang][key]) {
            el.textContent = TRANSLATIONS[lang][key];
        }
    });

    // Update active button state
    langBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Update dynamic attributes
    resetBtn.title = TRANSLATIONS[lang].newGameTitle;
    addPlayerBtn.title = TRANSLATIONS[lang].addPlayer;
    document.title = TRANSLATIONS[lang].title;


    // Smartly update default player names
    let playersUpdated = false;
    players.forEach((p, index) => {
        if (isDefaultName(p.name, index)) {
            p.name = `${TRANSLATIONS[lang].defaultPlayer} ${index + 1}`;
            playersUpdated = true;
        }
    });

    if (playersUpdated) {
        saveState();
        renderPlayers();
    }
}

// --- Rendering Functions ---

function renderPlayers() {
    playersContainer.innerHTML = '';

    // Find leader score to highlight
    const scores = players.map(p => p.score);
    const maxScore = Math.max(...scores);

    players.forEach((player, index) => {
        const isLeader = player.score === maxScore && player.score !== 0; // Simple leader logic
        const card = document.createElement('div');
        card.className = `player-card ${isLeader ? 'leader' : ''}`;

        card.innerHTML = `
            <div class="player-card-header">
                <input type="text" class="player-name-input" value="${player.name}" data-index="${index}" onchange="updateName(${index}, this.value)">
                ${players.length > 2 ? `
                    <button class="remove-player-btn" onclick="removePlayer(${index})" title="${TRANSLATIONS[currentLang].delete}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                ` : ''}
            </div>
            <div class="player-score">${player.score}</div>
        `;
        playersContainer.appendChild(card);
    });

    updateHistoryHeader();
}

function renderHistory() {
    historyTableBody.innerHTML = '';

    history.forEach((round, roundIndex) => {
        const tr = document.createElement('tr');

        // Round Number
        let html = `<td>${roundIndex + 1}</td>`;

        // Player Scores in this round
        round.scores.forEach(score => {
            let arrow = '';
            if (score > 0) {
                arrow = `<span class="arrow up">↑</span>`;
            } else if (score < 0) {
                arrow = `<span class="arrow down">↓</span>`;
            }
            html += `<td>${score}${arrow}</td>`;
        });

        // Actions
        html += `
            <td class="history-actions">
                <div class="actions-container">
                    <button class="action-btn edit" onclick="editRound(${roundIndex})" title="${TRANSLATIONS[currentLang].edit}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="action-btn delete" onclick="deleteRound(${roundIndex})" title="${TRANSLATIONS[currentLang].delete}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </td>
        `;

        tr.innerHTML = html;
        historyTableBody.prepend(tr); // Newest first
    });
}

function updateHistoryHeader() {
    // Clear existing headers except #
    while (historyTableHead.children.length > 1) {
        historyTableHead.removeChild(historyTableHead.lastChild);
    }

    players.forEach(player => {
        const th = document.createElement('th');
        th.textContent = player.name;
        historyTableHead.appendChild(th);
    });

    const actionTh = document.createElement('th');
    actionTh.innerHTML = '&nbsp;'; // Actions column
    historyTableHead.appendChild(actionTh);
}

// --- Logic Functions ---

function updateName(index, newName) {
    players[index].name = newName;
    saveState();
    updateHistoryHeader();
}

function addPlayer() {
    const nextId = players.length + 1;
    const pName = `${TRANSLATIONS[currentLang].defaultPlayer} ${nextId}`;
    players.push({ id: nextId, name: pName, score: 0 });

    // Update history with 0 for new player
    history.forEach(round => {
        round.scores.push(0);
    });

    saveState();
    renderPlayers();
    renderHistory();
}

function removePlayer(index) {
    if (!confirm(TRANSLATIONS[currentLang].confirmDeletePlayer)) return;

    // Remove player
    players.splice(index, 1);

    // Remove player's column from history
    history.forEach(round => {
        round.scores.splice(index, 1);
    });

    // Recalculate total scores for remaining players
    recalcTotalScores();

    saveState();
    renderPlayers();
    renderHistory();
}

function recalcTotalScores() {
    players.forEach((p, idx) => {
        p.score = history.reduce((sum, round) => sum + round.scores[idx], 0);
    });
}

function deleteRound(index) {
    history.splice(index, 1);
    recalcTotalScores();
    saveState();
    renderPlayers();
    renderHistory();
}

function editRound(index) {
    editingRoundIndex = index;
    const round = history[index];

    openModal();

    // Fill inputs with existing scores
    round.scores.forEach((score, i) => {
        const input = document.getElementById(`input-p${i}`);
        if (input) input.value = score;
    });
}

function openModal() {
    modalInputs.innerHTML = '';
    players.forEach((player, index) => {
        const group = document.createElement('div');
        group.className = 'score-input-group';
        group.innerHTML = `
            <label>${player.name}</label>
            <input type="number" id="input-p${index}" placeholder="0">
        `;
        modalInputs.appendChild(group);
    });

    // Focus first input
    setTimeout(() => {
        const firstInput = document.getElementById('input-p0');
        if (firstInput) firstInput.focus();
    }, 100);

    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    editingRoundIndex = -1;
}

function saveRound() {
    const roundScores = [];
    let hasInput = false;

    players.forEach((player, index) => {
        const input = document.getElementById(`input-p${index}`);
        let val = parseInt(input.value) || 0;

        // Round to nearest 5
        val = Math.round(val / 5) * 5;

        if (input.value !== '') hasInput = true;
        roundScores.push(val);
    });

    if (!hasInput) {
        closeModal();
        return;
    }

    if (editingRoundIndex > -1) {
        history[editingRoundIndex] = { scores: roundScores };
    } else {
        history.push({ scores: roundScores });
    }

    recalcTotalScores();
    saveState();
    renderPlayers();
    renderHistory();
    closeModal();
}

function resetGame() {
    if (!confirm(TRANSLATIONS[currentLang].resetConfirm)) return;

    const pName = TRANSLATIONS[currentLang].defaultPlayer;
    players.forEach((p, i) => {
        p.score = 0;
        p.name = `${pName} ${i + 1}`; // Reset names to localized default
    });
    history = [];
    saveState();
    renderPlayers();
    renderHistory();
}

function saveState() {
    localStorage.setItem('mariage_players', JSON.stringify(players));
    localStorage.setItem('mariage_history', JSON.stringify(history));
}

// --- Event Listeners ---

addRoundBtn.addEventListener('click', () => {
    editingRoundIndex = -1;
    openModal();
});
addPlayerBtn.addEventListener('click', addPlayer);
cancelBtn.addEventListener('click', closeModal);
saveBtn.addEventListener('click', saveRound);
resetBtn.addEventListener('click', resetGame);

// Language Switchers
langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setLanguage(btn.getAttribute('data-lang'));
    });
});

// Allow closing modal by clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Initialize
setLanguage(currentLang);
renderPlayers();
renderHistory();
