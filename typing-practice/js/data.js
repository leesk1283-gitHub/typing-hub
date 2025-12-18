// 타자 연습 데이터 모듈

// 키보드 레이아웃 정의
const KEYBOARD_LAYOUT = {
    korean: [
        ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
        ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
        ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ']
    ],
    english: [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ]
};

// 키 코드 매핑 (물리적 키 위치)
const KEY_CODES = [
    ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'],
    ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL'],
    ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM']
];

// 한글 입력을 위한 매핑
const KOREAN_KEY_MAP = {
    'q': 'ㅂ', 'w': 'ㅈ', 'e': 'ㄷ', 'r': 'ㄱ', 't': 'ㅅ',
    'y': 'ㅛ', 'u': 'ㅕ', 'i': 'ㅑ', 'o': 'ㅐ', 'p': 'ㅔ',
    'a': 'ㅁ', 's': 'ㄴ', 'd': 'ㅇ', 'f': 'ㄹ', 'g': 'ㅎ',
    'h': 'ㅗ', 'j': 'ㅓ', 'k': 'ㅏ', 'l': 'ㅣ',
    'z': 'ㅋ', 'x': 'ㅌ', 'c': 'ㅊ', 'v': 'ㅍ',
    'b': 'ㅠ', 'n': 'ㅜ', 'm': 'ㅡ'
};

// 키에서 한글 자모로 역매핑
const KOREAN_CHAR_TO_KEY = {};
for (const [key, char] of Object.entries(KOREAN_KEY_MAP)) {
    KOREAN_CHAR_TO_KEY[char] = key.toUpperCase();
}

// 손가락 할당 (0-4: 왼손 새끼~엄지, 5-9: 오른손 엄지~새끼)
const FINGER_MAP = {
    'KeyQ': 0, 'KeyA': 0, 'KeyZ': 0,
    'KeyW': 1, 'KeyS': 1, 'KeyX': 1,
    'KeyE': 2, 'KeyD': 2, 'KeyC': 2,
    'KeyR': 3, 'KeyF': 3, 'KeyV': 3, 'KeyT': 3, 'KeyG': 3, 'KeyB': 3,
    'KeyY': 6, 'KeyH': 6, 'KeyN': 6, 'KeyU': 6, 'KeyJ': 6, 'KeyM': 6,
    'KeyI': 7, 'KeyK': 7, 'Comma': 7,
    'KeyO': 8, 'KeyL': 8, 'Period': 8,
    'KeyP': 9, 'Semicolon': 9, 'Slash': 9
};

// 자리 연습 정의
const POSITION_SETS = {
    basic: {
        name: '기본자리',
        korean: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅓ', 'ㅏ', 'ㅣ', ';'],
        english: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';'],
        keys: ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon']
    },
    upper: {
        name: '윗자리',
        korean: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
        english: ['Q', 'W', 'E', 'R', 'U', 'I', 'O', 'P'],
        keys: ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyU', 'KeyI', 'KeyO', 'KeyP']
    },
    lower: {
        name: '아랫자리',
        korean: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅡ', ',', '.', '/'],
        english: ['Z', 'X', 'C', 'V', 'M', ',', '.', '/'],
        keys: ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyM', 'Comma', 'Period', 'Slash']
    },
    middle: {
        name: '가운데자리',
        korean: ['ㅅ', 'ㅛ', 'ㅎ', 'ㅗ', 'ㅠ', 'ㅜ'],
        english: ['T', 'Y', 'G', 'H', 'B', 'N'],
        keys: ['KeyT', 'KeyY', 'KeyG', 'KeyH', 'KeyB', 'KeyN']
    }
};

// 낱말 연습용 단어 목록
const WORDS = {
    korean: [
        '사랑', '행복', '희망', '꿈', '미래', '가족', '친구', '학교', '공부', '노력',
        '성공', '도전', '열정', '감사', '평화', '자유', '건강', '기쁨', '우정', '신뢰',
        '정직', '용기', '지혜', '인내', '겸손', '배려', '존중', '협력', '창의', '혁신',
        '무한', '가능', '불가', '완벽', '최고', '최선', '노력', '결과', '과정', '여행',
        '하늘', '바다', '산', '강', '꽃', '나무', '새', '구름', '바람', '비',
        '눈', '해', '달', '별', '세상', '세계', '우주', '지구', '자연', '환경',
        '동물', '식물', '생명', '사람', '인간', '마음', '정신', '육체', '영혼', '감정',
        '생각', '기억', '추억', '현재', '과거', '미래', '시간', '공간', '역사', '문화',
        '예술', '음악', '그림', '춤', '노래', '연극', '영화', '책', '시', '소설',
        '과학', '기술', '발명', '발견', '연구', '실험', '이론', '법칙', '원리', '진리',
        '컴퓨터', '자동차', '비행기', '태양계', '은하수', '도서관', '운동장', '코끼리', '호랑이', '다람쥐',
        '우리나라', '자기계발', '환경보호', '정보통신', '인공지능', '문화유산', '경제성장', '사회복지', '민주주의', '시장경제',
        '지구온난화', '재활용센터', '우주정거장', '생명공학자', '정보보안가', '자원봉사자', '기후변화대응', '지속가능발전'
    ],
    english: [
        'love', 'hope', 'dream', 'life', 'time', 'world', 'heart', 'mind', 'soul', 'peace',
        'happy', 'smile', 'laugh', 'joy', 'fun', 'play', 'work', 'rest', 'sleep', 'wake',
        'good', 'great', 'best', 'nice', 'kind', 'warm', 'cool', 'calm', 'soft', 'hard',
        'fast', 'slow', 'big', 'small', 'long', 'short', 'high', 'low', 'deep', 'wide',
        'sun', 'moon', 'star', 'sky', 'sea', 'land', 'tree', 'flower', 'bird', 'fish',
        'home', 'house', 'room', 'door', 'window', 'floor', 'wall', 'roof', 'garden', 'park',
        'food', 'water', 'bread', 'milk', 'fruit', 'apple', 'orange', 'banana', 'grape', 'berry',
        'book', 'read', 'write', 'learn', 'teach', 'study', 'school', 'class', 'test', 'exam',
        'music', 'song', 'dance', 'art', 'paint', 'draw', 'color', 'light', 'dark', 'bright',
        'friend', 'family', 'mother', 'father', 'sister', 'brother', 'child', 'baby', 'adult', 'elder'
    ]
};

