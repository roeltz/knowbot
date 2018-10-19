const Turndown = require("turndown");
const REGEX = /^letra\s+(.+)/i;

async function search(bot, url) {
	console.log("lyrics:search:", url);

	try {
		let [title, artist, lyrics] = await bot.scrape(url, [
			".lyricsh h2",
			".ringtone + b",
			".ringtone + b ~ div"
		]);

		title = title.textContent.replace(/^"|"$/g, "");
		artist = artist.textContent.replace(/\s+Lyrics\s+$/i, "");
		lyrics = new Turndown().turndown(lyrics);

		return `${title}\n${artist}\n\n${lyrics}`;
	} catch (ex) {
		throw new Error("No encontré una letra parecida: " + ex.message);
	}
}

function lyrics(bot) {
	bot.hear(REGEX, async (payload, chat) => {
		REGEX.test(payload.message.text);
		let string = RegExp.$1;
		let results = await bot.google(`${string} site:www.azlyrics.com`);
		let url = await bot.ask(chat, "¿A qué canción te refieres?", results.map(r => ({
			title: r.title,
			payload: r.url
		})));
		let lyrics = await search(bot, url);

		bot.sayChunked(chat, lyrics);
	});
}

lyrics.help = [
	"Letras de canciones:",
	"_letra nombre-de-la-canción_",
	"_letra verso-de-la-canción_"
];

module.exports = lyrics;