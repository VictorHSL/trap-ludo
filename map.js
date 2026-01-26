let rowIndex = 0;

const dicePos = '7-7';

const pathOrder = [
  '0-0','0-1','0-2',
  '1-2','2-2','3-2','4-2','5-3','5-4',
  '6-9','6-10','6-11','6-12','6-13',
  '6-14','7-14','8-14',
  '8-13','8-12','8-11','8-10','8-9','9-4',
  '9-3','10-2','11-2','12-2','13-2',
  '14-2','14-1','14-0',
  '13-0','12-0','11-0','10-0','9-1','9-0',
  '8-5','8-4','8-3','8-2','8-1',
  '8-0','7-0','6-0',
  '6-1','6-2','6-3','6-4','6-5','5-0',
  '5-1','4-0','3-0','2-0','1-0',
];

const blockedRows = [6,7,8];
const blockedCols = [6,7,8];

const blockedPos = [];
blockedRows.forEach(row => {
  blockedCols.forEach(col => {
    blockedPos.push(`${row}-${col}`);
  });
});

const roads = {
  'blue': ['1-1', '2-1', '3-1', '4-1', '5-2'],
  'yellow': ['7-9', '7-10', '7-11', '7-12', '7-13'],
  'green': ['9-2', '10-1', '11-1', '12-1', '13-1'],
  'red': ['7-1', '7-2', '7-3', '7-4', '7-5']
};

const playerPositions = {
  'blue': [],
  'yellow': [],
  'green': [],
  'red': []
};

const spawnPositions = {
  'blue': '1-2',
  'yellow': '8-13',
  'green': '13-0',
  'red': '6-1'
};

const playerOrder = {
  'blue': 0,
  'yellow': 0,
  'green': 0,
  'red': 0
};

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

$(function(){
  renderMap();
  setupDice();
});