// 단문 연습용 문장 목록
const SENTENCES = {
    korean: [
        '오늘 하루도 행복하게 보내세요.',
        '꿈을 향해 끊임없이 노력하자.',
        '작은 것에도 감사하는 마음을 가지자.',
        '포기하지 않으면 반드시 이룰 수 있다.',
        '함께하면 더 멀리 갈 수 있습니다.',
        '매일 조금씩 성장하는 나를 만들자.',
        '긍정적인 생각이 긍정적인 결과를 만든다.',
        '실패는 성공의 어머니입니다.',
        '오늘의 노력이 내일의 실력이 된다.',
        '배움에는 끝이 없습니다.',
        '시작이 반이다.',
        '천 리 길도 한 걸음부터.',
        '꾸준함이 재능을 이긴다.',
        '오늘 할 일을 내일로 미루지 말자.',
        '작은 습관이 큰 변화를 만든다.',
        '생각보다 할 수 있는 일이 많다.',
        '도전하지 않으면 아무것도 얻을 수 없다.',
        '실수를 두려워하지 말고 도전하자.',
        '지금 이 순간에 최선을 다하자.',
        '미래는 현재 우리가 무엇을 하느냐에 달려있다.',
        '어려움이 있어야 성장할 수 있다.',
        '단순하게 생각하고 꾸준히 실행하자.',
        '목표를 정하고 계획적으로 움직이자.',
        '스스로를 믿고 앞으로 나아가자.',
        '좋은 습관을 만들면 인생이 바뀐다.',
        '열정을 가지고 살아가자.',
        '작은 성공들이 모여 큰 성공이 된다.',
        '남과 비교하지 말고 나만의 길을 가자.',
        '끝까지 해내는 사람이 승리한다.',
        '매일 한 가지씩 새로운 것을 배우자.',
        '긍정의 힘을 믿습니다.',
        '인내심을 가지고 기다려보자.',
        '항상 감사하는 마음을 가지자.',
        '더 나은 내일을 위해 오늘을 준비하자.',
        '소중한 사람들에게 사랑을 표현하자.',
        '건강이 최고의 재산입니다.',
        '웃으면 좋은 일이 생깁니다.',
        '마음먹기에 달려있습니다.',
        '나만의 속도로 나아가면 됩니다.',
        '완벽보다 완료가 중요합니다.'
    ],
    english: [
        'Have a wonderful day today.',
        'Keep working hard for your dreams.',
        'Be grateful for the little things.',
        'Never give up on your goals.',
        'Together we can go further.',
        'Grow a little every day.',
        'Positive thinking brings positive results.',
        'Failure is the mother of success.',
        "Today's effort becomes tomorrow's skill.",
        'Learning never ends.',
        'The journey of a thousand miles begins with a single step.',
        'A good beginning is half the battle.',
        'Consistency beats talent.',
        'Do not put off until tomorrow what you can do today.',
        'Small habits create big changes.',
        'You can do more than you think.',
        'Nothing ventured, nothing gained.',
        'Do not fear mistakes, embrace them.',
        'Do your best in this moment.',
        'The future depends on what we do now.',
        'Challenges help us grow.',
        'Think simply and act consistently.',
        'Set goals and move with a plan.',
        'Believe in yourself and move forward.',
        'Good habits change your life.',
        'Live with passion.',
        'Small wins add up to big success.',
        'Go your own way without comparing.',
        'Those who finish win.',
        'Learn something new every day.',
        'I believe in the power of positivity.',
        'Be patient and wait.',
        'Always be thankful.',
        'Prepare today for a better tomorrow.',
        'Express love to those who matter.',
        'Health is the greatest wealth.',
        'Smile and good things will happen.',
        'It is all about mindset.',
        'Go at your own pace.',
        'Done is better than perfect.'
    ]
};

// 익스포트
window.TypingData = {
    KEYBOARD_LAYOUT,
    KEY_CODES,
    KOREAN_KEY_MAP,
    KOREAN_CHAR_TO_KEY,
    FINGER_MAP,
    POSITION_SETS,
    WORDS,
    SENTENCES
};
