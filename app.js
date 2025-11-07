// ========== PART 2: MAIN THREAD JAVASCRIPT ==========
// นี่คือ "หน้าจอ" (UI) หรือ "เธรดหลัก" (ไฟล์ app.js v16.0)
// ทำหน้าที่: จัดการ UI, สื่อสารกับ "สมอง" (Web Worker)

// 1. DOM Elements (การเชื่อมต่อหน้าปัด)
const ui = {
    loadingOverlay: document.getElementById('loadingOverlay'),
    app: document.getElementById('app'),
    
    appStatus: document.getElementById('appStatus'),
    predCircle: document.getElementById('predCircle'),
    confText: document.getElementById('confText'),
    condBox: document.getElementById('condBox'),
    progressBar: document.getElementById('progressBar'),
    countdownText: document.getElementById('countdownText'),
    controlsGrid: document.getElementById('controlsGrid'),
    quickControls: document.getElementById('quickControls'),
    
    bettingPanel: document.getElementById('bettingPanel'),
    betSuggestion: document.getElementById('betSuggestion'),
    betReason: document.getElementById('betReason'),
    
    btnPlayer: document.getElementById('btnPlayer'),
    btnBanker: document.getElementById('btnBanker'),
    btnTie: document.getElementById('btnTie'),
    flyoutP: document.getElementById('flyoutP'),
    flyoutB: document.getElementById('flyoutB'),
    
    winRateShoe: document.getElementById('winRateShoe'),
    winShoe: document.getElementById('winShoe'),
    loseShoe: document.getElementById('loseShoe'),
    winRateGlobal: document.getElementById('winRateGlobal'),
    winGlobal: document.getElementById('winGlobal'),
    loseGlobal: document.getElementById('loseGlobal'),
    
    bigroad: document.getElementById('bigroad'),
    
    // (‼️‼️ อัปเกรด v16.0: DERIVED ROADS ‼️‼️)
    bigEyeRoadGrid: document.getElementById('bigEyeRoadGrid'),
    smallRoadGrid: document.getElementById('smallRoadGrid'),
    cockroachRoadGrid: document.getElementById('cockroachRoadGrid'),
    // (‼️‼️ จบ v16.0 ‼️‼️)
    
    aiDashboard: document.getElementById('aiDashboard'),
    expMain: document.getElementById('expMain'),
    expDerived: document.getElementById('expDerived'),
    expRules: document.getElementById('expRules'),
    expStats: document.getElementById('expStats'),
    expSpecial: document.getElementById('expSpecial'),
    expSimA: document.getElementById('expSimA'),
    expSimB: document.getElementById('expSimB'),
    expSimC: document.getElementById('expSimC'),
    expMiner: document.getElementById('expMiner'),
    expFinal: document.getElementById('expFinal'),
    
    statusHeartbeat: document.getElementById('statusHeartbeat'),
    statusStorage: document.getElementById('statusStorage'),
    statusTotalHands: document.getElementById('statusTotalHands'),
    statusShoeHands: document.getElementById('statusShoeHands'),
    shoeHistorySummary: document.getElementById('shoeHistorySummary'),
    
    // (Modals)
    dashboardModal: document.getElementById('dashboardModal'),
    historyHubModal: document.getElementById('historyHubModal'), 
    settingsModal: document.getElementById('settingsModal'),
    helpModal: document.getElementById('helpModal'),
    historyModal: document.getElementById('historyModal'),
    confirmModal: document.getElementById('confirmModal'),
    confirmModalTitle: document.getElementById('confirmModalTitle'),
    confirmModalBody: document.getElementById('confirmModalBody'),
    confirmBtnYes: document.getElementById('confirmBtnYes'),
    confirmBtnNo: document.getElementById('confirmBtnNo'),

    historyEditorBody: document.getElementById('historyEditorBody'),
    historyFilter: document.getElementById('historyFilter'),
    
    fatalErrorOverlay: document.getElementById('fatalErrorOverlay'),
    fatalErrorMessage: document.getElementById('fatalErrorMessage'),
    retrainOverlay: document.getElementById('retrainOverlay'),
    retrainProgressBar: document.getElementById('retrainProgressBar'),
    retrainStatus: document.getElementById('retrainStatus'),
    
    csvPasteArea: document.getElementById('csvPasteArea'),
    
    // (Setting Controls)
    settingsRiskSlider: document.getElementById('settingsRiskSlider'),
    settingsRiskLabel: document.getElementById('settingsRiskLabel'),
    settingsRiskDesc: document.getElementById('settingsRiskDesc'),
    
    // (Power Management)
    togglePowerMode: document.getElementById('togglePowerMode'),
    toggleHaptics: document.getElementById('toggleHaptics'),
    
    toggleMetaMind: document.getElementById('toggleMetaMind'),
};

// 2. State (สถานะของหน้าจอ)
let aiWorker = null;
let countdownInterval = null;
let currentCountdown = 20;
const COUNTDOWN_START = 20;
let holdTimer = null;
let isHolding = false;
const HOLD_DURATION = 400; // (0.4 วินาที)
// (State การตั้งค่า)
let currentTriggerValue = 5;
let appSettings = {
    powerMode: false,
    haptics: true,
    useMetaMind: false 
};
// (State การยืนยัน)
let confirmCallback = null;

