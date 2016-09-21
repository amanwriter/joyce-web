var theCanvas = document.getElementById("canvasBl");
var context = theCanvas.getContext("2d");

var theCanvas0 = document.getElementById("canvasBg");
var contextbg = theCanvas0.getContext("2d");

var theCanvas1 = document.getElementById("canvasWw");
var contextww = theCanvas1.getContext("2d");

var theCanvas2 = document.getElementById("canvasWwb");
var contextwwb = theCanvas2.getContext("2d");

var zf = 1;
var displayWidth, displayHeight, fLen, projCenterX, projCenterY, zMax, timer, sphereRad = 280,
    particleRad = 30,
    sphereCenterZ = -50;
var virgin = 0;
var angles = [0, 0, 0];
var hitvec = [];
var slow_mo = false;

var counter = 0;
var delivery = 0;

var pitch = [
    [
        [-6000, -400, -300],
        [100, -400, -300],
        [100, 400, -300],
        [-6000, 400, -300], 'goldenrod'
    ],
    [
        [-5000, -400, -300],
        [-5010, -400, -300],
        [-5010, 400, -300],
        [-5000, 400, -300], 'white'
    ]
];

var ball = [-5000, 200, 600];
var ballv = [0, 0, 0];
var wwballv = [0, 0];
var wwball = [150, 120];
var wwbt = 1;
var can_collide = true;

var out = false;

var hack = 3;

var current_game_state = {};

var ball_velocities = [
[70, -1.5, -10], 
[70, -2.7, -10], 
[70, -3.8, -10], 

[70, -1.5, -9], 
[70, -2.7, -9], 
[70, -3.8, -9], 

[70, -1.5, -8], 
[70, -2.7, -8], 
[70, -3.8, -8], 

];

var field_pos = {
"wicketkeeper": [150, 100], 
"straighthit": [150, 260], 
"midoff": [125, 185], 
"longoff": [100, 240], 
"squareleg": [190, 120], 
"deepsquareleg": [255, 110], 
"slip": [130, 105], 
"thirdman": [100, 50]
}

var fields = [

// ["wicketkeeper", "straighthit", "midoff", "longoff", "squareleg", "deepsquareleg", "slip", "thirdman"],
["wicketkeeper", "midoff", "squareleg", "slip", "thirdman"],
["wicketkeeper", "straighthit", "longoff", "deepsquareleg", "thirdman"],
["wicketkeeper", "straighthit", "thirdman", "longoff", "deepsquareleg"],



// [[100, 100],[200, 200],[200, 150]],
// [[50, 150], [200, 250], [120, 170]]

];

var cur_field = [];

// Shots 
var the_shots = {
"leave":[0, 0, false, [0,1,2,3,5,6,8], [4,7], [], ["wicketkeeper"], 0],
"downtheline": [155, 300, true, [4], [1, 7], ["straighthit"], [], 6],
"defence": [125, 185, false, [3,4,5,6,8], [7], [], ["midoff", "longoff"], 1],
"hook": [300, 110, true, [0, 1, 3, 4], [7], ["squareleg"], ["deepsquareleg"], 4],
"latecut": [80, 40, false, [4, 5, 7, 8], [], ["slip"], ["thirdman"], 4] 
};

function begin_game(){

init();
begin_ball();

}

function contains(ar, elem){
    for (var i=0;i<ar.length;i++){
        if (ar[i]==elem){return true;}
    }
    return false;
}

function contains2(ar, ar2){
    for (var i=0;i<ar.length;i++){
        for (var j=0;j<ar2.length;j++){
        if (ar[i]===ar2[j]){return ar2[j];
        }
    }
    }
    return false;
}


