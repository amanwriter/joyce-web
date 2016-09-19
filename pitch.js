var theCanvas = document.getElementById("canvasOne");
var context = theCanvas.getContext("2d");

var selectx = 0,
    selecty = 0,
    selectz = 0;
var zf = 1;
var displayWidth, displayHeight, fLen, projCenterX, projCenterY, zMax, timer, sphereRad = 280,
    particleRad = 30,
    sphereCenterZ = -50;
var virgin = 0;
var angles = [0, 0, 0];
var hitvec = [];

var counter = 0;

// For simplicity's sake Bat is a collection of rectangles, triangles and trapeziums
var bat = [
    // Front Face
    [
        [-280, -15, 0],
        [-280, 15, 0],
        [-100, 15, 0],
        [-100, -15, 0], 'chocolate'
    ], //Top

    [
        [-280, -15, 0],
        [-280, -15, -7],
        [-100, -15, -7],
        [-100, -15, 0], 'burlywood'
    ], // Left
    [
        [-280, 15, 0],
        [-280, 15, -7],
        [-100, 15, -7],
        [-100, 15, 0], 'burlywood'
    ], //Right
    // Bottom
    [
        [-280, -15, -7],
        [-240, 0, -20],
        [-100, 0, -7],
        [-100, -15, -7], 'saddlebrown'
    ],
    [
        [-280, 15, -7],
        [-240, 0, -20],
        [-100, 0, -7],
        [-100, 15, -7], 'sienna'
    ],
    [
        [-280, -15, -7],
        [-240, 0, -20],
        [-280, 15, -7], 'peru'
    ],

    //Handle Front
    [
        [-100, -5, 0],
        [-100, 5, 0],
        [0, 5, 0],
        [0, -5, 0], 'green'
    ], // Top
    [
        [-100, -5, 0],
        [-100, -5, -5],
        [0, -5, -5],
        [0, -5, 0], 'green'
    ], //Left
    [
        [-100, 5, 0],
        [-100, 5, -5],
        [0, 5, -5],
        [0, 5, 0], 'green'
    ], // Right
    [
        [-100, -5, -5],
        [-100, 5, -5],
        [0, 5, -5],
        [0, -5, -5], 'green'
    ] // Bottom

];

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
    ],
    [
        [-250, -400, -300],
        [-260, -400, -300],
        [-260, 400, -300],
        [-250, 400, -300], 'white'
    ]
];

var ball = [-5000, 200, 600];
var ballv = [0, 0, 0];
var can_collide = true;
var projp, bat_plane;
var vgn2 = 0;

// Websocket
var ws = new WebSocket("ws://127.0.0.1:8080/ws");

ws.onopen = function() {
    // var timertoggle = setInterval(function(){ws.send('0');}, 20);
};

ws.onmessage = function(event) {

    if (virgin == 0) {
        init();
        virgin = 1;
    }
    var command = event.data.split(" ");

    if (command[0] == 'ball') {
        ballv = [70, -3, -7];
    } else if (command[0] == 'reset') {
        ballv = [0, 0, 0];
        ball = [-5000, 200, 600];
        can_collide = true;
    } else if (command[0] == 'shot') {
        multi = 1 - 2 * parseFloat(command[3]);
        ballv = [multi*hitvec[0], multi*hitvec[1], multi*hitvec[2]];
        // ballv = [0, 0, 0];
        // can_collide = true;
        console.log("Boom goes the dynamite!");
        console.log(multi);
    } else {
        angles = [parseFloat(command[0]), parseFloat(command[1]), parseFloat(command[2])];
    }
}

function init() {

    displayWidth = theCanvas.width;
    displayHeight = theCanvas.height;

    fLen = 1000; //320 //represents the distance from the viewer to z=0 depth.

    //projection center coordinates sets location of origin
    projCenterX = displayWidth / 2;
    projCenterY = displayHeight / 2;

    zMax = fLen - 2;

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
    6
    // console.log('distance');
    // console.log(ball[0]);
}

function transform(a, b) {
    var rza = [
        [Math.cos(b[0]), -Math.sin(b[0]), 0],
        [Math.sin(b[0]), Math.cos(b[0]), 0],
        [0, 0, 1]
    ];
    var ryb = [
        [Math.cos(b[1]), 0, Math.sin(b[1])],
        [0, 1, 0],
        [-Math.sin(b[1]), 0, Math.cos(b[1])]
    ];
    var rxg = [
        [1, 0, 0],
        [0, Math.cos(b[2]), -Math.sin(b[2])],
        [0, Math.sin(b[2]), Math.cos(b[2])]
    ];

    var r = mat_mult(mat_mult(rza, ryb), rxg);

    return mat_mult(r, a);
}

