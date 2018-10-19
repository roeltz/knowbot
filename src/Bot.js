const BootBot = require("bootbot");
const express = require("express");
const {JSDOM} = require("jsdom");
const request = require("request");

class Bot {

	constructor(config, modules) {
		this.config = config;
		this.bot = new BootBot(config.fb);

		modules.forEach(m => m(this));
		this.bot.app.use("/tmp", express.static("tmp"));
		this.bot.start(config.port);

		this.hear(/^(ayuda|help)/i, (payload, chat) => {
			modules.forEach(m => chat.say(m.help.join("\n")));
		});
	}

	ask(chat, question, options) {
		if (typeof options === "object" && !Array.isArray(options)) {
			let newOptions = [];

			for (let k in options)
				newOptions.push({title: k, payload: options[k]});
			
			options = newOptions;
		} else if (options.length && typeof options[0] !== "object") {
			options = options.map(o => ({title: o, payload: o}));
		}

		if (options.length === 1) {
			return Promise.resolve(options[0].payload);
		} else if (options.length) {
			return new Promise((resolve, reject) => {
				chat.conversation(convo => {
					convo.ask({
						text: question,
						quickReplies: options.slice(0, 11).map((o, i) => `${i + 1}: ${o.title}`)
					}, payload => {
						convo.end();
						chat.sendTypingIndicator(3000);
						let reply = payload.message.text;
						/^(\d+):/.test(reply);
						let index = RegExp.$1 && (+RegExp.$1 - 1);
						resolve(options[index].payload);
					});
				});
			});
		} else {
			throw new Error("No hay opciones");
		}
	}

	chunk(text) {
		const MAX_LENGTH = 1800;

		if (text.length < 2000) {
			return [text];
		} else {
			let chunks = [];
	
			for (let i = 0; i < text.length; i += MAX_LENGTH) {
				let chunk = text.slice(i, i + MAX_LENGTH);
				if (chunk.length === MAX_LENGTH) chunk += "...";
					chunks.push(chunk);
			}
	
			return chunks;
		}
	}

	async google(q) {
		let [results] = await this.scrape("https://www.google.com/search", {q}, [[".g:not(.kno-kp):not([id])"]]);

		if (results.length) {
			return results.map(r => {
				try {
					return {
						title: r.querySelector("h3").textContent,
						url: r.querySelector("a[href][ping]").href,
						extract: r.querySelector("span.st").textContent
					};
				} catch (ex) {}
			}).filter(x => !!x);
		} else {
			throw new Error("No se encontraron resultados");
		}
	}
	
	hear(pattern, callback) {
		return this.bot.hear(pattern, async (payload, chat) => {
			chat.sendTypingIndicator(3000);

			try {
				await callback(payload, chat);
			} catch (ex) {
				chat.say("Oops... " + ex.message);
				console.error("Error:", ex);
			}
		});
	}

	async list(chat, list, onitem, strings = {}) {
		if (list.length) {
			let item = list.shift();
			await onitem(item, chat);

			if (list.length) {
				let more = await this.ask(chat, strings.more || "¿Más?", {"Sí": true, "No": false});
				if (more) this.list(chat, list, onitem, strings);
			} else {
				chat.say(strings.done || "Ya terminé");
			}

		} else {
			throw new Error(strings.empty || "No encontré nada");
		}
	}

	request(method, url, args) {
		return new Promise((resolve, reject) => {
			request[method](url, args, (err, res, body) => {
				if (err) {
					reject(err);
				} else {
					resolve(body);
				}
			});
		});
	}

	async sayChunked(chat, text) {
		let chunks = this.chunk(text);

		for (let ch of chunks)
			await chat.say(ch);
	}

	async scrape(url, qs, queries, options) {
		if (Array.isArray(qs)) {
			options = queries;
			queries = qs;
			qs = undefined;
		}

		options || (options = {});
		options.qs = qs;
		options.headers = {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3163.100 Safari/537.36"
		};

		let html = await this.request("get", url, options);
		let dom = new JSDOM(html);

		return queries.map(selector => {
			if (Array.isArray(selector)) {
				return Array.from(dom.window.document.querySelectorAll(selector[0]));
			} else {
				return dom.window.document.querySelector(selector);
			}
		});
	}
}

module.exports = Bot;