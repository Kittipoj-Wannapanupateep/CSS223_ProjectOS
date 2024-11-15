let processes = [
    { id: "P1", arrivalTime: 0, burstTime: 7, priority: 2 },
    { id: "P2", arrivalTime: 2, burstTime: 4, priority: 1 },
    { id: "P3", arrivalTime: 4, burstTime: 1, priority: 3 },
    { id: "P4", arrivalTime: 5, burstTime: 4, priority: 2 },
    { id: "P5", arrivalTime: 6, burstTime: 3, priority: 1 }
];


function renderProcesses() {
    const container = document.getElementById('processes');
    container.innerHTML = '';
    processes.forEach((process, index) => {
        const row = document.createElement('div');
        row.className = 'process-row';
        row.innerHTML = `
            <div class="input-group">
                <label>Process</label>
                <div class="process-id">${process.id}</div>
            </div>
            <div class="input-group">
                <label>Arrival Time</label>
                <input type="number" value="${process.arrivalTime}" min="0" 
                    onchange="updateProcess(${index}, 'arrivalTime', this.value)">
            </div>
            <div class="input-group">
                <label>Burst Time</label>
                <input type="number" value="${process.burstTime}" min="1"
                    onchange="updateProcess(${index}, 'burstTime', this.value)">
            </div>
            <div class="input-group">
                <label>Priority</label>
                <input type="number" value="${process.priority}" min="1"
                    onchange="updateProcess(${index}, 'priority', this.value)">
            </div>
            <button class="remove-btn" onclick="removeProcess(${index})">Remove</button>
        `;
        container.appendChild(row);
    });
}


function addProcess() {
    const newProcess = {
        id: `P${processes.length + 1}`,
        arrivalTime: 0,
        burstTime: 1,
        priority: 1
    };
    processes.push(newProcess);
    renderProcesses();
}


function updateProcess(index, field, value) {
    processes[index][field] = parseInt(value);
}


function removeProcess(index) {
    processes.splice(index, 1);
    processes.forEach((p, i) => p.id = `P${i + 1}`);
    renderProcesses();
}


function getProcessColor(processId) {
    const colors = [
        "#3b82f6", // blue
        "#22c55e", // green
        "#a855f7", // purple
        "#eab308", // yellow
        "#ef4444", // red
        "#6366f1", // indigo
        "#ec4899"  // pink
    ];
    const index = parseInt(processId.replace("P", "")) % colors.length;
    return colors[index];
}


function toggleQuantumInput() {
    const algorithm = document.getElementById('algorithm').value;
    const quantumContainer = document.getElementById('quantum-container');
    quantumContainer.style.display = (algorithm === 'rr' || algorithm === 'mlq') ? 'block' : 'none';
}


function fcfs(processes) {
    let time = 0;
    let ganttChart = [];
    let waitingTime = 0;
    let turnaroundTime = 0;

    processes.forEach(process => {
        if (time < process.arrivalTime) {
            time = process.arrivalTime;
        }
        const startTime = time;
        const endTime = startTime + process.burstTime;
        time = endTime;

        process.finishTime = endTime;

        ganttChart.push({
            id: process.id,
            start: startTime,
            end: endTime
        });

        const wt = startTime - process.arrivalTime;
        const tat = endTime - process.arrivalTime;
        process.waitingTime = wt;
        process.turnaroundTime = tat;
        waitingTime += wt;
        turnaroundTime += tat;
    });

    const averageWaitingTime = waitingTime / processes.length;
    const averageTurnaroundTime = turnaroundTime / processes.length;

    return {
        ganttChart,
        processes,
        averageWaitingTime,
        averageTurnaroundTime
    };
}