// 3. Worker Initialization (สตาร์ท "สมอง")
function initializeWorker() {
    if (window.Worker) {
        document.getElementById('loaderStatus').textContent = "สถานะ: กำลังสตาร์ท 'สมอง AI'...";
        try {
            // (‼️‼️ อัปเกรด: Cache Busting ‼️‼️)
            // (v16.0 - The Cockroach)
            aiWorker = new Worker('worker_v17.js?v=17.0'); 
            
            aiWorker.onmessage = handleWorkerMessage;
            aiWorker.onerror = handleWorkerError;
            
            loadSettings(); 
            
            const config = {
                riskThreshold: currentTriggerValue,
                powerMode: appSettings.powerMode,
                useMetaMind: appSettings.useMetaMind 
            };
            aiWorker.postMessage({ command: 'INIT', config: config });
            
            startHeartbeat();
        } catch (e) {
            console.error("Worker failed to start:", e);
            showFatalError("ไม่สามารถเริ่มต้น 'สมอง AI' (worker.js) ได้ กรุณาตรวจสอบว่าไฟล์อยู่ในโฟลเดอร์เดียวกัน");
        }
    } else {
        console.error("Web Workers not supported");
        showFatalError("เบราว์เซอร์ของคุณไม่รองรับ Web Workers ไม่สามารถรัน AI ได้");
    }
}

// 4. Worker Communication (การสื่อสารกับ "สมอง")

// A. รับข้อความจาก "สมอง"
function handleWorkerMessage(e) {
    const data = e.data;
    
    switch (data.command) {
        case 'INIT_COMPLETE':
            ui.loadingOverlay.style.display = 'none'; 
            ui.app.style.display = 'block'; 
            
            ui.appStatus.textContent = "สถานะ: พร้อม (เชื่อมต่อ 'สมอง' แล้ว)";
            ui.statusHeartbeat.textContent = "เชื่อมต่อแล้ว";
            ui.statusHeartbeat.className = "val ok";
            aiWorker.postMessage({ command: 'LOAD_LAST_STATE' });
            
            updateRiskSliderUI();
            
            break;
            
        case 'LAST_STATE_LOADED':
            updateUI(data.state);
            break;
            
        case 'ANALYSIS_COMPLETE':
            if (data.state.signal.finalPrediction !== '-') {
                haptic('heavy');
            }
            updateUI(data.state);
            break;
            
        case 'HEARTBEAT_PONG':
            ui.statusHeartbeat.textContent = "เชื่อมต่อแล้ว";
            ui.statusHeartbeat.className = "val ok";
            break;
            
        case 'STORAGE_UPDATED':
            ui.statusStorage.textContent = `${(data.sizeMB || 0).toFixed(2)} MB`;
            ui.statusTotalHands.textContent = `${data.totalHands || 0} ตา`;
            break;
            
        case 'HISTORY_LOADED':
            renderHistoryEditor(data.history, data.filter);
            break;
            
        case 'SHOE_SUMMARY_LOADED':
            renderShoeSummary(data.summary);
            break;
            
        case 'BIST_RESULT':
            alert(`[ผลการตรวจสุขภาพสมอง]\nความสมบูรณ์: ${data.passed ? 'ปกติ (100%)' : 'พบปัญหา!'}\n\n${data.message}`);
            break;
            
        case 'RETRAIN_PROGRESS':
            ui.retrainOverlay.style.display = 'flex';
            ui.retrainProgressBar.style.width = `${data.progress}%`;
            ui.retrainStatus.textContent = `สถานะ: ${data.message}`;
            break;
            
        case 'RETRAIN_COMPLETE':
            ui.retrainOverlay.style.display = 'none';
            alert('การฝึกสมองใหม่เสร็จสิ้น! ระบบพร้อมใช้งาน');
            aiWorker.postMessage({ command: 'LOAD_LAST_STATE' });
            break;
            
        case 'REPAIR_COMPLETE':
            ui.retrainOverlay.style.display = 'none';
            alert('ซิงค์สถิติสมองใหม่สำเร็จ! ข้อมูลถูกต้อง 100%');
            aiWorker.postMessage({ command: 'LOAD_LAST_STATE' });
            break;

        case 'EXPORT_DATA':
            downloadCSV(data.csvString, 'oc_history_backup.csv');
            break;
            
        case 'ACTION_FAILED':
            alert(`เกิดข้อผิดพลาด: ${data.message}`);
            setControlsDisabled(false);
            break;
            
        case 'FATAL_ERROR_FROM_WORKER':
            showFatalError(data.message);
            break;
    }
}

// B. จัดการเมื่อ "สมอง" พัง
function handleWorkerError(e) {
    console.error("Fatal Worker Error:", e.message, e.filename, e.lineno);
    showFatalError(`'สมอง AI' หยุดทำงานกะทันหัน (บรรทัด ${e.lineno}: ${e.message})`);
}

// C. แสดงข้อผิดพลาดร้ายแรง (Heartbeat Fail)
function showFatalError(message) {
    ui.loadingOverlay.style.display = 'none';
    ui.app.style.display = 'none';
    
    stopHeartbeat();
    ui.fatalErrorMessage.innerHTML = message + "<br><br>กรุณา 'ปิด' และ 'เปิด' แอปนี้ใหม่ทั้งหมด (Restart)";
    ui.fatalErrorOverlay.style.display = 'flex';
    if (aiWorker) {
        aiWorker.terminate();
        aiWorker = null;
    }
}

