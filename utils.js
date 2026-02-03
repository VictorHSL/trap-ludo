function playerToColor(player) {
  switch(player){
    case 'blue':
      return '#0000FF';
    case 'yellow':
      return '#FFFF00';
    case 'red':
      return '#FF0000';
    case 'green':
      return '#008000';
    default:
      return player;
  }
}

export function getContrastColor(hexcolor) {
  hexcolor = playerToColor(hexcolor);
  // Convert hex to RGB
  const r = parseInt(hexcolor.substr(1, 2), 16);
  const g = parseInt(hexcolor.substr(3, 2), 16);
  const b = parseInt(hexcolor.substr(5, 2), 16);
  // Calculate luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export const removeItemFromArray = (item, array) => {
  let index = array.indexOf(item);

  if (index > -1) {
    array.splice(index, 1);
  }
};