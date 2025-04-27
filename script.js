document.addEventListener('DOMContentLoaded', () => {
    // DOM元素
    const dealerCardsEl = document.getElementById('dealer-cards');
    const playerCardsEl = document.getElementById('player-cards');
    const dealerScoreEl = document.getElementById('dealer-score');
    const playerScoreEl = document.getElementById('player-score');
    const gameResultEl = document.getElementById('game-result');
    const dealBtn = document.getElementById('deal-btn');
    const hitBtn = document.getElementById('hit-btn');
    const standBtn = document.getElementById('stand-btn');
    const restartBtn = document.getElementById('restart-btn');

    // 游戏状态
    let deck = [];
    let dealerCards = [];
    let playerCards = [];
    let dealerScore = 0;
    let playerScore = 0;
    let gameOver = false;
    let dealerHiddenCard = null;

    // 花色和牌面值
    const suits = ['♥', '♦', '♠', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    // 按钮事件监听
    dealBtn.addEventListener('click', startGame);
    hitBtn.addEventListener('click', hit);
    standBtn.addEventListener('click', stand);
    restartBtn.addEventListener('click', restart);

    // 开始游戏
    function startGame() {
        // 重置游戏状态
        dealerCards = [];
        playerCards = [];
        dealerScore = 0;
        playerScore = 0;
        gameOver = false;
        dealerHiddenCard = null;
        
        // 清空卡牌区域和结果
        dealerCardsEl.innerHTML = '';
        playerCardsEl.innerHTML = '';
        gameResultEl.textContent = '';
        
        // 创建和洗牌
        createDeck();
        shuffleDeck();
        
        // 发牌
        dealerHiddenCard = dealCard(true);
        dealCard(false);
        dealCard(false);
        dealCard(false);
        
        // 更新界面
        updateScores();
        
        // 更新按钮状态
        dealBtn.disabled = true;
        hitBtn.disabled = false;
        standBtn.disabled = false;
        restartBtn.disabled = true;
        
        // 检查是否有黑杰克
        checkBlackjack();
    }

    // 创建牌组
    function createDeck() {
        deck = [];
        for (let suit of suits) {
            for (let value of values) {
                deck.push({value, suit});
            }
        }
    }

    // 洗牌
    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    // 发牌
    function dealCard(isDealer, isHidden = false) {
        if (deck.length === 0) {
            alert('牌组已空，请重新开始游戏');
            return null;
        }
        
        const card = deck.pop();
        
        if (isDealer) {
            dealerCards.push(card);
        } else {
            playerCards.push(card);
        }
        
        renderCard(card, isDealer, isHidden);
        return card;
    }

    // 渲染卡牌
    function renderCard(card, isDealer, isHidden = false) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${isHidden ? 'card-hidden' : ''}`;
        
        // 根据花色设置颜色
        const isRed = card.suit === '♥' || card.suit === '♦';
        const colorClass = isRed ? 'red' : 'black';
        
        if (!isHidden) {
            cardElement.innerHTML = `
                <div class="card-value ${colorClass}">${card.value}</div>
                <div class="card-suit ${colorClass}">${card.suit}</div>
            `;
        }
        
        if (isDealer) {
            dealerCardsEl.appendChild(cardElement);
        } else {
            playerCardsEl.appendChild(cardElement);
        }
    }

    // 计算得分
    function calculateScore(cards) {
        let score = 0;
        let aces = 0;
        
        for (let card of cards) {
            if (card.value === 'A') {
                aces++;
                score += 11;
            } else if (['K', 'Q', 'J'].includes(card.value)) {
                score += 10;
            } else {
                score += parseInt(card.value);
            }
        }
        
        // 如果有A并且总分超过21，将A视为1点
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        
        return score;
    }

    // 更新得分显示
    function updateScores() {
        // 玩家分数
        playerScore = calculateScore(playerCards);
        playerScoreEl.textContent = `点数: ${playerScore}`;
        
        // 庄家分数 - 如果游戏未结束且有隐藏牌，只计算可见的牌
        if (!gameOver && dealerHiddenCard) {
            const visibleCards = dealerCards.filter(card => card !== dealerHiddenCard);
            dealerScore = calculateScore(visibleCards);
            dealerScoreEl.textContent = `点数: ${dealerScore}`;
        } else {
            dealerScore = calculateScore(dealerCards);
            dealerScoreEl.textContent = `点数: ${dealerScore}`;
        }
    }

    // 检查是否有黑杰克
    function checkBlackjack() {
        playerScore = calculateScore(playerCards);
        const fullDealerScore = calculateScore(dealerCards);
        
        if (playerScore === 21 && playerCards.length === 2) {
            if (fullDealerScore === 21 && dealerCards.length === 2) {
                endGame('平局！双方都是黑杰克');
            } else {
                endGame('恭喜！你获得了黑杰克！');
            }
        } else if (fullDealerScore === 21 && dealerCards.length === 2) {
            revealDealerHiddenCard();
            endGame('庄家获得黑杰克，你输了');
        }
    }

    // 玩家要牌
    function hit() {
        if (gameOver) return;
        
        dealCard(false);
        updateScores();
        
        if (playerScore > 21) {
            revealDealerHiddenCard();
            endGame('爆牌！你输了');
        }
    }

    // 玩家停牌
    function stand() {
        if (gameOver) return;
        
        revealDealerHiddenCard();
        updateScores();
        
        // 庄家回合
        dealerTurn();
    }

    // 庄家回合
    function dealerTurn() {
        let dealerTakingCards = true;
        
        const dealerPlay = () => {
            if (dealerScore < 17 && dealerTakingCards) {
                dealCard(true);
                updateScores();
                
                if (dealerScore > 21) {
                    dealerTakingCards = false;
                    endGame('庄家爆牌！你赢了');
                    return;
                }
                
                setTimeout(dealerPlay, 700);
            } else {
                determineWinner();
            }
        };
        
        setTimeout(dealerPlay, 700);
    }

    // 显示庄家的隐藏牌
    function revealDealerHiddenCard() {
        if (dealerHiddenCard && dealerCardsEl.firstChild.classList.contains('card-hidden')) {
            dealerCardsEl.firstChild.classList.remove('card-hidden');
            
            const isRed = dealerHiddenCard.suit === '♥' || dealerHiddenCard.suit === '♦';
            const colorClass = isRed ? 'red' : 'black';
            
            dealerCardsEl.firstChild.innerHTML = `
                <div class="card-value ${colorClass}">${dealerHiddenCard.value}</div>
                <div class="card-suit ${colorClass}">${dealerHiddenCard.suit}</div>
            `;
        }
    }

    // 确定胜者
    function determineWinner() {
        if (dealerScore > 21) {
            endGame('庄家爆牌！你赢了');
        } else if (playerScore > dealerScore) {
            endGame('恭喜！你赢了');
        } else if (playerScore < dealerScore) {
            endGame('很遗憾，你输了');
        } else {
            endGame('平局');
        }
    }

    // 结束游戏
    function endGame(message) {
        gameOver = true;
        gameResultEl.textContent = message;
        
        hitBtn.disabled = true;
        standBtn.disabled = true;
        restartBtn.disabled = false;
    }

    // 重新开始
    function restart() {
        dealBtn.disabled = false;
        hitBtn.disabled = true;
        standBtn.disabled = true;
        restartBtn.disabled = true;
        
        dealerCardsEl.innerHTML = '';
        playerCardsEl.innerHTML = '';
        gameResultEl.textContent = '';
        
        dealerScoreEl.textContent = '点数: 0';
        playerScoreEl.textContent = '点数: 0';
    }
});
