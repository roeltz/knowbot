const REGEX = /^(img|image|imagen|imagenes|imágenes|meme)\s+(.+)/i;

async function getImageLinks(bot, string, meme) {
	console.log("images:links:", string);

	if (meme)
		string = `${string} memes`;
	
	let [results] = await bot.scrape("https://www.google.com/search", {q: string, tbm: "isch"}, [[".rg_bx"]]);
	
	return results.map(r => {
		let meta = JSON.parse(r.querySelector(".rg_meta").textContent);
		return {
			title: meta.pt,
			url: meta.ou
		};
	});
}

async function images(bot) {
	bot.hear(REGEX, async (payload, chat) => {
		REGEX.test(payload.message.text);
		let meme = RegExp.$1.toLowerCase() === "meme";
		let string = RegExp.$2;
		let links = await getImageLinks(bot, string, meme);

		await bot.list(chat, links, async (link, chat) => {
			return chat.say({
				attachment: "image",
				url: link.url
			});	
		}, {
			more: "¿Quieres otra imagen?",
			done: "Esa fue la última imagen"
		});
	});
}

images.help = [
	"Búsqueda de imágenes:",
	"_imagen palabras-clave_",
	"Memes:",
	"_meme palabras-clave_"
];

module.exports = images;