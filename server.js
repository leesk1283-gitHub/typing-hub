const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Socket.IO 설정
const io = new Server(server, {
    path: '/balloon-typing-game/socket.io'
});

const PORT = process.env.PORT || 3000;

// 1. 루트 접속 시 GitHub Pages의 풍선 게임 페이지로 리다이렉트 (사용자 요청)
app.get('/', (req, res) => {
    res.redirect('https://leesk1283-github.github.io/typing-hub/balloon-typing-game/');
});

// 2. 타자 연습
app.use('/typing-practice', express.static(path.join(__dirname, 'typing-practice')));

// 3. 풍선 타자 게임
app.use('/balloon-typing-game', express.static(path.join(__dirname, 'balloon-typing-game')));
app.get('/balloon-typing-game', (req, res) => {
    res.redirect('/balloon-typing-game/');
});

// 게임 데이터 관리
const rooms = new Map(); // roomId -> Room Object
const users = new Map(); // socketId -> User Object

const WORDS = {
    2: ['사과', '풍선', '나무', '하늘', '바다', '구름', '햇빛', '달빛', '별빛', '꽃잎', '눈물', '미소', '희망', '사랑', '행복', '친구', '가족', '학교', '도서', '음악'],
    3: ['비행기', '코끼리', '강아지', '고양이', '햄버거', '피아노', '컴퓨터', '자동차', '냉장고', '세탁기', '선풍기', '에어컨', '청소기', '스마트', '태블릿', '무지개', '민들레', '바나나', '오렌지', '토마토'],
    4: ['텔레비전', '전자렌지', '해바라기', '아이스크림', '스마트폰', '프로그램', '키보드판', '딸기우유', '바닐라맛', '생일파티'],
    5: ['크리스마스', '행복한하루', '아름다운세상', '즐거운여행', '소중한추억'],
    6: ['대한민국만세', '노트북컴퓨터', '초콜릿케이크']
};

const WORDS_EN = {
    2: ['apple', 'ball', 'tree', 'sky', 'sea', 'cloud', 'sun', 'moon', 'star', 'rain', 'snow', 'love', 'hope', 'wish', 'dream', 'song', 'book', 'desk', 'pen', 'cat', 'dog', 'cow', 'pig', 'hen', 'ant', 'bee', 'fly', 'bus', 'car', 'cup'],
    3: ['plane', 'robot', 'piano', 'radio', 'house', 'train', 'truck', 'ship', 'boat', 'bike', 'kite', 'doll', 'bear', 'lion', 'tiger', 'zebra', 'camel', 'eagle', 'snake', 'whale', 'shark', 'fish', 'frog', 'duck', 'swan', 'bird', 'owl'],
    4: ['computer', 'keyboard', 'monitor', 'printer', 'scanner', 'camera', 'laptop', 'tablet', 'mobile', 'phone', 'watch', 'clock', 'alarm', 'timer', 'robot', 'drone', 'rocket', 'planet', 'earth', 'world', 'space', 'galaxy', 'alien', 'ufo'],
    5: ['christmas', 'birthday', 'vacation', 'holiday', 'festival', 'carnival', 'parade', 'party', 'picnic', 'camping', 'hiking', 'climbing', 'swimming', 'running', 'walking', 'jumping', 'dancing', 'singing', 'playing', 'sleeping', 'eating', 'drinking', 'cooking', 'baking', 'reading', 'writing'],
    6: ['adventure', 'beautiful', 'wonderful', 'colorful', 'powerful', 'peaceful', 'cheerful', 'grateful', 'thankful', 'hopeful', 'joyful', 'lovely', 'friendly', 'kindly', 'happily', 'safely', 'bravely', 'brightly', 'clearly', 'loudly', 'softly', 'slowly', 'quickly', 'freely', 'truly', 'fairly', 'boldly']
}

function getRandomWord(language = 'ko') {
    const lengths = [2, 2, 2, 3, 3, 3, 3, 4, 4, 5, 5, 6];
    const length = lengths[Math.floor(Math.random() * lengths.length)];

    let wordList;
    if (language === 'en') {
        wordList = WORDS_EN[length] || WORDS_EN[2];
    } else {
        wordList = WORDS[length] || WORDS[2];
    }

    return wordList[Math.floor(Math.random() * wordList.length)];
}

