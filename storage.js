const setItem = (key, value) => {
  localStorage.setItem(key, value);
};

const getItem = (key) => {
  return localStorage.getItem(key) ?? undefined;
};

const KEYS = {
  PLAYER_ORDER: 'PLAYER_ORDER',
  GAME_DATA: 'GAME_DATA'
};

const emptyPlayerOrder = {
  'blue': 0,
  'yellow': 0,
  'green': 0,
  'red': 0
};

const emptyGameData = {
  currentPlayer: '',
  playerPins: [],
  canRollDice: true,
  diceValue: 1,
  waitingPlayer: true
};

export const reset = () => {
  savePlayerOrder();
  saveGameData();
};

export const savePlayerOrder = (playerOrder) => {
  setItem(KEYS.PLAYER_ORDER, JSON.stringify(playerOrder ?? emptyPlayerOrder));
};

export const getPlayerOrder = () => {
  const stringOrder = getItem(KEYS.PLAYER_ORDER);
  return stringOrder ? JSON.parse(stringOrder) : emptyPlayerOrder;
};

export const saveGameData = (gamedata) => {
  setItem(KEYS.GAME_DATA, JSON.stringify(gamedata ?? emptyGameData));
};

export const getGameData = () => {
  const stringOrder = getItem(KEYS.GAME_DATA);
  const data = stringOrder ? JSON.parse(stringOrder) : emptyGameData;

  Object.keys(emptyGameData).forEach(key => {
    if(data[key] == undefined || data[key] == null){
      data[key] = emptyGameData[key];
    }
  });

  return data;
};