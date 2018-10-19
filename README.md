# Knowbot

_Knowbot answers stuff out of scraping Google search results_

## Usage

Being a Facebook Messenger bot, the process of putting it to work
in production is quite bureaucratic and out of the scope of me
just saving my work somewhere public.

But after you get the app's ID and secret, and set up the bot's
webhook (including the verify_token) in the config.json, you just
`node bot.js` and that's it.

## Localization

Unfortunately, this project is primarily for my personal use and, me
being a Spanish-speaking person, all chat strings are in Spanish
and information is mostly looked up on hispanic sites.

But the bot's architecture is easy enough (even using BootBot under
the hood, which is _already_ easy enough), that changing the information
sources, localized strings and scrapping logic, or even adding your own
from scratch will be no problem.

## Modules

_This list will keep growing_

- Dictionary (es.thefreedictionary.com)
- Image search (Google)
- Movie search (IMDb)
- Song lyrics (azlyrics.com)
- Web page screenshots (locally running Firefox, with -screenshot cmdline flag)
- Urban Dictionary
- Vademecum (vademecum.es)
- Wikipedia (Spanish and English)
