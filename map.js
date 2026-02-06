import { getPlayerOrder, savePlayerOrder, reset, getGameData, saveGameData } from './storage.js';
import { roads, spawnPositions, blockedPos, pathOrder } from './config.js'
import { DICE_POS, DICE_VALUE_MAP, EVENT_NAMES } from './consts.js';
import { getContrastColor, removeItemFromArray } from './utils.js';
import { showMessage } from './message.js';

let rowIndex = 0;
let gameData = getGameData();

let playerOrderData = getPlayerOrder();
let playerOrder = [];

const add3BlocksGroup = ($parent) => {
  const up3BlocksRow = [];
  rowIndex = rowIndex ?? 0;

  for (let i = 0; i < 5; i++) {
    const $row = generateBlocksRow(3);
    up3BlocksRow.push($row);
  }

  for (let i = 0; i < up3BlocksRow.length; i++){
    const element = up3BlocksRow[i];

    $parent.append(element);
  }
}

const isPositionAllowed = (row, col) => {
  return !blockedPos.some(x => x === `${row}-${col}`);
};

const getRoadColor = (row, col) => {
  let res = '';
  const searchPos = `${row}-${col}`;

  Object.keys(roads).forEach(color => {
    if(roads[color].some(x => x === searchPos)){
      res = color;
    }
    else {
      if(spawnPositions[color] == searchPos){
        res = color;
      }
    }
  });

  return res;
};

const handlePinClick = (pos, el) => {
  if(gameData.waitingPlayer && el.hasClass(`player-${gameData.currentPlayer}`)){
    document.dispatchEvent(new CustomEvent(EVENT_NAMES.PLAYER_MOVE, {
      detail: { movedPos: pos, diceValue: gameData.diceValue }
    }));
  }
};

const drawnPin = ($slot, roadColor, pos) => {

  const playerPinData = gameData.playerPins.find(x => x.pos == pos);

  if(!playerPinData) return; 

  const $playerPin = $('<div>')
    .addClass('player')
    .addClass(playerPinData.player)
    .addClass(`player-${playerPinData.player}`);

  $playerPin.attr('data-player', playerPinData.player);

  $playerPin.css('color', getContrastColor(roadColor ? roadColor : '#e8dacc'));

  $playerPin.on('click', function(){
    handlePinClick(pos, $playerPin);
  });

  $slot.on('click', function(){
    handlePinClick(pos, $playerPin);
  });

  $slot.append($playerPin);
};

const handleHomeClick = ($home) => {
  const player = $home.data('player'); //TODO need to validate this logic

  if(player != gameData.currentPlayer) return;
  if(!gameData.waitingPlayer) return;

  if(gameData.diceValue != DICE_VALUE_MAP.ALLOW_SPAWN) return;

  spawnPlayerPin();
  endPlayerTurn();
};

const drawnHomes = () => {
  $('.home').each(function(){
    const player = $(this).data('player');
    const availablePins = gameData.availablePins.find(x => x.player == player);

    for(let i = 0; i < availablePins.amount; i++){
      const $homePinHolder = $('<div>').addClass('home-pin');

      const $homePin = $('<div>')
        .addClass(`player ${player}`);

      $homePinHolder.append($homePin);

      $(this).append($homePinHolder);
    }

    $(this).on('click', handleHomeClick);
  });
};

const generateBlocksRow = (blocksCount) => {
  const $row = $('<div>');
  $row.addClass('map-row');

  for (let j = 0; j < blocksCount; j++){
    const $slot = $('<div>');
    const pos = `${rowIndex}-${j}`;
    $slot.addClass(`position ${pos}`);
    $slot.attr('data-pos', pos);

    const roadColor = getRoadColor(rowIndex, j);

    if(pos != DICE_POS){
      drawnPin($slot, roadColor, pos);
    }
    
    if(!isPositionAllowed(rowIndex, j)){
      $slot.addClass('blocked-pos');
    }
    
    if(roadColor){
      $slot.addClass(roadColor);
    }

    $row.append($slot);
  }

  rowIndex++;

  return $row;
};

const rollDice = () => {

  if(!gameData.canRollDice) return;

  const now = new Date().getTime().toString();
  const value = now.substring(now.length - 1);
  const diceValue = Math.min(Math.max(value, 1), 6);

  document.dispatchEvent(new CustomEvent(EVENT_NAMES.DICE_ROLLED, {
    detail: { player: gameData.currentPlayer, diceValue }
  }));
};

const setupDice = () => {
  const dice = $('.7-7');
  dice.addClass('dice');

  dice.css('color', getContrastColor(gameData.currentPlayer ? gameData.currentPlayer : '#e8dacc'));
  
  if(!gameData.waitingPlayer || shouldSetupPlayerOrder()){
    dice.html($('<span>').text('ROLAR DADO'));
  }
  else {
    dice.html($('<span>').text(gameData.diceValue));
  }

  dice.on('click', function(){
    rollDice();
  });

  setCanRollDice(gameData.canRollDice);

  if(!gameData.currentPlayer){
    dice.css('background-color', 'unset');
  }
  else {
    dice.css('background-color', gameData.currentPlayer);
    dice.css('color', getContrastColor(gameData.currentPlayer));
  }
};

const renderMap = () => {
  const $map = $('#map');
  $map.empty();
  rowIndex = 0;
  add3BlocksGroup($map);
  $map.append(generateBlocksRow(5));
  $map.append(generateBlocksRow(15));
  $map.append(generateBlocksRow(15));
  $map.append(generateBlocksRow(15));
  $map.append(generateBlocksRow(5));
  add3BlocksGroup($map);

  setupDice();
  setupResetBtn();
  drawnHomes();

  if(gameData.waitingPlayer){
    getplayerPins().forEach(pos => {
      $(`.${pos.pos}`).addClass('highlighted');
    });
  }
};