// 5. Heartbeat (ระบบตรวจจับชีพจร)
let heartbeatInterval = null;
function startHeartbeat() {
    stopHeartbeat();
    heartbeatInterval = setInterval(() => {
        if (!aiWorker) {
            stopHeartbeat();
            return;
        }
        try {
            ui.statusHeartbeat.textContent = "กำลังตรวจสอบ...";
            ui.statusHeartbeat.className = "val warn";
            aiWorker.postMessage({ command: 'HEARTBEAT_PING' });
            
            setTimeout(() => {
                if (ui.statusHeartbeat.textContent === "กำลังตรวจสอบ...") {
                    showFatalError("'สมอง AI' (Web Worker) ไม่ตอบสนอง ระบบหยุดทำงาน");
                }
            }, 3000); 

        } catch (e) {
            showFatalError(`ไม่สามารถสื่อสารกับ 'สมอง AI' ได้ (อาจจะแครช)`);
        }
    }, 10000); 
}
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

// 6. UI Update Functions (ฟังก์ชันอัปเดตหน้าจอ)

// A. อัปเดตหน้าจอทั้งหมด
function updateUI(state) {
    if (!state) {
        setControlsDisabled(false); 
        return;
    }
    
    // 1. อัปเดต Signal หลัก (ระบบ Hunter)
    const pred = state.signal.finalPrediction || '-';
    ui.predCircle.textContent = pred;
    
    if (pred === '-' && !appSettings.powerMode) {
        ui.predCircle.className = 'pred-circle waiting';
        ui.condBox.textContent = `กำลังวิเคราะห์... (${state.signal.condition})`;
    } else {
        ui.predCircle.className = `pred-circle ${pred}`;
        ui.condBox.textContent = `เงื่อนไข: ${state.signal.condition || 'กำลังรอผล...'}`;
    }
    
    ui.confText.textContent = `ความมั่นใจ: ${state.signal.confidence || 0}%`;
    
    // 1B. อัปเดต คำแนะนำการเดินเงิน
    updateBettingStrategy(state.signal);
    
    // 2. อัปเดต Winrate
    ui.winRateShoe.textContent = `${state.stats.shoe.winrate || 0} %`;
    ui.winShoe.textContent = state.stats.shoe.wins || 0;
    ui.loseShoe.textContent = state.stats.shoe.losses || 0;
    ui.winRateGlobal.textContent = `${state.stats.global.winrate || 0} %`;
    ui.winGlobal.textContent = state.stats.global.wins || 0;
    ui.loseGlobal.textContent = state.stats.global.losses || 0;
    
    // 3. อัปเดต แดชบอร์ด AI (Shadow Mode)
    updateExpertDashboard(state.signal.expertVotes || {}, state.expertPerformance || {});
    
    // 4. อัปเดต สถานะระบบ
    ui.statusStorage.textContent = `${(state.stats.storageSizeMB || 0).toFixed(2)} MB`;
    ui.statusTotalHands.textContent = `${state.stats.global.totalHands || 0} ตา`;
    ui.statusShoeHands.textContent = `${state.stats.shoe.totalHands || 0} ตา`;

    // 5. อัปเดต Big Road
    renderBigRoad(state.history.shoe);
    
    // (‼️‼️ อัปเกรด v16.0: วาดตารางย่อย ‼️‼️)
    renderDerivedRoads(state.derivedRoads);
    
    // 6. (สำคัญ) ปลดล็อคปุ่มกด (แก้แผล "คลิกรัว")
    setControlsDisabled(false);
}

// B. (‼️‼️ เพิ่ม: BETTING STRATEGY ‼️‼️)
function updateBettingStrategy(signal) {
    const pred = signal.finalPrediction;
    const conf = signal.confidence;
    
    if (pred === 'WAIT' || pred === '-' || pred === 'T') {
        ui.betSuggestion.textContent = "รอดู (WAIT)";
        ui.betReason.textContent = "รอ Signal ที่มีความมั่นใจสูง";
        ui.betSuggestion.style.color = "var(--text-muted)";
    } else {
        // (ปรับตรรกะตาม % ความมั่นใจ)
        if (conf >= 80) { 
            ui.betSuggestion.textContent = "2 หน่วย (Units)";
            ui.betReason.textContent = `มั่นใจสูง (${conf}%) ใน ${pred}`;
            ui.betSuggestion.style.color = "var(--green)";
        } else { 
            ui.betSuggestion.textContent = "1 หน่วย (Unit)";
            ui.betReason.textContent = `มั่นใจปานกลาง (${conf}%) ใน ${pred}`;
            ui.betSuggestion.style.color = "var(--gold)";
        }
    }
}

