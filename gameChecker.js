const request = require('request');
const args = require('minimist')(process.argv.slice(2));
const moment = require('moment');
const { spawn } = require('child_process')

const url = `https://statsapi.web.nhl.com/api/v1/schedule?teamId=${args.teamId}`;

let timeTimer = null;
let pid = null;
let gameLink = null;

let gameChecker = null;

function checkGame(){
    request.get({
        url: url,
        json: true
    }, (err, res, data) => {
        if(data.totalGames > 0){
            let game = data.dates[0].games[0];
            pid = process.pid;
            gameLink = game.link;

            timeTimer = setInterval(() => {
                readStartTime(game);
            }, 10000);
        }else{
            let currentDate = moment().format('MM-DD-YYY');
            console.log('No games today ' + currentDate + ', exiting...');
        }
    });
}

function readStartTime(game){
    let utc = moment.utc(game.gameDate).toDate();
    let gameDate = moment(utc).local();
    let currentDate = moment();
    let timeTillGame = Math.floor(moment.duration(gameDate.diff(currentDate)).as('minutes'));

    console.log('Game starts in: ' + timeTillGame + ' minutes.');
    if(timeTillGame <= 10){
        gameChecker = spawn(
            `node gameMonitor.js --teamId=${args.teamId} --gameLink=${gameLink} > logs/game_recap.log &`,
            {
                detached: true,
                stdio: 'inherit',
                shell: true
            }
        );
        process.kill(pid);
        clearInterval(timeTimer);
    }

    // gameChecker.on('exit', () => {
    //     process.kill(pid);
    // });
}

checkGame();