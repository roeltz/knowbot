const striptags = require("striptags");

async function getArticle(bot, lang, title) {
	console.log("wikipedia:article:", lang, title);

	let result = await bot.request("get", `https://${lang}.wikipedia.org/w/api.php`, {
		json: true,
		qs: {
			action: "query",
			prop: "extracts",
			exintro: "",
			titles: title,
			format: "json"
		}	
	});
	
	if (result.query.pages["-1"]) {
		throw new Error("No se encontró el artículo");
	} else {
		let k = Object.keys(result.query.pages)[0];
		let a = result.query.pages[k];

		a.extract = striptags(a.extract);
		return a;
	}
}

function sayArticle(bot, chat, article) {
	let text = `${article.title}:\n${article.extract.trim()}`;
	bot.sayChunked(chat, text);
}

function wikipedia(bot) {
	bot.hear(/^wiki/i, async (payload, chat) => {
		/wiki\s+(-(es|en)\s+)?(.+)/i.test(payload.message.text);
		let lang = RegExp.$2 || "es";
		let string = RegExp.$3;
		let results = await bot.google(`${string} site:${lang}.wikipedia.org`);
		let response = await bot.ask(chat, "¿A qué artículo te refieres?", results.map(r => /^(.+?) - Wikipedia/.test(r.title) && RegExp.$1));
		
		let article = await getArticle(bot, lang, response);
		
		sayArticle(bot, chat, article);
	});
}

wikipedia.help = [
	"Wikipedia:",
	"_wiki palabras-clave_",
	"Wikipedia en inglés:",
	"_wiki -en keywords_"
];

module.exports = wikipedia;