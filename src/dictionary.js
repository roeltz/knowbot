const REGEX = /^def\s+(\S+)/i;

async function getDefinition(bot, word) {
	console.log("dictionary:", word);

	let results = await bot.google(`${word} site:es.thefreedictionary.com`);
	let [def] = await bot.scrape(results[0].url, [
		"#Definition > section[data-src=\"Larousse_GDLE\"]"
	]);

	if (def) {
		let content = def.querySelector("h2").textContent;
		content += Array.from(def.querySelectorAll(".ds-single")).slice(0, 5).map(i => `\n${i.textContent}`);
		return content;
	} else {
		throw new Error("No se encontró la definición");
	}
}

function dictionary(bot) {
	bot.hear(REGEX, async (payload, chat) => {
		REGEX.test(payload.message.text);
		let word = RegExp.$1;

		let definition = await getDefinition(bot, word);
		bot.sayChunked(chat, definition);
	});
}

dictionary.help = [
	"Diccionario:",
	"_def palabra_"
];

module.exports = dictionary;