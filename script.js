/**
 * Shampoo Strategist - Game Logic
 */

// --- Constants & Configuration ---

const HAIR_CYCLE = {
    0: { score: 9, desc: "Fresh and Clean ✨", badge: "Shampoo Day" },
    1: { score: 10, desc: "Perfect balance", badge: "Peak (Day 1)" },
    2: { score: 7, desc: "Lived-in texture", badge: "Good (Day 2)" },
    3: { score: 3, desc: "Visibly dirty", badge: "Greasy (Day 3)" },
    4: { score: 1, desc: "Oil slick", badge: "Gross (Day 4+)" } // Default for 4+
};

const EVENTS = {
    MEETING: { id: 'MEETING', name: 'Client Meeting', multiplier: 3.0, desc: 'High stakes professional. Needs Day 0 or 1.', icon: '💼' },
    DATE: { id: 'DATE', name: 'Hot Date', multiplier: 2.5, desc: 'High stakes romantic. Needs Day 1 or 2.', icon: '❤️' },
    PARTY: { id: 'PARTY', name: 'Social Party', multiplier: 1.5, desc: 'Medium stakes. Flexible.', icon: '🎉' },
    CHILL: { id: 'CHILL', name: 'WFH / Chill', multiplier: 1.0, desc: 'Low stakes. Maintenance day.', icon: '🏠' },
    WORKOUT: { id: 'WORKOUT', name: 'Gym / Run', multiplier: 0.5, desc: 'Dirty hair bonus (+15pt) if Day 3+.', icon: '💪' }
};

const CHAOS_TYPES = [
    { id: 'RAIN', chance: 0.1, text: "Sudden downpour! Perfect hair ruined.", icon: '🌧️' },
    { id: 'HUMIDITY', chance: 0.1, text: "High humidity! It puffed up.", icon: '🌫️' },
    { id: 'NONE', chance: 0.8, text: "", icon: '' }
];

const CONFIG = {
    TOTAL_DAYS: 10,
    STARTING_HEALTH: 100,
    WASH_COST: 15,
    WAIT_RECOVERY: 5,
    STARTING_DAYS_SINCE_WASH: 2
};

// --- Game State ---

const state = {
    currentDay: 0,
    hairHealth: CONFIG.STARTING_HEALTH,
    daysSinceWash: CONFIG.STARTING_DAYS_SINCE_WASH,
    totalScore: 0,
    schedule: [],
    history: [], // { day, event, action, score, health, daysSinceWash, chaos }
    gameOver: false
};

// --- Core Logic ---