// C. อัปเดตแดชบอร์ด AI (Shadow Mode)
function updateExpertDashboard(votes, performance) {
    const setVote = (el, vote) => {
        if (!vote || vote === 'WAIT') {
            el.textContent = '-';
            el.className = 'val';
        } else {
            el.textContent = vote;
            el.className = `val ${vote}`;
        }
    };
    const setPerf = (key) => {
        const perf = performance[key];
        const el = document.getElementById(`perf${key.charAt(0).toUpperCase() + key.slice(1)}`); 
        if (!el) return;
        
        if (perf && perf.total > 0) {
            const winrate = Math.round((perf.wins / perf.total) * 100);
            el.textContent = `${winrate}%`;
        } else {
            el.textContent = `--%`;
        }
    };
    
    setVote(ui.expMain, votes.main); setPerf('main');
    setVote(ui.expDerived, votes.derived); setPerf('derived');
    setVote(ui.expRules, votes.rules); setPerf('rules');
    setVote(ui.expStats, votes.stats); // (ชื่อ Stats ยังเหมือนเดิม)
    setVote(ui.expSpecial, votes.special); setPerf('special');
    setVote(ui.expSimA, votes.simA); setPerf('simA');
    setVote(ui.expSimB, votes.simB); setPerf('simB');
    setVote(ui.expSimC, votes.simC); setPerf('simC');
    setVote(ui.expMiner, votes.miner); setPerf('miner');
    
    setVote(ui.expFinal, votes.finalPrediction);
}

// D. อัปเดต Big Road
function renderBigRoad(history) {
    ui.bigroad.innerHTML = '';
    if (!history || history.length === 0) return;
    
    const cols = [];
    let tieCount = 0; 
    
    history.forEach(hand => {
        const result = hand.result;
        const mainResult = result[0];
        
        if (mainResult === 'T') {
            tieCount++; 
            return; 
        }
        
        let handData = { hand: hand, ties: tieCount };
        tieCount = 0; 
        
        if (cols.length === 0) {
            cols.push([handData]);
            return;
        }
        
        let lastCol = cols[cols.length - 1];
        let lastHandData = lastCol[lastCol.length - 1];
        let lastMainResult = lastHandData.hand.result[0];
        
        if (mainResult === lastMainResult) {
            lastCol.push(handData);
        } else {
            cols.push([handData]); 
        }
    });
    
    cols.forEach(col => {
        const divCol = document.createElement('div');
        divCol.className = 'br-col';
        col.forEach(handData => {
            const cell = document.createElement('div');
            const hand = handData.hand;
            const cellClass = 'br-' + (hand.result === 'T' ? 'T' : hand.result.replace('2', ''));
            cell.className = `br-cell ${cellClass}`;
            cell.textContent = hand.result[0];
            
            if (handData.ties > 0) {
                const tieLine = document.createElement('div');
                tieLine.className = 'tie-line';
                cell.appendChild(tieLine);
                if (handData.ties > 1) {
                    tieLine.textContent = handData.ties;
                    tieLine.style.color = 'white';
                    tieLine.style.fontSize = '12px';
                    tieLine.style.textAlign = 'center';
                }
            }
            
            divCol.appendChild(cell);
        });
        ui.bigroad.appendChild(divCol);
    });
    
    ui.bigroad.scrollLeft = ui.bigroad.scrollWidth;
}

// (‼️‼️ อัปเกรด v16.0: DERIVED ROADS RENDERER ‼️‼️)
function renderDerivedRoads(derivedRoads) {
    if (!derivedRoads) return;

    // --- 1. Big Eye Road (ตารางไข่ปลา) ---
    const berGrid = ui.bigEyeRoadGrid;
    berGrid.innerHTML = ''; // (ล้างของเก่า)
    
    if (derivedRoads.bigEye && derivedRoads.bigEye.cols) {
        derivedRoads.bigEye.cols.forEach(col => {
            const divCol = document.createElement('div');
            divCol.className = 'dr-col'; // (ใช้คลาสใหม่)
            col.forEach(cell => {
                const divCell = document.createElement('div');
                divCell.className = `dr-cell ber-${cell}`; 
                divCol.appendChild(divCell);
            });
            berGrid.appendChild(divCol);
        });
        berGrid.scrollLeft = berGrid.scrollWidth;
    }
    
    // --- 2. Small Road (ตารางไม้ขีด) ---
    const srGrid = ui.smallRoadGrid;
    srGrid.innerHTML = ''; // (ล้างของเก่า)
    
    if (derivedRoads.small && derivedRoads.small.cols) {
        derivedRoads.small.cols.forEach(col => {
            const divCol = document.createElement('div');
            divCol.className = 'dr-col'; 
            col.forEach(cell => {
                const divCell = document.createElement('div');
                divCell.className = `dr-cell sr-${cell}`; 
                divCol.appendChild(divCell);
            });
            srGrid.appendChild(divCol);
        });
        srGrid.scrollLeft = srGrid.scrollWidth;
    }
    
    // --- 3. Cockroach Road (ตารางแมลงสาบ) ---
    const crGrid = ui.cockroachRoadGrid;
    crGrid.innerHTML = ''; // (ล้างของเก่า)
    
    if (derivedRoads.cockroach && derivedRoads.cockroach.cols) {
        derivedRoads.cockroach.cols.forEach(col => {
            const divCol = document.createElement('div');
            divCol.className = 'dr-col'; 
            col.forEach(cell => {
                const divCell = document.createElement('div');
                divCell.className = `dr-cell cr-${cell}`; // (‼️‼️ v16.0: ใช้คลาสใหม่)
                divCol.appendChild(divCell);
            });
            crGrid.appendChild(divCol);
        });
        crGrid.scrollLeft = crGrid.scrollWidth;
    }
}
// (‼️‼️ จบ v16.0 ‼️‼️)