const shouldSetupPlayerOrder = () => {
  return Object.keys(playerOrderData).filter(x => playerOrderData[x] == 0)[0];
};

const runSetupPlayerOrder = () => {
  return new Promise((resolve) => {
    const color = shouldSetupPlayerOrder();
    
    setCurrentPlayer(color);

    if(!color){
      resolve();
      return;
    }

    const handle = async function (e){
      if(e.detail.player == color){
        playerOrderData[color] = e.detail.diceValue;
        savePlayerOrder(playerOrderData);
        await runSetupPlayerOrder();
        setTimeout(() => {
          document.removeEventListener(EVENT_NAMES.DICE_ROLLED, handle);
          resolve();
        }, 100);
      }
    };

    document.addEventListener(EVENT_NAMES.DICE_ROLLED, handle);

  });
}

const setCurrentPlayer = (player) => {
  const dice = $('.7-7');

  if(!player){
    gameData.currentPlayer = '';
    dice.css('background-color', 'unset');
  }
  else {
    dice.css('background-color', player);
    gameData.currentPlayer = player;
  }

  dice.css('color', getContrastColor(gameData.currentPlayer ? gameData.currentPlayer : '#e8dacc'));

  saveGameData(gameData);
};

const setupResetBtn = () => {
  $('#reset-btn').on('click', function () {
    reset();
    renderMap();
    playerOrderData = getPlayerOrder();
    triggerSetupPlayerOrder();
  });
};

const triggerSetupPlayerOrder = () => {
  if(shouldSetupPlayerOrder()){
    showMessage({ message: 'Novo jogo iniciado! Vamos definir a ordem dos jogadores. Para rolar o dado, basta clicar em "ROLAR DADO" se a cor que aparece eh a sua cor.' });
    $('#reset-btn').hide();
    runSetupPlayerOrder().then(() => {
      showMessage({ message: 'Player order set!' });
      $('#reset-btn').show();
      startGame();
    });
  }
  else {
    $('#reset-btn').show();
    startGame();
  }
};

const handlePinMoved = (e) => {
  const { movedPos, diceValue } = e.detail;

  const selectedPlayerPin = gameData.playerPins.find(x => x.pos == movedPos && x.player == gameData.currentPlayer);
  const currentPathIndex = pathOrder.indexOf(movedPos);
  let nextPosIndex = currentPathIndex + diceValue;

  if(nextPosIndex >= pathOrder.length){ //TODO: need to make the player enter in road
    nextPosIndex = 0;
  }

  const nextPath = pathOrder[nextPosIndex];

  const nextPathHasPlayer = $(`.${nextPath}`).find('.player')[0];

  if(nextPathHasPlayer){ //TODO need to validate this logic
    const player = $(nextPathHasPlayer).data('player');
    const pinToRemove = gameData.playerPins.find(x => x.pos == nextPath && x.player == player);
    removeItemFromArray(pinToRemove, gameData.playerPins);
  }

  selectedPlayerPin.pos = pathOrder[nextPosIndex];
  setNextPlayer();
};

const setNextPlayer = () => {
  gameData.waitingPlayer = false;
  setCanRollDice(true);
  setCurrentPlayer(getNextPlayer())
  saveGameData(gameData);
};

const setCanRollDice = (can) => {

  if(!can){
    $('.dice').addClass('cant-roll');
  }
  else {
    $('.dice').removeClass('cant-roll');
  }

  gameData.canRollDice = can;
  saveGameData(gameData);
};

const endPlayerTurn = () => {
  setNextPlayer();
  renderMap();
};

const playerRolledDice = (e) => {
  const { diceValue } = e.detail;
  const playerPins = getplayerPins();

  gameData.diceValue = diceValue;
  alert(`Voce tirou ${diceValue}`);

  if(diceValue == DICE_VALUE_MAP.ALLOW_SPAWN){
    if(!playerPins.length){
      spawnPlayerPin();
      endPlayerTurn();
    }
    else {
      setCanRollDice(false);
      gameData.waitingPlayer = true;
      renderMap();
    }
  }
  else if (playerPins.length){
    setCanRollDice(false);
    gameData.waitingPlayer = true;
    renderMap();
  }
  else {
    endPlayerTurn();
  }  
};

const getPlayerPin = (player) => {
  const playerPin = gameData.availablePins.find(x => x.player == player);

  if(playerPin.amount == 0) return 0;

  playerPin.amount--;

  return 1;
};

const spawnPlayerPin = () => {
  if(getPlayerPin(gameData.currentPlayer)) return;
  
  const spawnPosition = spawnPositions[gameData.currentPlayer];
  gameData.playerPins.push({ player: gameData.currentPlayer, pos: spawnPosition });
}

const getplayerPins = () => {
  return gameData.playerPins.filter(x => x.player == gameData.currentPlayer);
};

const getNextPlayer = () => {
  const currentIndex = playerOrder.indexOf(gameData.currentPlayer);
  let nextIndex = currentIndex + 1;

  if(nextIndex == playerOrder.length){
    nextIndex = 0;
  }

  return playerOrder[nextIndex];
};

const startGame = () => {
  playerOrder = Object.keys(playerOrderData).sort((a,b) => playerOrderData[b] - playerOrderData[a]);
  
  if(!gameData.currentPlayer){
    setCurrentPlayer(playerOrder[0]);
  }
  else {
    setCurrentPlayer(gameData.currentPlayer);
  }

  renderMap();

  document.addEventListener(EVENT_NAMES.DICE_ROLLED, playerRolledDice);
  document.addEventListener(EVENT_NAMES.PLAYER_MOVE, handlePinMoved);
};

$(function(){
  renderMap();
  triggerSetupPlayerOrder();
});