function execute_shot(shot_name){

ball = [-5000, 200, 600];
ballv = [0,0,0];

// Check if shot is valid
if (contains(the_shots[shot_name][3], delivery)){
    // The shot is valid
    if (contains2(cur_field, the_shots[shot_name][5])){
        var fielder = contains2(cur_field, the_shots[shot_name][5]);        
        wwballv = [field_pos[fielder][0], field_pos[fielder][1]];
        setTimeout(function() {display_message("CATCH OUT!");
            ws.send("out");
            out = true;
    }, 2000);

    }
    // Check if ball will be stopped
    else if (contains2(cur_field, the_shots[shot_name][6])){
        var fielder = contains2(cur_field, the_shots[shot_name][6]);        
        wwballv = [field_pos[fielder][0], field_pos[fielder][1]];        
        setTimeout(function() {display_message("SINGLE");}, 2000);
        current_game_state["runs"] += 1;
    }
    else {
    // Provide velocity to wwball
    wwballv = [the_shots[shot_name][0], the_shots[shot_name][1]];
    var runs_in_ball = the_shots[shot_name][7];
    setTimeout(function() {display_message(runs_in_ball+" RUNS");}, 2000);
    current_game_state["runs"] += runs_in_ball;
    }

    wwbt = 0;
    current_game_state["balls"] += 1;

    if (current_game_state["balls"]>17){
        // display_message("END OF INNINGS");
        out = true;
    }

}
else{

    if (contains(the_shots[shot_name][4], delivery)){
        current_game_state["balls"] += 1;
        // Batsman is out
        ws.send("out");
        out = true;

        display_message("BOWLED!");

    }
    else {
    display_message("DOT BALL");
    // Bad shot
    }
}

    // Send current game state back to client
    ws.send(JSON.stringify(current_game_state));
    document.getElementById("score").innerHTML  = current_game_state["runs"]+" runs in "+current_game_state["balls"]+" balls";

}

function begin_ball(){
    slow_mo = false;
    wwball = [150, 120];
    wwballv = [0, 0];
    // Select random field
    cur_field = fields[Math.floor(Math.random()*fields.length)];
    wagon_wheel();
    setTimeout(function() { 
        // Select random ball
        delivery = hack;//Math.floor(Math.random()*ball_velocities.length);
        hack += 1;
        ballv = ball_velocities[delivery].slice(); 
        ball = [-5000, 200, 600]; }, 1000);
}

function init() {
    out = false;

    displayWidth = theCanvas.width;
    displayHeight = theCanvas.height;

    fLen = 1000; //320 //represents the distance from the viewer to z=0 depth.

    //projection center coordinates sets location of origin
    projCenterX = displayWidth / 2;
    projCenterY = displayHeight / 2;

    zMax = fLen - 2;
    drawGround();
    //timer = setInterval(onTimer, 100);
    requestAnimationFrame(onTimer);
}

