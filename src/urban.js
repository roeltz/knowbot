const striptags = require("striptags");
const REGEX = /^urban\s+(.+)/i;

async function getDefinition(bot, url) {
	console.log("urban:definition:", url);

	let [word, meaning, example] = await bot.scrape(url, [
		".word",
		".meaning",
		".example"
	]);

	return {
		word: word.textContent,
		meaning: striptags(meaning.innerHTML.replace(/<br>/mi, "\n")),
		example: striptags(example.innerHTML.replace(/<br>/mi, "\n"))
	};
}

function shot(bot) {
	bot.hear(REGEX, async (payload, chat) => {
		REGEX.test(payload.message.text);
		let string = RegExp.$1;
		let results = await bot.google(`"${string}" site:www.urbandictionary.com`);
		let url = await bot.ask(chat, "¿A qué te refieres?", results.filter(r => /define\.php/.test(r.url)).map(r => ({
			title: r.title.replace(/^Urban Dictionary:\s+/, ""),
			payload: r.url
		})));
		let def = await getDefinition(bot, url);

		await chat.say(`"${def.word}":\n${def.meaning}\n-\n-${def.example}`);
	});
}

shot.help = [
	"Urban Dictionary:",
	"_urban palabra_"
];

module.exports = shot;