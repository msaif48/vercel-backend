const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); 
app.use(express.json()); 

// ==========================================
// 🔒 THE SECRET VAULT: Core Algorithms
// ==========================================
const SETBACKS = { front: 3, rear: 2, sides: 1.5 };
const WALL_EXT = 0.3;

const types = {
    Staircase:      { zone: {order: 0}, min: 2.0 },
    Corridor:       { zone: {order: 0}, min: 1.5 },
    Hall:           { zone: {order: 2}, min: 3.0 },
    Dining:         { zone: {order: 2}, min: 2.5 },
    "Sit-out":      { zone: {order: 2}, min: 1.5 },
    Kitchen:        { zone: {order: 1}, min: 2.5 },
    "Common Bath":  { zone: {order: 1}, min: 1.5 },
    "Car Porch":    { zone: {order: 1}, min: 3.0 },
    Bedroom:        { zone: {order: 3}, min: 3.0 },
    Pooja:          { zone: {order: 3}, min: 1.5 },
    "Attached Bath":{ zone: {order: 3}, min: 1.5 },
    Balcony:        { zone: {order: 2}, min: 1.5 }
};

function getMinDim(rooms) {
    return Math.min(...rooms.map(r => types[r.type]?.min || 2.0));
}

function bsp(x, y, w, h, rooms) {
    if (!rooms || rooms.length === 0) return;
    x = Math.round(x * 10) / 10; y = Math.round(y * 10) / 10;
    w = Math.round(w * 10) / 10; h = Math.round(h * 10) / 10;

    if (rooms.length === 1) { rooms[0].x = x; rooms[0].y = y; rooms[0].w = w; rooms[0].h = h; return; }
    
    let totalWeight = rooms.reduce((s,r)=>s+r.weight,0); let half = totalWeight / 2; let cur=0, idx=1;
    for(let i=0; i<rooms.length-1; i++){ cur += rooms[i].weight; if(cur >= half) { idx = i+1; break; } }
    
    let listA = rooms.slice(0, idx); let listB = rooms.slice(idx);
    let ratio = listA.reduce((s,r)=>s+r.weight,0) / totalWeight;

    let minA = getMinDim(listA); let minB = getMinDim(listB);

    if (w > h) { 
        let splitW = Math.round((w * ratio) * 10) / 10;
        if (splitW < minA) splitW = minA; if (w - splitW < minB) splitW = w - minB; if (splitW < minA) splitW = w / 2; 
        let remainW = Math.round((w - splitW) * 10) / 10;
        bsp(x, y, splitW, h, listA); bsp(Math.round((x + splitW)*10)/10, y, remainW, h, listB);
    } else { 
        let splitH = Math.round((h * ratio) * 10) / 10;
        if (splitH < minA) splitH = minA; if (h - splitH < minB) splitH = h - minB; if (splitH < minA) splitH = h / 2;
        let remainH = Math.round((h - splitH) * 10) / 10;
        bsp(x, y, w, splitH, listA); bsp(x, Math.round((y + splitH)*10)/10, w, remainH, listB);
    }
}

function mapRoomData(r, finalRooms, index) {
    let baseId = `room_${index}_${Math.random().toString(36).substr(2, 5)}`;
    finalRooms.push({type: r.type, x: r.x, y: r.y, w: r.w, h: r.h, id: baseId});
    if (r.hasBath) {
        let bw = Math.round(Math.max(1.5, Math.min(2.5, r.w * 0.4)) * 10)/10; let bh = Math.round(Math.max(1.5, Math.min(2.5, r.h * 0.4)) * 10)/10;
        let bx = Math.round((r.x + r.w - bw - WALL_EXT) * 10)/10; let by = Math.round((r.y + WALL_EXT) * 10)/10;
        finalRooms.push({type: 'Attached Bath', x: bx, y: by, w: bw, h: bh, id: `${baseId}_bath`});
    }
}