function mat_mult(m1, m2) {
    var result = [];
    for (var i = 0; i < m1.length; i++) {
        result[i] = [];
        for (var j = 0; j < m2[0].length; j++) {
            var sum = 0;
            for (var k = 0; k < m1[0].length; k++) {
                sum += m1[i][k] * m2[k][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

function bounce() {
    var restitution = 0.8;
    var grip = 0.8;
    ballv[2] = -restitution * ballv[2];
    ballv[0] = grip * ballv[0];
    ballv[1] = grip * ballv[1];
    ball[2] = -250;
}

function physics() {
	var prevp = [ball[0], ball[1], ball[2]];
    // Updating ball position
    ball[0] += ballv[0];
    ball[1] += ballv[1];
    ball[2] += ballv[2];

    if ((ballv[0])&&(!(slow_mo))) {
        ballv[2] -= 0.15;
    }
    // Collision detection
    // Ground collision:
    if (ball[2] < -260) {
        bounce();
    }
    if (ball[0] > 800) {
        ballv = [0, 0, 0];
        ball = [-5000, 200, 600];
        can_collide = true;
        return
    }

    if ((ball[0] > 0)&&(!(slow_mo))){
        // execute_shot("hook");
        ws.send("shot");
        ballv[0] = ballv[0]/10;
        ballv[1] = ballv[1]/10;
        ballv[2] = ballv[2]/10;
        slow_mo = true;
    }

    if (wwbt<1){
        wwball[0] = 150*(1-wwbt) + (wwbt)*wwballv[0];
        wwball[1] = 120*(1-wwbt) + (wwbt)*wwballv[1];
        wwbt += 0.01;
    }

}
setInterval(physics, 20);

function drawGround(){
    contextbg.clearRect(0, 0, theCanvas0.width, theCanvas0.height);
    // Drawing the ground
    contextbg.fillStyle = 'limegreen';
    contextbg.moveTo(0, 600);
    contextbg.lineTo(0, 300);
    contextbg.quadraticCurveTo(450, 250, 900, 300);
    contextbg.lineTo(900, 600);
    contextbg.lineTo(0, 600);
    contextbg.fill();

    // Drawing the pitch
    for (var i = 0; i < 2; i++) {
        contextbg.fillStyle = pitch[i][4];
        contextbg.beginPath();
        var startp = [0, 0];
        for (var j = 0; j < 4; j++) {
            var sradius = zf * 1 * fLen / (fLen - (pitch[i][j][0] + sphereCenterZ));
            var sprojX = -pitch[i][j][1] * sradius + projCenterX;
            var sprojY = -pitch[i][j][2] * sradius + projCenterY;
            if (j == 0) {
                contextbg.moveTo(sprojX, sprojY);
                startp = [sprojX, sprojY];
            } else {
                contextbg.lineTo(sprojX, sprojY);
            }
        }
        contextbg.lineTo(startp[0], startp[1]);
        contextbg.closePath();
        contextbg.fill();
    }
    // Drawing stumps
    contextbg.fillStyle = "brown";
    contextbg.fillRect(449, 297, 2, 50);
    contextbg.fillRect(445, 297, 2, 50);
    contextbg.fillRect(453, 297, 2, 50);

    // Drawing reference box
    contextbg.setLineDash([6]);
    contextbg.strokeStyle = "red";
    contextbg.strokeRect(300, 200, 300, 300);
    contextbg.strokeRect(300, 200, 200, 200);
    contextbg.strokeRect(400, 300, 200, 200);
    contextbg.strokeRect(400, 200, 200, 200);
    contextbg.strokeRect(300, 300, 200, 200);


}

function wagon_wheel(){
    contextww.clearRect(0, 0, theCanvas1.width, theCanvas1.height);

    contextww.fillStyle = 'green';
    contextww.beginPath();
    contextww.arc(theCanvas1.width/2, theCanvas1.width/2, 120, 0, 2 * Math.PI, false);
    contextww.closePath();
    contextww.fill();

    contextww.fillStyle = 'lightgreen';
    contextww.beginPath();
    contextww.arc(theCanvas1.width/2, theCanvas1.width/2, 60, 0, 2 * Math.PI, false);
    contextww.closePath();
    contextww.fill();

    contextww.fillStyle = 'bisque';
    contextww.fillRect(140, 120, 20, 60);    

    contextww.fillStyle = 'blue';
    for (var i=0;i<cur_field.length;i++){
        contextww.beginPath();
        contextww.arc(field_pos[cur_field[i]][0], field_pos[cur_field[i]][1], 4, 0, 2 * Math.PI, false);
        contextww.closePath();
        contextww.fill();
    }

    contextww.fillStyle = 'gold';
        contextww.beginPath();
        contextww.arc(150, 126, 6, 0, 2 * Math.PI, false);
        contextww.closePath();
        contextww.fill();
}

function onTimer() {
    context.clearRect(0, 0, theCanvas.width, theCanvas.height);

    if (wwbt>=1){
    // Drawing the main ball
    context.fillStyle = 'red';
    context.beginPath();
    var ball_r = zf * 1 * fLen / (fLen - ball[0]);
    var ball_x = -ball[1] * ball_r + projCenterX;
    var ball_y = -ball[2] * ball_r + projCenterY;
    context.arc(ball_x, ball_y, ball_r * 7, 0, 2 * Math.PI, false);
    context.closePath();
    context.fill();
}
    // Drawing the WW ball
    else{
    wagon_wheel();
    contextwwb.clearRect(0, 0, 300, 300);
    contextwwb.fillStyle = 'red';
    contextwwb.beginPath();
    contextwwb.arc(wwball[0], wwball[1], 2, 0, 2 * Math.PI, false);
    contextwwb.closePath();
    contextwwb.fill();
    }

    requestAnimationFrame(onTimer);
}