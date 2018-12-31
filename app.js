const player = require('play-sound')(opts={});
const moment = require('moment');
const request = require('request');
const args = require('minimist')(process.argv.slice(2))

const url = `https://statsapi.web.nhl.com/api/v1/schedule?teamId=${args.teamId}`;

let previousMonitorScore = 0;
let badGuysScore = 0;
let monitorTeam = null;
let badGuys = null;
let badGuysTeam = null;
let goodGuysTeam = null;

let scoreChecker = null;

function checkGame(){
    request.get({
        url: url,
        json: true
    }, (err, res, data) => {
        if(data.totalGames > 0 && data.dates[0].games[0].status.abstractGameState === 'Live'){
            console.log('Game found, continuing.');
            setUpGame(data.dates[0].games[0].teams);
        }
    });
}

function setUpGame(teams){
    if(teams.away.team.id === args.teamId){
        console.log('monitored team is away.');
        monitorTeam = 'away';
        badGuys = 'home';
    }else{
        console.log('monitored team is home.');
        monitorTeam = 'home';
        badGuys = 'away';
    }

    badGuysTeam = teams[badGuys].team.name
    goodGuysTeam = teams[monitorTeam].team.name

    previousMonitorScore = teams[monitorTeam].score;
    badGuysScore = teams[badGuys].score;

    scoreChecker = setInterval(watchTeam, 1000);
}

function watchTeam(){
    request.get({
        url: url,
        json: true
    }, (err, res, data) => {
        if(typeof data === 'undefined'){
            return false;
        }
        
        let score = data.dates[0].games[0].teams[monitorTeam].score;
        let badScore = data.dates[0].games[0].teams[badGuys].score;

        if(score !== previousMonitorScore){
            console.log(`GOALLLLLLLLLLL! ${goodGuysTeam} scored!`);
            previousMonitorScore = score;
            player.play('horn.mp3', () => {});
        }

        if(badScore !== badGuysScore){
            console.log(`Boooooooo!  ${badGuysTeam} scored!`);
            badGuysScore = badScore;
            player.play('bad_guys_score.mp3', () => {});
        }
    });
}

function gameRequest(callback){
    request.get({
        url: url,
        json: true
    }, (err, res, data) => {
        callback(data);
    });
}

checkGame();

