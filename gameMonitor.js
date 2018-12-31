const request = require('request');
const args = require('minimist')(process.argv.slice(2));
const moment = require('moment');
const player = require('play-sound')(opts={});

const url = `https://statsapi.web.nhl.com${args.gameLink}`;

let goodGuys = null;
let goodGuysScore = 0;
let goodGuysName = null;

let badGuys = null;
let badGuysName = null;
let badGuysScore = 0;

let gameChecker = null;
let scoreChecker = null;

function checkGame(){
    request({
        url: url,
        json: true
    }, (err, res, data) => {
        setUpTeams(data);
    });
}
function setUpTeams(data){
    if(data.gameData.teams.away.id === args.teamId){
        goodGuys = 'away';
        goodGuysScore = data.liveData.linescore.teams.away.goals;
        goodGuysName = data.gameData.teams.away.name;

        badGuys = 'home';
        badGuysScore = data.liveData.linescore.teams.home.goals;
        badGuysName = data.gameData.teams.home.name;
    }else{
        badGuys = 'away';
        badGuysScore = data.liveData.linescore.teams.away.goals;
        badGuysName = data.gameData.teams.away.name;

        goodGuys = 'home';
        goodGuysScore = data.liveData.linescore.teams.home.goals;
        goodGuysName = data.gameData.teams.home.name;
    }

    setUpGame(data);
}
function setUpGame(data){
    let gameStatus = data.gameData.status.abstractGameState;

    switch(gameStatus){
        case "Live":
            console.log('Game has Started');
            scoreChecker = setInterval(watchScore, 500);
            clearInterval(gameChecker);
        break;
        case "Final":
            console.log(`Game has finished. Final score: ${goodGuysName} ${goodGuysScore}, ${badGuysName} ${badGuysScore}`);
            process.kill(process.pid);
        break;
        default:
            console.log('Game has not started yet.');

            gameChecker = setInterval(() => {
                checkGame();
            }, 30000);
        break;
    }
}

function watchScore(){
    request.get({
        url: url,
        json: true
    }, (err, res, data) => {
        if(typeof data === 'undefined'){
            return false;
        }

        if(data.gameData.status.abstractGameState === 'Final'){
            console.log(`Game has finished. Final score: ${goodGuysName} ${goodGuysScore}, ${badGuysName} ${badGuysScore}`);
            process.kill(process.pid);
        }
        
        let newGoodGuysScore = data.liveData.linescore.teams[goodGuys].goals;
        let newBadGuysScore = data.liveData.linescore.teams[badGuys].goals;

        if(newGoodGuysScore !== goodGuysScore){
            console.log(`GOALLLLLLLLLLL! ${goodGuysTeam} scored!`);
            goodGuysScore = newGoodGuysScore;
            player.play('horn.mp3', () => {});
        }

        if(newBadGuysScore !== badGuysScore){
            console.log(`Boooooooo!  ${badGuysTeam} scored!`);
            badGuysScore = newBadGuysScore;
            player.play('bad_guys_score.mp3', () => {});
        }
    });
}

checkGame();