const Bot = require("./src/Bot");
const config = require("./config");

new Bot(config, [
	require("./src/wikipedia"),
	require("./src/dictionary"),
	require("./src/imdb"),
	require("./src/lyrics"),
	require("./src/vademecum"),
	require("./src/images"),
	require("./src/shot"),
	require("./src/urban"),
]);