const game = {
    init: () => {
        state.currentDay = 0;
        state.hairHealth = CONFIG.STARTING_HEALTH;
        state.daysSinceWash = CONFIG.STARTING_DAYS_SINCE_WASH;
        state.totalScore = 0;
        state.history = [];
        state.gameOver = false;

        game.generateSchedule();
        ui.init();
        ui.render();
    },

    generateSchedule: () => {
        const eventKeys = Object.keys(EVENTS);
        let schedule = [];

        // Constraint: At least 1 MEETING and 1 DATE
        schedule.push(EVENTS.MEETING);
        schedule.push(EVENTS.DATE);

        // Fill the rest randomly
        for (let i = 0; i < CONFIG.TOTAL_DAYS - 2; i++) {
            const randomKey = eventKeys[Math.floor(Math.random() * eventKeys.length)];
            schedule.push(EVENTS[randomKey]);
        }

        // Shuffle
        state.schedule = schedule.sort(() => Math.random() - 0.5);
    },

    handleInput: (action) => {
        if (state.gameOver) return;

        // 1. Update State based on Action
        let actionLabel = "";
        if (action === 'shampoo') {
            state.daysSinceWash = 0;
            state.hairHealth -= CONFIG.WASH_COST;
            actionLabel = "SHAMPOOING";
        } else {
            state.daysSinceWash += 1;
            state.hairHealth = Math.min(100, state.hairHealth + CONFIG.WAIT_RECOVERY);
            actionLabel = "WAIT";
        }

        // Check Death immediately
        if (state.hairHealth <= 0) {
            game.triggerGameOver("Hair Fried! Game Over.");
            return;
        }

        // 2. Chaos Phase
        const chaos = game.rollChaos();

        // 3. Scoring Phase
        const dailyScore = game.calculateScore(state.daysSinceWash, state.hairHealth, state.schedule[state.currentDay], chaos);
        state.totalScore += dailyScore;

        // 4. Log History
        state.history.push({
            day: state.currentDay,
            event: state.schedule[state.currentDay],
            action: actionLabel,
            score: dailyScore,
            health: state.hairHealth,
            daysSinceWash: state.daysSinceWash,
            chaos: chaos
        });

        // 5. Next Turn
        state.currentDay++;

        // Show Chaos Toast if happened
        if (chaos.id !== 'NONE') {
            ui.showChaos(chaos);
        }

        if (state.currentDay >= CONFIG.TOTAL_DAYS) {
            game.endGame();
        } else {
            ui.render();
        }
    },

    rollChaos: () => {
        const rand = Math.random();
        if (rand < 0.1) return CHAOS_TYPES[0]; // Rain
        if (rand < 0.2) return CHAOS_TYPES[1]; // Humidity
        return CHAOS_TYPES[2]; // None
    },

    calculateScore: (daysWash, health, event, chaos) => {
        // Base Quality
        let baseQuality = (HAIR_CYCLE[daysWash] || HAIR_CYCLE[4]).score;

        // Health Penalties
        if (health < 20) {
            baseQuality = Math.min(baseQuality, 5); // Fried Penalty
        } else if (health < 50) {
            baseQuality = Math.min(baseQuality, 8); // Frizz Penalty
        }

        // Chaos Modifiers
        if (chaos.id === 'RAIN' && daysWash === 1) {
            baseQuality = 6; // Downgrade to Day 0 score
        } else if (chaos.id === 'HUMIDITY' && daysWash === 0) {
            baseQuality = Math.max(0, baseQuality - 2);
        }

        // Event Multiplier
        let score = baseQuality * event.multiplier;

        // Special Bonus: Workout with dirty hair
        if (event.id === 'WORKOUT' && daysWash >= 3) {
            score += 15;
        }

        return Math.round(score); // Round to integer
    },

    triggerGameOver: (reason) => {
        state.gameOver = true;
        alert(reason); // Simple alert for now, or custom modal
        game.endGame();
    },

    endGame: () => {
        state.gameOver = true;
        const perfectGame = solver.solve(state.schedule);
        ui.showEndGame(perfectGame);
    }
};

// --- Solver (Retrospective) ---

const solver = {
    solve: (schedule) => {
        let bestScore = -1;
        let bestPath = [];

        // 2^10 combinations
        for (let i = 0; i < 1024; i++) {
            let moves = i.toString(2).padStart(10, '0').split('');
            let simState = {
                health: CONFIG.STARTING_HEALTH,
                daysSinceWash: CONFIG.STARTING_DAYS_SINCE_WASH,
                totalScore: 0,
                alive: true
            };

            for (let day = 0; day < 10; day++) {
                let wash = moves[day] === '1';

                if (wash) {
                    simState.health -= CONFIG.WASH_COST;
                    simState.daysSinceWash = 0;
                } else {
                    simState.health = Math.min(100, simState.health + CONFIG.WAIT_RECOVERY);
                    simState.daysSinceWash++;
                }

                if (simState.health <= 0) {
                    simState.alive = false;
                    break;
                }

                // Assume NO Chaos for perfect prediction
                let quality = game.calculateScore(simState.daysSinceWash, simState.health, schedule[day], CHAOS_TYPES[2]);
                simState.totalScore += quality;
            }

            if (simState.alive && simState.totalScore > bestScore) {
                bestScore = simState.totalScore;
                bestPath = moves;
            }
        }

        return { bestScore, bestPath };
    }
};

// --- UI Controller ---

