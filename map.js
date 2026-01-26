import { getPlayerOrder, savePlayerOrder, resetPlayerOrder, getGameData, saveGameData } from './storage.js';
import { roads, spawnPositions, blockedPos } from './config.js'

let rowIndex = 0;

const dicePos = '7-7';
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

const generateBlocksRow = (blocksCount) => {
  const $row = $('<div>');
  $row.addClass('row');

  for (let j = 0; j < blocksCount; j++){
    const $col = $('<div>');
    const pos = `${rowIndex}-${j}`;
    $col.addClass(`position ${pos}`);

    if(pos != dicePos){
      $col.text(pos);
    }
    
    if(!isPositionAllowed(rowIndex, j)){
      $col.addClass('blocked-pos');
    }

    const color = getRoadColor(rowIndex, j);
    if(color){
      $col.addClass(color);
    }

    $row.append($col);
  }

  rowIndex++;

  return $row;
};

const rollDice = () => {
  const now = new Date().getTime().toString();
  const value = now.substring(now.length - 1);
  const diceValue = Math.min(Math.max(value, 1), 6);
  $('.dice').html($('<span>').text(diceValue));

  document.dispatchEvent(new CustomEvent('dice-rolled', {
    detail: { player: gameData.currentPlayer, diceValue }
  }));
};

const setupDice = () => {
  const dice = $('.7-7');
  dice.addClass('dice');
  dice.on('click', function(){
    rollDice();
  });
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
};

const getMap = () => ($('#map'));

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

    document.addEventListener('dice-rolled', async function (e){
      if(e.detail.player == color){
        playerOrderData[color] = e.detail.diceValue;
        savePlayerOrder(playerOrderData);
        await runSetupPlayerOrder();
        setTimeout(() => {
          resolve();
        }, 100);
      }
    });

  });
}

const setCurrentPlayer = (player) => {
  const map = getMap();

  if(!player){
    gameData.currentPlayer = '';
    map.css('background-color', 'unset');
  }
  else {
    map.css('background-color', player);
    gameData.currentPlayer = player;
  }
};

const setupResetBtn = () => {
  $('#reset-btn').on('click', function () {
    resetPlayerOrder();
    playerOrderData = getPlayerOrder();
    triggerSetupPlayerOrder();
  });
};

const triggerSetupPlayerOrder = () => {
  if(shouldSetupPlayerOrder()){
    $('#reset-btn').hide();
    runSetupPlayerOrder().then(() => {
      alert('Player order set!');
      $('#reset-btn').show();
      startGame();
    });
  }
  else {
    $('#reset-btn').show();
    startGame();
  }
};

const startGame = () => {
  playerOrder = Object.keys(playerOrderData).sort((a,b) => playerOrderData[b] - playerOrderData[a]);
  
  if(!gameData.currentPlayer){
    setCurrentPlayer(playerOrder[0]);
    saveGameData(gameData);
  }
  else {
    setCurrentPlayer(gameData.currentPlayer);
  }
};

$(function(){
  renderMap();
  setupDice();
  setupResetBtn();

  triggerSetupPlayerOrder();
  
});