function reverse_transform(a, b) {
    b = [-b[0], -b[1], -b[2]];
    var rza = [
        [Math.cos(b[0]), -Math.sin(b[0]), 0],
        [Math.sin(b[0]), Math.cos(b[0]), 0],
        [0, 0, 1]
    ];
    var ryb = [
        [Math.cos(b[1]), 0, Math.sin(b[1])],
        [0, 1, 0],
        [-Math.sin(b[1]), 0, Math.cos(b[1])]
    ];
    var rxg = [
        [1, 0, 0],
        [0, Math.cos(b[2]), -Math.sin(b[2])],
        [0, Math.sin(b[2]), Math.cos(b[2])]
    ];

    var r = mat_mult(mat_mult(rxg, ryb), rza);

    return mat_mult(r, a);
}

function physics() {
	var prevp = [ball[0], ball[1], ball[2]];
    // Updating ball position
    ball[0] += ballv[0];
    ball[1] += ballv[1];
    ball[2] += ballv[2];

    if (ballv[0]) {
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
    // Avoid checking for collision if ball is too far away
    if (ball[0] < -300){
    	return
    }

    // Bat collision
    if (bat_plane) {
        // Obtain equation of bat plane
        var v1 = [0, 0, 0];
        var v2 = [0, 0, 0];
        for (var i = 0; i < 3; i++) {
            v1[i] = bat_plane[0][i] - bat_plane[2][i];
            v2[i] = bat_plane[1][i] - bat_plane[2][i];
        }

        var numrtm = [
        [1, 1, 1, 1], 
        [bat_plane[0][0][0], bat_plane[1][0][0], bat_plane[2][0][0], ball[0]],
        [bat_plane[0][1][0], bat_plane[1][1][0], bat_plane[2][1][0], ball[1]],
        [bat_plane[0][2][0], bat_plane[1][2][0], bat_plane[2][2][0], ball[2]]
        ];
        var denomm = [
        [1, 1, 1, 0],
        [bat_plane[0][0][0], bat_plane[1][0][0], bat_plane[2][0][0], prevp[0]-ball[0]],
        [bat_plane[0][1][0], bat_plane[1][1][0], bat_plane[2][1][0], prevp[1]-ball[1]],
        [bat_plane[0][2][0], bat_plane[1][2][0], bat_plane[2][2][0], prevp[2]-ball[2]]
        ];

        // console.log(prevp[0]-ball[0]);
        // console.log(prevp[1]-ball[1]);
        // console.log(prevp[2]-ball[2]);
        // console.log(numrtm);
        // console.log(denomm);

        var in_ball = false;
        var t0 = - math.det(numrtm)/math.det(denomm);
        // console.log(t0);
        projp = [
        	[ball[0] + t0 * (prevp[0]-ball[0])],
        	[ball[1] + t0 * (prevp[1]-ball[1])],
        	[ball[2] + t0 * (prevp[2]-ball[2])]
        		];
        // console.log(projp);
        if ((t0<1) && (t0>0)){
            console.log("collision!");
        	in_ball = true;
        }

        // Getting reflection point 

        var ca = v1[1] * v2[2] - v1[2] * v2[1];
        var cb = v1[2] * v2[0] - v1[0] * v2[2];
        var cc = v1[0] * v2[1] - v1[1] * v2[0];
        var cd = -(ca * bat_plane[0][0] + cb * bat_plane[0][1] + cc * bat_plane[0][2]);

        // Project ball center on bat plane
        var t0 = -2 * (ca * ball[0] + cb * ball[1] + cc * ball[2] + cd) / (ca * ca + cb * cb + cc * cc);
        var refl = [
            [ball[0] + ca * t0],
            [ball[1] + cb * t0],
            [ball[2] + cc * t0]
        ];
        // //Check if point inside ball
        // var in_ball = false;
        // if (t0 * t0 * (ca * ca + cb * cb + cc * cc) < 1600) {
        //     in_ball = true;
        // }

        //Check if point inside bat
        if (in_ball) {

            var new_p = reverse_transform(projp, angles);
            console.log(new_p);
            if ((new_p[0][0] > -280) && (new_p[0][0] < -100)) {
                if ((new_p[1][0] > -15) && (new_p[1][0]) < 15) {
                    // Hit
                    console.log('collision');
                    if (can_collide) {
                        hitvec = [-projp[0][0] + refl[0][0], -projp[1][0] + refl[1][0], -projp[2][0] + refl[2][0]];
                        var norm = Math.sqrt(hitvec[0]*hitvec[0]+hitvec[1]*hitvec[1]+hitvec[2]*hitvec[2]);
                        for (var i=0;i<3;i++){
                            hitvec[i] = hitvec[i]/norm;
                        }
                        // HitVec is now a unit vector pointing towards the desired direction of the ball
                        // Disabling ball movement until speed is computed
                        ballv = [0,0,0];
                        // ballv = [2 * hitvec[0], 2 * hitvec[1], 2 * hitvec[2]];
                        ws.send('v');
                        can_collide = false;
                    }
                }
            }
        }
    }

}
setInterval(physics, 20);
// physics();

function onTimer() {
    context.clearRect(0, 0, canvasOne.width, canvasOne.height);

    // Drawing the ground
    context.fillStyle = 'lawngreen';
    context.moveTo(0, 600);
    context.lineTo(0, 300);
    context.quadraticCurveTo(450, 250, 900, 300);
    context.lineTo(900, 600);
    context.lineTo(0, 600);
    context.fill();

    bat_plane = [];
    var to_draw = [];
    for (var i = 0; i < bat.length; i++) {
        var to_draw2 = [];
        for (var j = 0; j < bat[i].length - 1; j++) {
            var cords = [
                [bat[i][j][0]],
                [bat[i][j][1]],
                [bat[i][j][2]]
            ];
            var n_cords = transform(cords, angles);
            if (i == 0) {
                bat_plane.push(n_cords);
            }
            var sradius = zf * 1 * fLen / (fLen - (n_cords[0][0] + sphereCenterZ));
            var sprojX = -n_cords[1][0] * sradius + projCenterX;
            var sprojY = -n_cords[2][0] * sradius + projCenterY;
            to_draw2.push([sprojX, sprojY, n_cords[0][0]]);
        }
        to_draw.push([to_draw2, bat[i][bat[i].length - 1]]);
    }

    to_draw = to_draw.sort(function(a, b) {
        var mina = -1000;
        for (var k = 0; k < a[0].length; k++) {
            if (a[0][k][2] > mina) {
                mina = a[0][k][2];
            }
        }
        var minb = -1000;
        for (var k = 0; k < b[0].length; k++) {
            if (b[0][k][2] > minb) {
                minb = b[0][k][2];
            }
        }

        return mina - minb;
    });

    // Drawing the pitch
    for (var i = 0; i < 3; i++) {
        context.fillStyle = pitch[i][4];
        context.beginPath();
        var startp = [0, 0];
        for (var j = 0; j < 4; j++) {
            var sradius = zf * 1 * fLen / (fLen - (pitch[i][j][0] + sphereCenterZ));
            var sprojX = -pitch[i][j][1] * sradius + projCenterX;
            var sprojY = -pitch[i][j][2] * sradius + projCenterY;
            if (j == 0) {
                context.moveTo(sprojX, sprojY);
                startp = [sprojX, sprojY];
            } else {
                context.lineTo(sprojX, sprojY);
            }
        }
        context.lineTo(startp[0], startp[1]);
        context.closePath();
        context.fill();
    }

    // Drawing the ball
    context.fillStyle = 'red';
    context.beginPath();
    var ball_r = zf * 1 * fLen / (fLen - ball[0]);
    var ball_x = -ball[1] * ball_r + projCenterX;
    var ball_y = -ball[2] * ball_r + projCenterY;
    context.arc(ball_x, ball_y, ball_r * 7, 0, 2 * Math.PI, false);
    context.closePath();
    context.fill();

    // Drawing the bat
    for (var i = 0; i < to_draw.length; i++) {
        context.fillStyle = to_draw[i][1];
        var startp = [0, 0];
        context.beginPath();
        for (var j = 0; j < to_draw[i][0].length; j++) {
            var sprojX = to_draw[i][0][j][0];
            var sprojY = to_draw[i][0][j][1];
            if (j == 0) {
                context.moveTo(sprojX, sprojY);
                startp = [sprojX, sprojY];
            } else {
                context.lineTo(sprojX, sprojY);
            }
        }
        context.lineTo(startp[0], startp[1]);
        context.closePath();
        context.fill();
    }

    if (projp) {
        // Drawing order test, if projection is behind ball, draw ball again
        if (projp[0][0] < ball[0]) {
            context.fillStyle = 'red';
            context.beginPath();
            var ball_r = zf * 1 * fLen / (fLen - ball[0]);
            var ball_x = -ball[1] * ball_r + projCenterX;
            var ball_y = -ball[2] * ball_r + projCenterY;
            // var ball_r = zf * 1 * fLen / (fLen - projp[0][0]);
            // var ball_x = -projp[1][0] * ball_r + projCenterX;
            // var ball_y = -projp[2][0] * ball_r + projCenterY;
            // console.log(ball_x);
            // console.log(ball_y)
            if (ball_r > 0){
            context.arc(ball_x, ball_y, ball_r * 7, 0, 2 * Math.PI, false);
            context.closePath();
            context.fill();
        }
        }
    }
    requestAnimationFrame(onTimer);
}