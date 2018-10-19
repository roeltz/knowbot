const Turndown = require("turndown");
const REGEX = /^vade(mecum)?\s+(.+)/i;

async function search(bot, string) {
	console.log("vademecum:", string);
	
	let results = await bot.google(`${string} site:www.vademecum.es`);
	let [name, sectionTitles, sectionContents] = await bot.scrape(results[0].url, [
		"[itemprop='activeIngredient'] strong",
		["[itemprop='articleBody'] h2"],
		["[itemprop='articleBody'] h2 + p"]
	]);

	if (name) {
		let drug = {
			name: name.textContent,
			sections: {}
		};
		let turndown = new Turndown();

		sectionTitles.forEach((t, i) => {
			let title = t.innerHTML.split(/<br>/m)[0];

			if (!["Posología"].includes(title)) {
				let content = turndown.turndown(sectionContents[i].textContent);
				drug.sections[title] = content;
			}
		});

		return drug;
	} else {
		throw new Error("No encontré ningún medicamento parecido");
	}
}

async function menu(bot, chat, drug) {
	let title = await bot.ask(chat, "¿Qué deseas saber?", Object.keys(drug.sections));

	if (title in drug.sections) {
		await bot.sayChunked(chat, `${title}:\n${drug.sections[title]}`);
		delete drug.sections[title];

		let more = await bot.ask(chat, `¿Deseas ver algo más de "${drug.name}"?`, {"Sí": true, "No": false});
		
		if (more)
			menu(bot, chat, drug);
	} else {
		chat.say("No entendí eso");
	}
}

function vademecum(bot) {
	bot.hear(REGEX, async (payload, chat) => {
		REGEX.test(payload.message.text);
		let string = RegExp.$2;
		let drug = await search(bot, string);
		
		await chat.say(`Encontré "${drug.name}"`);
		await menu(bot, chat, drug);
	});
}

vademecum.help = [
	"Vademécum:",
	"_vademecum nombre-del-compuesto_",
	"_vade nombre-del-compuesto_"
];

module.exports = vademecum;