function createBalloon(id, isInitial = false, existingBalloons = [], language = 'ko') {
    const usedWords = new Set(existingBalloons.map(b => b.word));
    let word = getRandomWord(language);

    let attempts = 0;
    while (usedWords.has(word) && attempts < 10) {
        word = getRandomWord(language);
        attempts++;
    }

    const x = 5 + Math.random() * 85;
    const y = isInitial ? (10 + Math.random() * 80) : (100 + Math.random() * 10);

    return {
        id,
        word,
        x,
        y,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        speed: Math.random() * 2 + 3,
        points: word.length * 10
    };
}

function createInitialBalloons(language = 'ko') {
    const balloons = [];
    for (let i = 0; i < 20; i++) {
        balloons.push(createBalloon(i, true, balloons, language));
    }
    return balloons;
}

function broadcastRoomList() {
    const roomList = [];
    rooms.forEach((room, roomId) => {
        const host = room.players.find(p => p.isHost);
        roomList.push({
            id: roomId,
            hostName: host ? host.name : 'Unknown',
            playerCount: room.players.length,
            maxPlayers: 8,
            isPlaying: room.gameState === 'playing',
            language: room.language || 'ko'
        });
    });
    io.emit('room-list', roomList);
}

io.on('connection', (socket) => {
    socket.on('login', (data) => {
        const name = data.name || `User${Math.floor(Math.random() * 1000)}`;
        users.set(socket.id, { id: socket.id, name, roomId: null });
        socket.emit('login-success', { name });
        broadcastRoomList();
    });

    socket.on('create-room', () => {
        const user = users.get(socket.id);
        if (!user) return;
        if (user.roomId) leaveRoom(socket);

        const roomId = `room_${Date.now()}`;
        const room = {
            roomId,
            players: [{
                id: user.id,
                name: user.name,
                isHost: true,
                ready: true,
                score: 0
            }],
            gameState: 'waiting',
            balloons: [],
            nextBalloonId: 20
        };

        rooms.set(roomId, room);
        user.roomId = roomId;
        socket.join(roomId);

        socket.emit('room-created', { roomId, isHost: true });
        io.to(roomId).emit('room-update', room);
        broadcastRoomList();
    });

    socket.on('join-room', (roomId) => {
        const user = users.get(socket.id);
        if (!user) return;

        const room = rooms.get(roomId);
        if (!room) {
            socket.emit('error', '방이 존재하지 않습니다.');
            return;
        }

        if (room.players.length >= 8) {
            socket.emit('error', '방이 가득 찼습니다.');
            return;
        }

        if (room.gameState === 'playing') {
            socket.emit('error', '이미 게임이 시작되었습니다.');
            return;
        }

        if (user.roomId) leaveRoom(socket);

        room.players.push({
            id: user.id,
            name: user.name,
            isHost: false,
            ready: false,
            score: 0
        });

        user.roomId = roomId;
        socket.join(roomId);

        socket.emit('room-joined', { roomId, isHost: false });
        io.to(roomId).emit('room-update', room);
        broadcastRoomList();
    });

    socket.on('quick-join', () => {
        let targetRoomId = null;
        for (const [roomId, room] of rooms) {
            if (room.gameState === 'waiting' && room.players.length < 8) {
                targetRoomId = roomId;
                break;
            }
        }

        if (targetRoomId) {
            socket.emit('quick-join-result', { roomId: targetRoomId });
        } else {
            socket.emit('error', '입장 가능한 방이 없습니다.');
        }
    });

    socket.on('ready', () => {
        const user = users.get(socket.id);
        if (!user || !user.roomId) return;

        const room = rooms.get(user.roomId);
        if (!room) return;

        const player = room.players.find(p => p.id === user.id);
        if (player && !player.isHost) {
            player.ready = !player.ready;
            io.to(user.roomId).emit('room-update', room);
        }
    });

    socket.on('kick-player', (targetId) => {
        const user = users.get(socket.id);
        if (!user || !user.roomId) return;

        const room = rooms.get(user.roomId);
        if (!room) return;

        if (room.players[0].id !== user.id) return;

        const targetIndex = room.players.findIndex(p => p.id === targetId);
        if (targetIndex !== -1) {
            const targetSocket = io.sockets.sockets.get(targetId);
            if (targetSocket) {
                targetSocket.leave(user.roomId);
                targetSocket.emit('kicked');
                const targetUser = users.get(targetId);
                if (targetUser) targetUser.roomId = null;
            }
            room.players.splice(targetIndex, 1);
            io.to(user.roomId).emit('room-update', room);
            broadcastRoomList();
        }
    });

    socket.on('change-language', (lang) => {
        const user = users.get(socket.id);
        if (!user || !user.roomId) return;

        const room = rooms.get(user.roomId);
        if (!room) return;

        if (room.players[0].id !== user.id) return;

        if (lang === 'ko' || lang === 'en') {
            room.language = lang;
            io.to(user.roomId).emit('room-update', room);
            broadcastRoomList();
        }
    });

    socket.on('start-game', () => {
        const user = users.get(socket.id);
        if (!user || !user.roomId) return;

        const room = rooms.get(user.roomId);
        if (!room) return;

        if (room.players[0].id !== user.id) return;

        const others = room.players.filter(p => !p.isHost);
        const allReady = others.every(p => p.ready);

        if (others.length > 0 && !allReady) {
            socket.emit('error', '모든 플레이어가 준비해야 합니다.');
            return;
        }

        room.gameState = 'starting';
        room.balloons = createInitialBalloons(room.language);
        room.players.forEach(p => p.score = 0);

        io.to(user.roomId).emit('game-start', {
            balloons: room.balloons,
            duration: 60000
        });

        setTimeout(() => {
            if (room.gameState === 'starting') {
                room.gameState = 'playing';

                setTimeout(() => {
                    if (room.gameState === 'playing') {
                        room.gameState = 'ended';

                        const scores = {};
                        room.players.forEach(p => scores[p.id] = p.score);

                        io.to(user.roomId).emit('game-end', {
                            scores,
                            players: room.players
                        });
                    }
                }, 61000); // 60초 게임 + 1초 버퍼
            }
        }, 3500);

        broadcastRoomList();
    });

    socket.on('pop-balloon', (data) => {
        const user = users.get(socket.id);
        if (!user || !user.roomId) return;

        const room = rooms.get(user.roomId);
        if (!room || room.gameState !== 'playing') return;

        const { balloonId, word } = data;
        const index = room.balloons.findIndex(b => b.id === balloonId);

        if (index === -1) return;
        if (room.balloons[index].word !== word) return;

        const player = room.players.find(p => p.id === user.id);
        if (player) {
            player.score += room.balloons[index].points;
        }

        const newBalloon = createBalloon(room.nextBalloonId++, false, room.balloons, room.language);
        room.balloons[index] = newBalloon;

        const scores = {};
        room.players.forEach(p => scores[p.id] = p.score);

        io.to(user.roomId).emit('balloon-popped', {
            balloonId,
            newBalloon,
            scores,
            poppedBy: user.name
        });
    });

    socket.on('balloon-missed', (data) => {
        const user = users.get(socket.id);
        if (!user || !user.roomId) return;

        const room = rooms.get(user.roomId);
        if (!room || room.gameState !== 'playing') return;

        const index = room.balloons.findIndex(b => b.id === data.balloonId);
        if (index === -1) return;

        const newBalloon = createBalloon(room.nextBalloonId++, false, room.balloons, room.language);
        room.balloons[index] = newBalloon;

        io.to(user.roomId).emit('balloon-popped', {
            balloonId: data.balloonId,
            newBalloon,
            scores: getScores(room),
            reason: 'missed'
        });
    });

    socket.on('leave-room', () => leaveRoom(socket));

    socket.on('play-again', () => {
        const user = users.get(socket.id);
        if (!user || !user.roomId) {
            socket.emit('error', '세션이 만료되었습니다. 새로고침 해주세요.');
            return;
        }
        const room = rooms.get(user.roomId);

        if (room) {
            room.gameState = 'waiting';
            room.players.forEach(p => {
                p.ready = false;
                p.score = 0;
            });

            const host = room.players.find(p => p.isHost);
            if (host) host.ready = true;

            socket.emit('back-to-waiting');
            io.to(user.roomId).emit('room-update', room);
            broadcastRoomList();
        }
    });

    socket.on('disconnect', () => {
        leaveRoom(socket);
        users.delete(socket.id);
    });

    function leaveRoom(socket) {
        const user = users.get(socket.id);
        if (!user || !user.roomId) return;

        const room = rooms.get(user.roomId);
        if (!room) return;

        const index = room.players.findIndex(p => p.id === user.id);
        if (index !== -1) {
            room.players.splice(index, 1);

            if (room.players.length === 0) {
                rooms.delete(user.roomId);
            } else {
                if (index === 0) {
                    room.players[0].isHost = true;
                    room.players[0].ready = true;
                }
                io.to(user.roomId).emit('room-update', room);
            }
        }

        socket.leave(user.roomId);
        user.roomId = null;
        broadcastRoomList();
    }

    function getScores(room) {
        const s = {};
        room.players.forEach(p => s[p.id] = p.score);
        return s;
    }
});

server.listen(PORT, () => {
    console.log(`🎈 Typing Hub Server is running on port ${PORT}`);
});
