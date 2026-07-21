const url = 'https://youtu.be/NHtZnYvYMkA ';
const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
const match = url.match(regExp);
console.log(match ? `"${match[2]}"` : url, match && match[2].length === 11);