function roundRobin(processes, timeQuantum) {
    let time = 0;
    let ganttChart = [];
    let queue = [...processes.map(p => ({ ...p, remainingTime: p.burstTime }))];
    let completedProcesses = 0;

    while (completedProcesses < processes.length) {
        for (let i = 0; i < queue.length; i++) {
            const process = queue[i];
            if (process.remainingTime > 0 && process.arrivalTime <= time) {
                const timeSlice = Math.min(process.remainingTime, timeQuantum);

                if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === process.id) {
                    ganttChart[ganttChart.length - 1].end += timeSlice;
                } else {
                    ganttChart.push({
                        id: process.id,
                        start: time,
                        end: time + timeSlice
                    });
                }

                process.remainingTime -= timeSlice;
                time += timeSlice;

                if (process.remainingTime === 0) {
                    completedProcesses++;
                }
            }
        }

        if (queue.every(p => p.remainingTime === 0 || p.arrivalTime > time)) {
            time = Math.min(...queue.filter(p => p.remainingTime > 0).map(p => p.arrivalTime));
        }
    }

    const completionTimes = processes.map((p, i) => {
        const ganttEntry = ganttChart.filter(block => block.id === p.id);
        const finishTime = ganttEntry.length > 0 ? ganttEntry[ganttEntry.length - 1].end : 0;
        p.finishTime = finishTime;
        return finishTime;
    });

    const waitingTimes = processes.map((p, i) => {
        const wt = completionTimes[i] - p.arrivalTime - p.burstTime;
        p.waitingTime = wt;
        return wt;
    });

    const turnaroundTimes = processes.map((p, i) => {
        const tat = waitingTimes[i] + p.burstTime;
        p.turnaroundTime = tat;
        return tat;
    });

    const averageWaitingTime = waitingTimes.reduce((sum, wt) => sum + wt, 0) / processes.length;
    const averageTurnaroundTime = turnaroundTimes.reduce((sum, tat) => sum + tat, 0) / processes.length;

    return {
        ganttChart,
        processes,
        averageWaitingTime,
        averageTurnaroundTime
    };
}


function sjf(processes) {
    const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
    const n = processes.length;
    const ganttChart = [];
    const completionTime = {};
    let currentTime = 0;
    let completed = 0;

    while (completed < n) {
        let shortestJob = null;
        let shortestBurst = Number.MAX_VALUE;
        for (const process of sortedProcesses) {
            if (!completionTime[process.id] && process.arrivalTime <= currentTime && process.burstTime < shortestBurst) {
                shortestJob = process;
                shortestBurst = process.burstTime;
            }
        }
        if (shortestJob === null) {
            currentTime++;
            continue;
        }
        ganttChart.push({
            id: shortestJob.id,
            start: currentTime,
            end: currentTime + shortestJob.burstTime
        });
        currentTime += shortestJob.burstTime;
        completionTime[shortestJob.id] = currentTime;
        
        shortestJob.finishTime = currentTime;

        completed++;
    }

    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;

    for (const process of processes) {
        const turnAroundTime = completionTime[process.id] - process.arrivalTime;
        const waitingTime = turnAroundTime - process.burstTime;
        
        process.waitingTime = waitingTime;
        process.turnaroundTime = turnAroundTime;

        totalWaitingTime += waitingTime;
        totalTurnaroundTime += turnAroundTime;
    }

    return {
        ganttChart,
        processes, 
        averageWaitingTime: totalWaitingTime / n,
        averageTurnaroundTime: totalTurnaroundTime / n
    };
}


function srtf(processes) {
    let time = 0; 
    let ganttChart = []; 
    let remainingProcesses = [...processes.map(p => ({ ...p, remainingTime: p.burstTime }))]; 
    let completedProcesses = 0;
    let completionTimes = new Array(processes.length).fill(0);

    while (completedProcesses < processes.length) {
        const availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= time && p.remainingTime > 0);

        if (availableProcesses.length > 0) {
            const shortestProcess = availableProcesses.reduce((prev, current) => 
                (prev.remainingTime < current.remainingTime) ? prev : current
            );

            if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === shortestProcess.id) {
                ganttChart[ganttChart.length - 1].end += 1; 
            } else {
                ganttChart.push({
                    id: shortestProcess.id,
                    start: time,
                    end: time + 1 
                });
            }

            shortestProcess.remainingTime -= 1; 
            time += 1; 
            
            if (shortestProcess.remainingTime === 0) {
                const processIndex = processes.findIndex(p => p.id === shortestProcess.id);
                completionTimes[processIndex] = time; 
                processes[processIndex].finishTime = time; 
                completedProcesses++; 
            }
        } else {
            time = Math.min(...remainingProcesses.filter(p => p.remainingTime > 0).map(p => p.arrivalTime));
        }
    }

    const waitingTimes = processes.map((p, i) => {
        return completionTimes[i] - p.arrivalTime - p.burstTime; 
    });

    const turnaroundTimes = processes.map((p, i) => {
        return waitingTimes[i] + p.burstTime; 
    });

    processes.forEach((process, i) => {
        process.waitingTime = waitingTimes[i];
        process.turnaroundTime = turnaroundTimes[i];
        process.finishTime = completionTimes[i];
    });

    const averageWaitingTime = waitingTimes.reduce((sum, wt) => sum + wt, 0) / processes.length;
    const averageTurnaroundTime = turnaroundTimes.reduce((sum, tat) => sum + tat, 0) / processes.length;

    return {
        ganttChart,
        processes,
        averageWaitingTime,
        averageTurnaroundTime
    };
}


