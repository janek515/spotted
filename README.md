# Spotted
Spotted style React App which transforms messages into images and uploads them to instagram.


# Dependencies

In order to install dependencies use yarn and pipenv.
You need python 3.9 installed.

```shell
pipenv sync
```

```shell
yarn install
```

# Configuration

Included with this repo are two configuration files.
Front-end configuration file `sconfig.json` is located in the `src` subfolder and back-end configuration file `config.json` is in the root folder.

## `sconfig.json`

| key                   | value       | meaning                                       |
|-----------------------|-------------|-----------------------------------------------|
| `locale`              | `"en-US"`   | language of the app                           |
| `Header`              | `"Spotted"` | the header of the page                        |
| `TimeBetweenMessages` | `"10"`      | the minimum time between sending messages (s) |

## `config.json`

| key        | meaning            |
|------------|--------------------|
| `username` | instagram username |
| `password` | instagram password |

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

There is a `Procfile` included for easy heroku deployment.

# License

MIT © Jan Ochwat