function doFloorBSP(roomsList, targetW, targetH, gfStair, isShuffle = false) {
    if (isShuffle) {
        let mainRooms = roomsList.filter(r => r.type !== 'Staircase'); let stair = roomsList.find(r => r.type === 'Staircase');
        mainRooms.sort(() => Math.random() - 0.5); roomsList = stair ? [stair, ...mainRooms] : mainRooms;
    } else {
        roomsList.sort((a, b) => types[a.type].zone.order - types[b.type].zone.order);
    }

    let finalRooms = [];
    const startX = SETBACKS.sides; const startY = SETBACKS.front;

    let stair = roomsList.find(r => r.type === 'Staircase'); let otherRooms = roomsList.filter(r => r.type !== 'Staircase');

    if (stair) {
        let stairW = gfStair ? gfStair.w : Math.max(2.5, Math.round(targetW * 0.25 * 10)/10);
        let stairH = gfStair ? gfStair.h : Math.max(3.5, Math.round(targetH * 0.3 * 10)/10);
        
        finalRooms.push({type: 'Staircase', x: startX, y: startY, w: stairW, h: stairH, id: 'stair'});
        
        let areaA = (targetW - stairW) * stairH; let areaB = targetW * (targetH - stairH); let ratioA = areaA / (areaA + areaB);
        let targetAWeight = otherRooms.reduce((s, r)=>s+r.weight, 0) * ratioA; let cur = 0, idx = 1;
        for(let i=0; i<otherRooms.length; i++) { cur += otherRooms[i].weight; if(cur >= targetAWeight && i < otherRooms.length - 1) { idx = i + 1; break; } }
        
        let listA = otherRooms.slice(0, idx); let listB = otherRooms.slice(idx);
        if (listA.length === 0 && listB.length > 1) listA.push(listB.shift()); if (listB.length === 0 && listA.length > 1) listB.push(listA.pop());
        
        let w1 = Math.round((targetW - stairW)*10)/10; let h2 = Math.round((targetH - stairH)*10)/10;
        bsp(Math.round((startX + stairW)*10)/10, startY, w1, stairH, listA);
        bsp(startX, Math.round((startY + stairH)*10)/10, targetW, h2, listB);
        
        [...listA, ...listB].forEach((r, i) => mapRoomData(r, finalRooms, i));
    } else {
        bsp(startX, startY, targetW, targetH, otherRooms);
        otherRooms.forEach((r, i) => mapRoomData(r, finalRooms, i));
    }
    return finalRooms;
}
// ==========================================


// --- ENDPOINT 1: Generate Entire Building ---
app.post('/api/generate-building', (req, res) => {
    const { A, F, N, L, W } = req.body;
    
    let buildingData = { floors: [], landL: L, landW: W, targetW: 0, targetH: 0 };
    
    let maxW = L - SETBACKS.sides * 2; let maxH = W - SETBACKS.front - SETBACKS.rear;
    let maxBuildableArea = (maxW > 0 && maxH > 0) ? (maxW * maxH) : 0;
    let safeA = Math.min(A, maxBuildableArea); 
    
    let tW = Math.round(Math.sqrt(safeA * 1.2) * 10) / 10; let tH = Math.round((safeA / tW) * 10) / 10;
    if (tW > maxW) { tW = maxW; tH = Math.round((safeA / tW) * 10) / 10; }
    if (tH > maxH) { tH = maxH; tW = Math.round((safeA / tH) * 10) / 10; }
    if (tW > maxW) tW = maxW; if (tH > maxH) tH = maxH;
    
    buildingData.targetW = tW; buildingData.targetH = tH;

    let bedsRem = N;
    for (let f = 0; f < F; f++) {
        let floorRooms = [];
        if (F > 1) floorRooms.push({type: 'Staircase', weight: 10});

        if (f === 0) {
            floorRooms.push({type: 'Car Porch', weight: 15}, {type: 'Sit-out', weight: 5}, {type: 'Hall', weight: 35}, {type: 'Dining', weight: 15}, {type: 'Kitchen', weight: 15}, {type: 'Common Bath', weight: 5});
            if (N >= 3) floorRooms.push({type: 'Pooja', weight: 5}); 
            if (F === 1 && N >= 2) floorRooms.push({type: 'Corridor', weight: 10});

            if (F === 1) { for(let i=0; i<N; i++) floorRooms.push({type: 'Bedroom', weight: 20, hasBath: i < Math.ceil(N/2)}); bedsRem = 0; } 
            else if (N >= 3) { floorRooms.push({type: 'Bedroom', weight: 20, hasBath: false}); bedsRem--; }
        } else {
            let bCount = Math.min(bedsRem, Math.ceil(bedsRem / (F - f)));
            if (bCount >= 2) floorRooms.push({type: 'Corridor', weight: 15}); 
            
            for(let i=0; i<bCount; i++) floorRooms.push({type: 'Bedroom', weight: 30, hasBath: (N - bedsRem + i) < Math.ceil(N/2)});
            bedsRem -= bCount;
            if (f === F - 1) floorRooms.push({type: 'Balcony', weight: 15});
            else floorRooms.push({type: 'Hall', weight: 20}); 
        }
        let gfStair = buildingData.floors[0]?.find(r => r.type === 'Staircase');
        buildingData.floors.push(doFloorBSP(floorRooms, tW, tH, gfStair, false));
    }

    res.json(buildingData);
});

// --- ENDPOINT 2: Shuffle/Pack Single Floor ---
app.post('/api/pack-floor', (req, res) => {
    const { roomsToShuffle, targetW, targetH, gfStair } = req.body;
    const newFloor = doFloorBSP(roomsToShuffle, targetW, targetH, gfStair, true);
    res.json(newFloor);
});

app.get('/', (req, res) => {
    res.send("✅ The Secure BSP Backend is live and running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secure Server running on port ${PORT}`));