function prioritySchedulingPreemptive(processes) {
    const n = processes.length;
    const ganttChart = [];
    const completionTime = {};
    let currentTime = 0;
    let remainingProcesses = n;
    let ongoingProcess = null;

    const originalProcesses = [...processes];

    processes.forEach(process => process.remainingTime = process.burstTime);

    while (remainingProcesses > 0) {
        let highestPriorityProcess = null;
        let lowestPriorityValue = Number.MAX_VALUE;

        for (const process of processes) {
            if (process.remainingTime > 0 && process.arrivalTime <= currentTime && process.priority < lowestPriorityValue) {
                highestPriorityProcess = process;
                lowestPriorityValue = process.priority;
            }
        }

        if (highestPriorityProcess === null) {
            currentTime++;
            continue;
        }

        if (ongoingProcess !== highestPriorityProcess) {
            ganttChart.push({
                id: highestPriorityProcess.id,
                start: currentTime,
                end: currentTime + 1 
            });
            ongoingProcess = highestPriorityProcess;
        } else {
            ganttChart[ganttChart.length - 1].end++;
        }

        highestPriorityProcess.remainingTime--;
        currentTime++;

        if (highestPriorityProcess.remainingTime === 0) {
            completionTime[highestPriorityProcess.id] = currentTime;
            highestPriorityProcess.finishTime = currentTime; 
            remainingProcesses--;
            ongoingProcess = null;
        }
    }

    processes.forEach(process => {
        const turnAroundTime = completionTime[process.id] - process.arrivalTime;
        const waitingTime = turnAroundTime - process.burstTime;
        process.turnaroundTime = turnAroundTime;
        process.waitingTime = waitingTime;
    });

    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;

    processes.forEach(process => {
        totalWaitingTime += process.waitingTime;
        totalTurnaroundTime += process.turnaroundTime;
    });

    return {
        ganttChart,
        averageWaitingTime: totalWaitingTime / n,
        averageTurnaroundTime: totalTurnaroundTime / n,
        processes: originalProcesses
    };
}


function hrrn(processes) {
    let time = 0;
    let ganttChart = [];
    let waitingTime = 0;
    let turnaroundTime = 0;
    let completedProcesses = 0;
    const processCount = processes.length;
    let remainingProcesses = [...processes];
    let processResults = []; 

    while (completedProcesses < processCount) {
        const availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= time);
        
        if (availableProcesses.length > 0) {
            const responseRatios = availableProcesses.map(p => {
                const waitTime = time - p.arrivalTime;
                return {
                    process: p,
                    ratio: (waitTime + p.burstTime) / p.burstTime
                };
            });

            const selectedProcess = responseRatios.reduce((prev, current) => 
                (prev.ratio > current.ratio) ? prev : current
            ).process;

            const startTime = time;
            const endTime = startTime + selectedProcess.burstTime;

            time = endTime;

            ganttChart.push({
                id: selectedProcess.id,
                start: startTime,
                end: endTime
            });

            const wt = startTime - selectedProcess.arrivalTime;
            const tat = endTime - selectedProcess.arrivalTime;

            waitingTime += wt;
            turnaroundTime += tat;

            processResults.push({
                id: selectedProcess.id,
                waitingTime: wt,
                turnaroundTime: tat,
                finishTime: endTime 
            });

            remainingProcesses = remainingProcesses.filter(p => p.id !== selectedProcess.id);
            completedProcesses++;
        } else {
            time = Math.min(...remainingProcesses.map(p => p.arrivalTime));
        }
    }

    const averageWaitingTime = waitingTime / processes.length;
    const averageTurnaroundTime = turnaroundTime / processes.length;

    const orderedProcessResults = processes.map(proc => {
        const result = processResults.find(r => r.id === proc.id);
        return {
            id: proc.id,
            waitingTime: result.waitingTime,
            turnaroundTime: result.turnaroundTime,
            finishTime: result.finishTime
        };
    });

    return {
        ganttChart,
        averageWaitingTime,
        averageTurnaroundTime,
        processes: orderedProcessResults 
    };
}