// E. อัปเดตหน้าต่างแก้ไขประวัติ
function renderHistoryEditor(history, filter) {
    ui.historyEditorBody.innerHTML = '';
    if (!history || history.length === 0) {
        ui.historyEditorBody.innerHTML = '<tr><td colspan="3">ยังไม่มีประวัติ</td></tr>';
        return;
    }
    
    let filteredHistory = history;
    if (filter === 'unknown') {
        filteredHistory = history.filter(h => h.result.includes('_UNKNOWN'));
    }
    
    const recentHistory = filteredHistory.slice(-100).reverse();
    
    recentHistory.forEach(hand => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>ตาที่ ${hand.id}</td>
            <td>${hand.result}</td>
            <td>
                <select onchange="onConfirmEdit(this, ${hand.id}, '${hand.result}')">
                    <option value="">-- เลือกใหม่ --</option>
                    <option value="P_UNKNOWN">PLAYER (ไม่ระบุ)</option>
                    <option value="P2">PLAYER 2 ใบ</option>
                    <option value="P3">PLAYER 3 ใบ</option>
                    <option value="B_UNKNOWN">BANKER (ไม่ระบุ)</option>
                    <option value="B2">BANKER 2 ใบ</option>
                    <option value="B3">BANKER 3 ใบ</option>
                    <option value="T">TIE</option>
                </select>
            </td>
        `;
        ui.historyEditorBody.appendChild(row);
    });
}
// (‼️‼️ แยกฟังก์ชัน ‼️‼️)
window.onConfirmEdit = function(selectElement, handId, oldResult) {
    const newValue = selectElement.value;
    if (newValue) {
        showConfirm(
            `ยืนยันการแก้ไข`,
            `คุณต้องการแก้ไข ตาที่ ${handId} จาก ${oldResult} เป็น ${newValue} หรือไม่?`,
            () => {
                setControlsDisabled(true);
                ui.predCircle.textContent = '...';
                ui.condBox.textContent = "กำลังแก้ไข...";
                
                aiWorker.postMessage({ command: 'EDIT_HISTORY', handId: handId, newResult: newValue });
                closeModal('historyModal');
            }
        );
        selectElement.value = ""; // (รีเซ็ต dropdown)
    }
}


// F. อัปเดตสรุปประวัติขอนไพ่
function renderShoeSummary(summary) {
    if (!summary || summary.length === 0) {
        ui.shoeHistorySummary.innerHTML = 'ยังไม่มีประวัติขอนไพ่';
        return;
    }
    ui.shoeHistorySummary.innerHTML = '';
    summary.forEach(shoe => {
        const div = document.createElement('div');
        div.style.borderBottom = `1px solid var(--card-border)`;
        div.style.padding = `8px 4px`;
        div.innerHTML = `<strong>ขอนไพ่ #${shoe.id}</strong> (${shoe.isCurrent ? 'ปัจจุบัน' : 'จบแล้ว'})<br>
                         P: ${shoe.P} | B: ${shoe.B} | T: ${shoe.T} (รวม ${shoe.totalHands} ตา)`;
        ui.shoeHistorySummary.appendChild(div);
    });
}


// 7. Countdown Timer (ตัวนับเวลา)
function startCountdown() {
    stopCountdown();
    currentCountdown = COUNTDOWN_START;
    ui.countdownText.textContent = `${currentCountdown}s`;
    
    countdownInterval = setInterval(() => {
        currentCountdown--;
        ui.countdownText.textContent = `${currentCountdown}s`;
        if (currentCountdown <= 5) {
            ui.countdownText.style.color = 'var(--error)';
        } else if (currentCountdown <= 10) {
            ui.countdownText.style.color = 'var(--warn)';
        }
        
        if (currentCountdown <= 0) {
            stopCountdown();
            ui.countdownText.textContent = 'หมดเวลา';
        }
    }, 1000);
}
function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    ui.countdownText.style.color = 'var(--warn)';
}
function resetCountdown() {
    stopCountdown();
    startCountdown();
}


// 8. User Actions (การกระทำของผู้ใช้)

// (Haptic Feedback)
function haptic(type = 'light') {
    if (appSettings.haptics && window.navigator.vibrate) {
        if (type === 'light') window.navigator.vibrate(50); // (แตะ)
        if (type === 'medium') window.navigator.vibrate(100); // (แตะค้าง)
        if (type === 'heavy') window.navigator.vibrate([100, 50, 100]); // (Signal มา)
    }
}

// (ล็อค/ปลดล็อค ปุ่มกด)
function setControlsDisabled(disabled) {
    ui.btnPlayer.disabled = disabled;
    ui.btnBanker.disabled = disabled;
    ui.btnTie.disabled = disabled;
    ui.btnPlayer.style.opacity = disabled ? 0.5 : 1;
    ui.btnBanker.style.opacity = disabled ? 0.5 : 1;
    ui.btnTie.style.opacity = disabled ? 0.5 : 1;
    
    const quickControls = ui.quickControls.getElementsByTagName('button');
    for (const button of quickControls) {
        button.disabled = disabled;
        button.style.opacity = disabled ? 0.5 : 1;
    }
}


// (Smart Interface 'แตะ / แตะค้าง')
function setupSmartControls() {
    const attachListeners = (button, lazyResult, flyout) => {
        button.addEventListener('touchstart', (e) => {
            if (button.disabled) return;
            e.preventDefault(); 
            isHolding = false;
            holdTimer = setTimeout(() => {
                isHolding = true;
                haptic('medium');
                flyout.style.display = 'block';
            }, HOLD_DURATION);
        }, { passive: false });
        
        button.addEventListener('touchend', (e) => {
            if (button.disabled) return;
            e.preventDefault();
            clearTimeout(holdTimer);
            if (!isHolding) {
                haptic('light');
                onResult(lazyResult); 
            }
        });
        
        // (Desktop)
         button.addEventListener('mousedown', (e) => {
            if (button.disabled) return;
            if (e.button === 2) { 
                 e.preventDefault();
                 flyout.style.display = 'block';
            }
         });
         button.addEventListener('click', (e) => {
             if (button.disabled) return;
             haptic('light');
             onResult(lazyResult);
         });
         document.addEventListener('click', (e) => {
            if (flyout && !flyout.contains(e.target) && !button.contains(e.target)) {
                flyout.style.display = 'none';
            }
         });
    };
    
    attachListeners(ui.btnPlayer, 'P_UNKNOWN', ui.flyoutP);
    attachListeners(ui.btnBanker, 'B_UNKNOWN', ui.flyoutB);
    
    ui.btnTie.addEventListener('click', () => { 
        haptic('light'); 
        onResult('T'); 
    });
}


// A. กดปุ่มผลลัพธ์ (ฟังก์ชันกลาง)
window.onResult = function(result) { 
    if (!aiWorker) return alert('ข้อผิดพลาด: "สมอง AI" ยังไม่พร้อม');
    
    ui.flyoutP.style.display = 'none';
    ui.flyoutB.style.display = 'none';
    
    resetCountdown();
    setControlsDisabled(true);
    
    ui.predCircle.textContent = '...';
    ui.predCircle.className = 'pred-circle';
    ui.condBox.textContent = "กำลังวิเคราะห์...";
    
    aiWorker.postMessage({ command: 'ADD_HAND', result: result });
}

// (‼️‼️ เพิ่ม: "หน้าต่างยืนยัน 'กันพลาด'" ‼️‼️)
function showConfirm(title, body, callback) {
    ui.confirmModalTitle.textContent = title;
    ui.confirmModalBody.textContent = body;
    
    ui.confirmBtnYes.onclick = () => {
        closeModal('confirmModal');
        if (callback) callback();
    };
    ui.confirmBtnNo.onclick = () => {
        closeModal('confirmModal');
    };
    
    openModal('confirmModal');
}

// B. กด Undo
window.onUndo = function() {
    if (!aiWorker) return;
    showConfirm(
        'ยืนยันการ UNDO',
        'คุณต้องการยกเลิก "ตาที่แล้ว" จริงหรือไม่?',
        () => {
            setControlsDisabled(true);
            ui.predCircle.textContent = '...';
            ui.condBox.textContent = "กำลังย้อนกลับ...";
            aiWorker.postMessage({ command: 'UNDO_LAST_HAND' });
        }
    );
}

// C. กด เริ่มขอนไพ่ใหม่
window.onNewShoe = function() {
    if (!aiWorker) return;
    showConfirm(
        'ยืนยันการเริ่มขอนไพ่ใหม่',
        'สถิติ Winrate (ขอนนี้) จะถูกรีเซ็ต คุณแน่ใจหรือไม่?',
        () => {
            setControlsDisabled(true);
            ui.predCircle.textContent = '...';
            ui.condBox.textContent = "กำลังเริ่มขอนใหม่...";
            
            // (Optimistic Update)
            ui.winRateShoe.textContent = `- %`;
            ui.winShoe.textContent = 0;
            ui.loseShoe.textContent = 0;
            ui.statusShoeHands.textContent = `0 ตา`;
            renderBigRoad([]);
            
            aiWorker.postMessage({ command: 'NEW_SHOE' });
            resetCountdown();
        }
    );
}

// (‼️‼️ เพิ่ม: "ลบขอนนี้" ‼️‼️)
window.onDeleteShoe = function() {
    if (!aiWorker) return;
    showConfirm(
        'อันตราย! ยืนยันการลบขอนไพ่',
        'คุณต้องการ "ลบ" ข้อมูลทั้งหมดของ "ขอนไพ่ปัจจุบัน" ทิ้งถาวรหรือไม่? (ระบบจะย้อนกลับไปขอนที่แล้ว)',
        () => {
            setControlsDisabled(true);
            ui.predCircle.textContent = '...';
            ui.condBox.textContent = "กำลังลบขอนไพ่...";
            aiWorker.postMessage({ command: 'DELETE_CURRENT_SHOE' });
        }
    );
}


// D. กด แก้ไขประวัติ
window.onEditHistory = function() {
    if (!aiWorker) return;
    ui.historyFilter.value = 'all';
    aiWorker.postMessage({ command: 'GET_HISTORY', filter: 'all' });
    openModal('historyModal');
}
ui.historyFilter.onchange = () => {
     aiWorker.postMessage({ command: 'GET_HISTORY', filter: ui.historyFilter.value });
};


// E. (‼️‼️ อัปเกรด: SETTINGS CONTROLS ‼️‼️)
ui.settingsRiskSlider.oninput = function() {
    updateRiskSliderUI(this.value);
};
window.onSaveTrigger = function() {
    const newValue = parseInt(ui.settingsRiskSlider.value, 10);
    currentTriggerValue = newValue; 
    saveSettings(); 
    aiWorker.postMessage({ command: 'UPDATE_CONFIG', config: { riskThreshold: newValue } });
    alert(`บันทึกค่าความมั่นใจเป็น ${newValue} เรียบร้อยแล้ว`);
    closeModal('settingsModal');
}
window.onCancelTrigger = function() {
    updateRiskSliderUI(currentTriggerValue); // (เด้งกลับค่าเดิม)
    closeModal('settingsModal');
}
window.onSetTriggerDefault = function() {
    const defaultValue = 5;
    updateRiskSliderUI(defaultValue);
}
// (ฟังก์ชันกลางสำหรับอัปเดต Slider UI)
function updateRiskSliderUI(value = null) {
    if (value) {
        ui.settingsRiskSlider.value = value;
    } else {
        value = ui.settingsRiskSlider.value;
    }
    
    if (appSettings.useMetaMind) {
        // (โหมด Meta-mind: 1-9)
        const riskMap = {
            1: "บุกหนัก (Aggressive) (1)",
            2: "บุกหนัก (Aggressive) (2)",
            3: "บุก (Aggressive) (3)",
            4: "สมดุล (Balanced) (4)",
            5: "สมดุล (Balanced) (5)",
            6: "สมดุล (Balanced) (6)",
            7: "ปลอดภัย (Safe) (7)",
            8: "ปลอดภัย (Safe) (8)",
            9: "ปลอดภัยมาก (Very Safe) (9)"
        };
        ui.settingsRiskLabel.textContent = riskMap[value];
        ui.settingsRiskDesc.textContent = "ปรับ 'ระดับความเสี่ยง' ที่คุณยอมรับได้ (คำนวณจากคะแนน AI ถ่วงน้ำหนัก)";
    } else {
        // (โหมดปกติ: 1-9)
        ui.settingsRiskLabel.textContent = `(${value}/9 เสียง)`;
        ui.settingsRiskDesc.textContent = "ปรับ 'เสียงโหวต' ขั้นต่ำที่ AI (Hunter) ต้องมี ก่อนส่ง Signal";
    }
}


// F. การ Backup (Export/Import)
window.onExportCSV = function() {
    if (!aiWorker) return;
    showConfirm('ยืนยันการ Export', 'คุณต้องการ Export ประวัติทั้งหมด (หนังสือเรียน) เป็นไฟล์ CSV หรือไม่?', () => {
        ui.appStatus.textContent = "สถานะ: กำลังสร้างไฟล์ CSV...";
        aiWorker.postMessage({ command: 'EXPORT_CSV' });
    });
}
window.onImportCSV = function() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const csvString = event.target.result;
            confirmImport(csvString);
        };
        reader.readAsText(file);
    };
    fileInput.click();
}
window.onRetrain = function() {
    const csvString = ui.csvPasteArea.value;
    if (!csvString || csvString.trim().length < 10) {
        return alert('กรุณา "วาง" ข้อมูล CSV ลงในช่องข้อความก่อน\n(หรือใช้ปุ่ม Import CSV)');
    }
    confirmImport(csvString);
}
function confirmImport(csvString) {
    showConfirm(
        'คำเตือน! ฝึกสมองใหม่!',
        'การกระทำนี้จะ "ลบ" สมอง AI ทั้งหมด แล้ว "ฝึกใหม่" จากข้อมูลที่ Import... คุณแน่ใจหรือไม่?',
        () => {
            if (!aiWorker) return alert('ข้อผิดพลาด: "สมอง AI" ยังไม่พร้อม');
            ui.retrainOverlay.style.display = 'flex';
            ui.retrainProgressBar.style.width = '0%';
            ui.retrainStatus.textContent = "สถานะ: เริ่มต้น... (กำลังส่งข้อมูล)";
            aiWorker.postMessage({ command: 'RETRAIN_FROM_CSV', csvString: csvString });
            closeModal('settingsModal');
            ui.csvPasteArea.value = '';
        }
    );
}
function downloadCSV(csvString, filename) {
    ui.appStatus.textContent = "สถานะ: พร้อม";
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    alert('Export CSV สำเร็จ! ไฟล์ถูกบันทึกในโฟลเดอร์ Downloads ของคุณ');
}


// G. โซนอันตราย
window.onClearMemory = function() {
    showConfirm(
        'อันตราย!!! ยืนยันครั้งที่ 1',
        'คุณแน่ใจหรือไม่ว่าต้องการ "ล้างสมอง AI" ทั้งหมด? (ไม่สามารถกู้คืนได้ ยกเว้นมี CSV Backup)',
        () => {
            showConfirm(
                'ยืนยันครั้งสุดท้าย!',
                'ลบสมอง AI ทั้งหมดจริงๆ หรือไม่?',
                () => {
                    if (!aiWorker) return alert('ข้อผิดพลาด: "สมอง AI" ยังไม่พร้อม');
                    aiWorker.postMessage({ command: 'CLEAR_ALL_MEMORY' });
                    alert('ลบสมอง AI ทั้งหมดเรียบร้อยแล้ว');
                    localStorage.removeItem('oc_baccarat_settings'); // (ลบ Setting ด้วย)
                    location.reload();
                }
            );
        }
    );
}
// (BIST)
window.onRunBIST = function() {
    if (!aiWorker) return;
    showConfirm('ตรวจสุขภาพสมอง', 'คุณต้องการสแกนหาข้อมูลขยะ หรือข้อมูลที่ผิดพลาดใน IndexedDB หรือไม่?', () => {
        aiWorker.postMessage({ command: 'RUN_BIST' });
    });
}
// (‼️‼️ เพิ่ม: AUTO-REPAIR ‼️‼️)
window.onResyncBrain = function() {
    if (!aiWorker) return;
    showConfirm(
        'ยืนยันการซิงค์สถิติสมองใหม่',
        'การกระทำนี้จะ "คำนวณสถิติและ Winrate AI ทั้งหมดใหม่" จากประวัติจริง (อาจใช้เวลาสักครู่หากข้อมูลเยอะ)\n\nใช้ปุ่มนี้เมื่อ BIST ตรวจพบว่าข้อมูลไม่ตรงกัน',
        () => {
            ui.retrainOverlay.style.display = 'flex';
            ui.retrainProgressBar.style.width = '0%';
            ui.retrainStatus.textContent = "สถานะ: เริ่มต้นการซ่อมแซม...";
            aiWorker.postMessage({ command: 'REPAIR_BRAIN' });
            closeModal('settingsModal');
        }
    );
}


// H. (‼️‼️ อัปเกรด: SETTINGS ‼️‼️)
function saveSettings() {
    localStorage.setItem('oc_baccarat_settings', JSON.stringify({
        trigger: currentTriggerValue,
        powerMode: appSettings.powerMode,
        haptics: appSettings.haptics,
        useMetaMind: appSettings.useMetaMind // (‼️‼️ เพิ่ม ‼️‼️)
    }));
}
function loadSettings() {
    const saved = localStorage.getItem('oc_baccarat_settings');
    if (saved) {
        const settings = JSON.parse(saved);
        // (ป้องกันข้อมูลเก่าพัง)
        appSettings.powerMode = settings.powerMode || false;
        appSettings.haptics = (settings.haptics !== undefined) ? settings.haptics : true;
        appSettings.useMetaMind = settings.useMetaMind || false; // (‼️‼️ เพิ่ม ‼️‼️)
        currentTriggerValue = settings.trigger || 5;
    }
    // (อัปเดต UI)
    ui.settingsRiskSlider.value = currentTriggerValue;
    ui.togglePowerMode.checked = appSettings.powerMode;
    ui.toggleHaptics.checked = !appSettings.haptics;
    ui.toggleMetaMind.checked = appSettings.useMetaMind; // (‼️‼️ เพิ่ม ‼️‼️)
}
window.onTogglePowerMode = function(isChecked) {
    appSettings.powerMode = isChecked;
    saveSettings();
    aiWorker.postMessage({ command: 'UPDATE_CONFIG', config: { powerMode: isChecked } });
    alert('โหมดประหยัดพลังงาน: ' + (isChecked ? 'เปิด' : 'ปิด'));
}
window.onToggleHaptics = function(isChecked) {
    appSettings.haptics = !isChecked; // (Checkbox คือ "ปิด")
    saveSettings();
}
// (‼️‼️ เพิ่ม: META-MIND TOGGLE ‼️‼️)
window.onToggleMetaMind = function(isChecked) {
    appSettings.useMetaMind = isChecked;
    saveSettings();
    aiWorker.postMessage({ command: 'UPDATE_CONFIG', config: { useMetaMind: isChecked } });
    updateRiskSliderUI(); // (อัปเดตข้อความ Slider)
    alert('Meta-mind (AI ถ่วงน้ำหนัก): ' + (isChecked ? 'เปิด (God-Tier)' : 'ปิด (โหมดปกติ)'));
}


// 9. Modal Controls (การเปิด/ปิดหน้าต่าง)
window.openModal = function(id) { 
    if (id === 'historyHubModal') {
        aiWorker.postMessage({ command: 'GET_SHOE_SUMMARY' });
    }
    // (อัปเดต UI Slider ทุกครั้งที่เปิด Setting)
    if (id === 'settingsModal') {
        updateRiskSliderUI(currentTriggerValue);
    }
    document.getElementById(id).style.display = 'block'; 
}
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; }


// 10. Start Application (เริ่มแอป!)
// (รอให้ DOM โหลดเสร็จก่อนเริ่ม เพื่อความเสถียร)
document.addEventListener('DOMContentLoaded', () => {
    initializeWorker();
    resetCountdown(); 
    setupSmartControls(); // (เริ่มระบบ 'แตะ/แตะค้าง')
});
