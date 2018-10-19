const {execFile} = require("child_process");
const path = require("path");
const REGEX = /^(shot|cap|captura)\s+(\S+)/i;

async function capture(url) {
	console.log("shot:capture:", url);
	
	return new Promise((resolve, reject) => {
		let file = `tmp/${Date.now()}.png`;

		execFile("firefox", ["-screenshot", path.resolve(file), url], (err) => {
			if (err) {
				reject(new Error("No pude hacer la captura"));
			} else {
				resolve(file);
			}
		});
	});
}

function shot(bot) {
	bot.hear(REGEX, async (payload, chat) => {
		chat.say("Esto se tomará unos segundos...").then(() => chat.sendAction("typing_on"));

		REGEX.test(payload.message.text);
		let url = RegExp.$2;
		let file = await capture(url);

		await chat.sendAction("typing_off");
		await chat.say("Aquí va...");
		await chat.say({
			attachment: "image",
			url: `https://know.bot.nu/${file}`
		});
	});
}

shot.help = [
	"Tomar captura de una página:",
	"_captura url_"
];

module.exports = shot;