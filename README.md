# Better Buzzer

A simple buzzer web app to allow players join a lobby and buzz in.

## How to use
This app is deployed on Heroku, and can be used [here](https://better-buzzer.herokuapp.com/).

A host should create the lobby first and generate a link for other members to join.


## Features

### Lobby Host
* Enable/disable buzzer
* Reset buzzer
* Create and add members to lobby
* View order of member buzzes

![Host Screenshot](https://i.imgur.com/JW1NJnt.png)

### Lobby Member
* View buzzer enabled/disabled
* Hit the buzzer
* Penalty for hitting buzzer before active (to prevent spamming)
* View order of member buzzes

![Member Screenshot](https://i.imgur.com/PmQZNCk.png?1)

### Responsive UI Supports Mobile Viewing

![Host Mobile Screenshot](https://i.imgur.com/Ju9yAmX.png)

---

![Member Mobile Screenshot](https://i.imgur.com/iDcxCIq.png)

## Deploying
The server for this project is written in [Node.js](https://nodejs.org/en/). The real-time updates between client and server are done via [WebSockets](https://github.com/websockets/ws). 

To deploy this project, first install Node.js. Then run:
```
git clone https://github.com/austinjturner/better-buzzer.git
npm install
npm start
```