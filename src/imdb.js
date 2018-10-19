const REGEX = /^(peli|movie|imdb)\s+(.+)/i;

async function search(bot, string) {
	console.log("imdb:search:", string);
	let results = await bot.google(`${string} site:www.imdb.com`);

	return results
		.filter(r => /www.imdb.com\/title\//.test(r.url))
		.filter(r => /\(/.test(r.title))
		.map(r => {
			r.title = r.title.replace(/ - IMDb$/, "");
			return r;
		})
	;
}

async function getMovie(bot, url) {
	console.log("imdb:movie", url);

	let [title, year, subtext, poster, plot, director, writers, rating, cast, awards, details, companies] = await bot.scrape(url, [
		".titleBar h1",
		"#titleYear a",
		".titleBar .subtext",
		".poster img",
		".plot_summary .summary_text",
		".plot_summary .credit_summary_item:nth-child(2)",
		".plot_summary .credit_summary_item:nth-child(3)",
		".ratingValue span[itemprop='ratingValue']",
		[".cast_list tbody tr"],
		[".awards-blurb"],
		"#titleDetails",
		["#titleDetails h4 ~ a[href*='/company/']"]
	]);

	/([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)/.test(subtext.textContent);
	let censorship = RegExp.$1.trim();
	let runtime = RegExp.$2.trim();
	let release = RegExp.$4.trim();
	let genres = RegExp.$3.trim().replace(/\s+,\s+/, ", ");
	
	details = details.textContent;

	/Budget:\s*(.+?)\n/mi.test(details);
	let budget = RegExp.$1 || "N/A";

	/Cumulative Worldwide Gross:\s*([$\d,.]+)/mi.test(details);
	let gross = RegExp.$1 || "N/A";

	return {
		title: title.textContent.replace(/\s+\(.+?\)\s+$/, ""),
		year: year.textContent,
		censorship,
		runtime,
		genres,
		release,
		rating: rating.textContent,
		poster: poster.src,
		plot: plot.textContent.trim(),
		director: director.textContent.replace(/^\s+Director:\s+/m, "").trim(),
		writers: writers.textContent.replace(/^\s+Writers:\s+/m, "").split(/\r?\n/g)[0].replace(/\s+\|$/, ""),
		rating: rating.textContent,
		cast: cast.slice(1).map(tr => ({
			actor: tr.querySelector("td:nth-child(2)").textContent.trim(),
			role: tr.querySelector("td.character").textContent.trim()
		})),
		awards: awards.map(a => a.textContent.replace(/\r?\n/gm, " ").trim()).join(" ").replace(/\s{2,}/g, " "),
		companies: companies.map(c => c.textContent),
		budget,
		gross
	};
}

async function sayMovie(bot, chat, movie) {
	let cast = movie.cast.map(c => `-${c.actor}: ${c.role}`).join("\n");

	await chat.say(`"${movie.title}" (${movie.year}, ${movie.runtime})`);

	if (movie.poster) {
		await chat.say({
			attachment: "image",
			url: movie.poster
		});
	}
	
	await bot.sayChunked(chat, [
		`Director:\n${movie.director}`,
		`Escritor:\n${movie.writers}`,
		`Puntuación:\n${movie.rating}`,
		`Lanzamiento:\n${movie.release}`,
		`Censura:\n${movie.censorship}`,
		`Presupuesto:\n${movie.budget}`,
		`Recaudación:\n${movie.budget}`,
		`Premios:\n${movie.awards}`,
		`Elenco:\n${cast}`
	].join("\n"));
}

function imdb(bot) {

	bot.hear(REGEX, async (payload, chat) => {
		REGEX.test(payload.message.text);
		let string = RegExp.$2;
		let list = await search(bot, string);
		let url = await bot.ask(chat, "¿A qué película te refieres?", list.map(r => ({
			title: r.title,
			payload: r.url
		})));		
		let movie = await getMovie(bot, url);
		
		await sayMovie(bot, chat, movie);
	});
}

imdb.help = [
	"Película:",
	"_peli titulo-de-la-pelicula_"
];

module.exports = imdb;