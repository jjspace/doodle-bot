# Fiddle Bot

This is a bot/simple program to create reports to check who has completed specified [Doodle](https://doodle.com/) polls. I created it to check who still has yet to answer polls yet so we can enforce group policies.

Currently it requires a `config.js` file exporting settings used by `main.js`. I'm not gonna outline the structure yet because it's likely to change soon as I work towards making this an actual bot not just something that posts to webhooks.

## Notices

The Doodle Logo and Doodle API are property of [Doodle AG (“Doodle”)](https://doodle.com/) and are not my own. The API and likeness is used in accordance of Doodle's [Terms of Service](https://doodle.com/terms-of-service).

This program does not store any information beyond what is required to function. This includes but is not limited to serverIDs and Names and configuration details like expected names and aliases. The only Doodle data that is stored is IDs to enable tracking and reports. All data is stored in a local DB to where the bot is run from and not shared with anyone or sent beyond the workings of the bot.