function multilevelQueueWithFeedback(processes, baseTimeQuantum) {
    let time = 0;
    let ganttChart = [];
    let queue = processes.map(p => ({ ...p, remainingTime: p.burstTime, queueLevel: 0 }));
    let completedProcesses = 0;
    let maxQueueLevel = 3;
    let completionTimes = Array(processes.length).fill(0);
    let finishTimes = Array(processes.length).fill(0);

    const calculateTimeQuantum = (level) => baseTimeQuantum * (2 ** level);

    while (completedProcesses < processes.length) {
        let processExecuted = false;

        for (let i = 0; i < queue.length; i++) {
            const process = queue[i];
            if (process.remainingTime > 0 && process.arrivalTime <= time) {
                const currentQuantum = calculateTimeQuantum(process.queueLevel);
                const timeSlice = Math.min(process.remainingTime, currentQuantum);

                if (ganttChart.length > 0 && ganttChart[ganttChart.length - 1].id === process.id) {
                    ganttChart[ganttChart.length - 1].end += timeSlice;
                } else {
                    ganttChart.push({
                        id: process.id,
                        start: time,
                        end: time + timeSlice
                    });
                }

                process.remainingTime -= timeSlice;
                time += timeSlice;
                processExecuted = true;

                if (process.remainingTime === 0) {
                    completionTimes[i] = time;
                    finishTimes[i] = time; 
                    completedProcesses++;
                } else {
                    process.queueLevel = Math.min(process.queueLevel + 1, maxQueueLevel - 1);
                }
            }
        }

        if (!processExecuted) {
            time = Math.min(...queue.filter(p => p.remainingTime > 0).map(p => p.arrivalTime));
        }
    }

    const waitingTimes = processes.map((p, i) => completionTimes[i] - p.arrivalTime - p.burstTime);
    const turnaroundTimes = processes.map((p, i) => waitingTimes[i] + p.burstTime);

    return {
        ganttChart,
        averageWaitingTime: waitingTimes.reduce((sum, wt) => sum + wt, 0) / processes.length,
        averageTurnaroundTime: turnaroundTimes.reduce((sum, tat) => sum + tat, 0) / processes.length,
        processes: processes.map((p, i) => ({
            ...p,
            waitingTime: waitingTimes[i],
            turnaroundTime: turnaroundTimes[i],
            finishTime: finishTimes[i] 
        }))
    };
}


function simulate() {
    const algorithm = document.getElementById('algorithm').value;
    let result;
    let timeQuantum;
    if (algorithm === 'rr' || algorithm === 'mlq') {
        timeQuantum = parseInt(document.getElementById('timeQuantum').value);
    }
    switch (algorithm) {
        case 'sjf':
            result = sjf(processes);
            break;
        case 'priority':
            result = prioritySchedulingPreemptive(processes);
            break;
        case 'fcfs':
            result = fcfs(processes);
            break;
        case 'rr':
            result = roundRobin(processes, timeQuantum); 
            break;
        case 'srtf':
            result = srtf(processes);
            break;
        case 'hrrn':
            result = hrrn(processes);
            break;
        case 'mlq':
            result = multilevelQueueWithFeedback(processes, timeQuantum);
            break;
        default:
            return;
    }
    
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('process-details').classList.remove('hidden');
    
    const ganttChart = document.getElementById('gantt-chart');
    ganttChart.innerHTML = '';
    
    result.ganttChart.forEach(block => {
        const width = (block.end - block.start) * 50;
        
        const processContainer = document.createElement('div');
        processContainer.style.display = 'flex';
        processContainer.style.flexDirection = 'column';
        processContainer.style.alignItems = 'center';
        processContainer.style.width = `${width}px`;

        const processBlock = document.createElement('div');
        processBlock.className = 'process-block';
        processBlock.style.width = '100%';
        processBlock.style.backgroundColor = getProcessColor(block.id);
        processBlock.textContent = block.id;

        const timeLabel = document.createElement('div');
        timeLabel.style.textAlign = 'center';
        timeLabel.style.fontSize = '12px';
        timeLabel.style.color = '#666';
        timeLabel.textContent = `${block.start} - ${block.end}`;

        processContainer.appendChild(processBlock);
        processContainer.appendChild(timeLabel);
        ganttChart.appendChild(processContainer);
    });
    document.getElementById('averages').innerHTML = `
        <p><strong>Average Waiting Time:</strong> ${result.averageWaitingTime.toFixed(2)}</p>
        <p><strong>Average Turnaround Time:</strong> ${result.averageTurnaroundTime.toFixed(2)}</p>`;

    const processDetails = document.getElementById('process-details');
    processDetails.innerHTML = '<h2>Process Details</h2>';
    result.processes.forEach(proc => {
        const detail = document.createElement('p');
        detail.innerHTML = `
            <strong>${proc.id}</strong>: Turnaround Time = ${proc.turnaroundTime.toFixed(2)} , Waiting Time = ${proc.waitingTime.toFixed(2)} , Finish Time = ${proc.finishTime}`;
        processDetails.appendChild(detail);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderProcesses();
    document.querySelector('.add-btn').addEventListener('click', addProcess);
});
