# Spotted ![GitHub last commit](https://img.shields.io/github/last-commit/janek515/spotted) [![DeepSource](https://deepsource.io/gh/janek515/spotted.svg/?label=active+issues&show_trend=true&token=DGh9kVWwA_5IaekPOq5Dc11m)](https://deepsource.io/gh/janek515/spotted/?ref=repository-badge) ![Code Climate maintainability](https://img.shields.io/codeclimate/maintainability/janek515/spotted)
Spotted React App which transforms messages into images and uploads them to instagram.

[//]: # "TODO Add features preview"

# Dependencies

### Prerequisites
- ![](https://img.shields.io/github/pipenv/locked/python-version/janek515/spotted)
- [`yarn`](https://yarnpkg.com/cli/install) or `npm`

In order to install dependencies use yarn and pipenv.

```shell
pipenv sync
```

```shell
yarn install
```

# Configuration

Included in this repo are two configuration files.
Front-end configuration file `sconfig.json` is located in the `src` subdirectory and back-end configuration file `config.json` is in the root folder.

## `sconfig.json`

| key                   | value       | meaning                                       |
|-----------------------|-------------|-----------------------------------------------|
| `locale`              | `"en-US"`   | locale used in the app                          |
| `Header`              | `"Spotted"` | the header of the page                        |
| `TimeBetweenMessages` | `10`      | the minimum time between sending messages (s) |
| `RecentMessagesCount` | `5` | the number of recent messages displayed on the page |

## `config.json`

| key        | meaning            |
|------------|--------------------|
| `username` | Instagram username |
| `password` | Instagram password |
| `databaseAddress` | MongoDB database address |
| `databaseName` | MongoDB database name |

#### example `config.json`

```json
{
  "username": "myUsername",
  "password": "myPassword",
  "databaseAddress": "mongodb+srv://username:password@mydatabaseserver.com/spotted",
  "databaseName": "spotted"
}
```

## Database
You also need to configure an instance of MongoDB for the app.  
You need to create a database, specify its name in the `config.json` file and create new empty collection named `data` inside it.
#### Free MongoDB instance
For this lightweight application, you can use the free database instance available on [cloud.mongodb.com](https://cloud.mongodb.com/) 

### locales

As of today only Polish and English have their locales, feel free to add yours, by creating a key with its name inside `/src/locales.json` file.

## Building

To build the React app you need to run `yarn build`

# Deployment

The app can be served with a wsgi server, it should be served using `wsgi.py` as a handle.  
An example command for gunicorn:

```shell
gunicorn wsgi:app
```

## Heroku
There is a `Procfile` included for easy heroku deployment.  
You also need to add two buildpacks for the app to build correctly. 
- `heroku/nodejs`
- `heroku/python`

# License

MIT © Jan Ochwat