const ui = {
    init: () => {
        document.getElementById('end-game-modal').classList.add('hidden');
        document.getElementById('chaos-message').classList.add('hidden');
    },

    render: () => {
        // Header Stats
        document.getElementById('day-display').textContent = `${state.currentDay + 1}/${CONFIG.TOTAL_DAYS}`;
        document.getElementById('score-display').textContent = state.totalScore;

        // Health Bar
        const healthBar = document.getElementById('health-bar');
        const healthText = document.getElementById('health-text');
        healthBar.style.width = `${state.hairHealth}%`;
        healthText.textContent = `${state.hairHealth}%`;

        if (state.hairHealth > 50) healthBar.style.backgroundColor = 'var(--health-good)';
        else if (state.hairHealth > 20) healthBar.style.backgroundColor = 'var(--health-warn)';
        else healthBar.style.backgroundColor = 'var(--health-bad)';

        // Hair Look Bar (Based on current day score max 10)
        const currentLookScore = (HAIR_CYCLE[state.daysSinceWash] || HAIR_CYCLE[4]).score;
        const lookPercent = (currentLookScore / 10) * 100;

        const lookBar = document.getElementById('look-bar');
        const lookText = document.getElementById('look-text');
        if (lookBar && lookText) {
            lookBar.style.width = `${lookPercent}%`;
            // Color handled by CSS class .look-fill
            lookText.textContent = `${lookPercent}%`;
        }

        // Overall Quality Bar (Average of Health and Look)
        const overallQuality = Math.round((state.hairHealth + lookPercent) / 2);

        const qualityBar = document.getElementById('quality-bar');
        const qualityText = document.getElementById('quality-text');
        if (qualityBar && qualityText) {
            qualityBar.style.width = `${overallQuality}%`;
            // Color handled by CSS class .quality-fill
            qualityText.textContent = `${overallQuality}%`;
        }

        // Current Hair State
        const hairInfo = HAIR_CYCLE[state.daysSinceWash] || HAIR_CYCLE[4];
        document.getElementById('hair-quality-badge').textContent = hairInfo.badge;
        document.getElementById('hair-desc').textContent = hairInfo.desc;

        // Current Event
        const event = state.schedule[state.currentDay];
        if (event) {
            document.getElementById('current-event-icon').textContent = event.icon;
            document.getElementById('current-event-name').textContent = event.name;
            document.getElementById('current-event-desc').textContent = event.desc;
            document.getElementById('current-event-multiplier').textContent = `${event.multiplier}x Multiplier`;
        }

        // Forecast Strip
        const strip = document.getElementById('calendar-strip');
        strip.innerHTML = '';
        state.schedule.forEach((evt, idx) => {
            const el = document.createElement('div');
            el.className = `day-card ${idx === state.currentDay ? 'active' : ''} ${idx < state.currentDay ? 'past' : ''}`;
            el.innerHTML = `
                <span class="day-num">Day ${idx + 1}</span>
                <span class="day-icon">${evt.icon}</span>
            `;
            strip.appendChild(el);
        });
    },

    showChaos: (chaos) => {
        const toast = document.getElementById('chaos-message');
        const text = document.getElementById('chaos-text');
        text.textContent = chaos.text;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    },

    showEndGame: (perfectGame) => {
        const modal = document.getElementById('end-game-modal');
        modal.classList.remove('hidden');

        document.getElementById('final-score').textContent = state.totalScore;
        document.getElementById('best-possible-score').textContent = perfectGame.bestScore;

        // Draw Chart
        ui.drawChart(state.history.map(h => h.score));

        // Draw Comparison
        const compContainer = document.getElementById('strategy-comparison');
        compContainer.innerHTML = '';

        // Player Moves
        // We need to visualize player vs optimal. 
        // Let's just list the optimal moves for now or a simple visual block.
        perfectGame.bestPath.forEach((move, idx) => {
            const div = document.createElement('div');
            div.className = `strat-block ${move === '1' ? 'strat-wash' : 'strat-wait'}`;
            div.title = `Day ${idx + 1}: ${move === '1' ? 'Wash' : 'Wait'}`;
            compContainer.appendChild(div);
        });
    },

    drawChart: (scores) => {
        const canvas = document.getElementById('score-chart');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Axes
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Plot
        if (scores.length === 0) return;

        const maxScore = Math.max(...scores, 10); // Avoid div by zero
        const stepX = (width - 2 * padding) / (scores.length - 1);

        ctx.beginPath();
        ctx.strokeStyle = '#6c5ce7';
        ctx.lineWidth = 3;

        scores.forEach((score, idx) => {
            const x = padding + idx * stepX;
            const y = height - padding - (score / maxScore) * (height - 2 * padding);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            // Point
            ctx.fillStyle = '#6c5ce7';
            ctx.fillRect(x - 4, y - 4, 8, 8);
        });
        ctx.stroke();
    }
};

// Start Game
game.init();
