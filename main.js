var AM = new AssetManager();

function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function Food(game, x, y) {
    this.radius = 5;
    var nX = x;
    var nY = y;
    if (x === undefined) nX = 20 + Math.random() * 1580;
    if (y === undefined) nY = 20 + Math.random() * 880;
    Entity.call(this, game, nX, nY);
}

Food.prototype = new Entity();
Food.prototype.constructor = Food;

Food.prototype.draw = function (ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "#FFFFFF";
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
};

Food.prototype.detectCollision = function () {};

function Cell(game, x, y, radius, loaded) {
    if (radius != undefined) this.radius = radius;
    else this.radius = 10 + Math.random() * 20;
    this.speed = function () {return 200 / this.radius};
    this.vX = 0;
    this.vY = 0;
    this.color = "#ffffff";
    if (loaded === undefined) {
        this.angle = Math.random() * 360;
        var angleAdj = this.angle * Math.PI;
        angleAdj /= 180;
        this.vX = Math.cos(angleAdj);
        this.vY = Math.sin(angleAdj);
    }
    this.collapsing = false;
    this.collapseCycle = 0;
    this.inert = false;
    this.criticalMassCycles =  0;
    this.maxRadius = 0;
    
    var nX = x;
    var nY = y;
    if (x === undefined) nX = 100 + Math.random() * 1400;
    if (y === undefined) nY = 100 + Math.random() * 700;
    Entity.call(this, game, nX, nY);
}

Cell.prototype = new Entity();
Cell.prototype.constructor = Cell;

Cell.prototype.update = function () {
    Entity.prototype.update.call(this);
    if (!this.inert) {
        if (!this.collapsing) {
            this.x += this.vX * this.speed();
            this.y += this.vY * this.speed();
            if (this.radius > 120) {
                this.collapsing = true;
                this.criticalMassCycles++;
                if (this.criticalMassCycles === 3) this.inert = true;
                this.maxRadius = this.radius;
            }
        } else {
            if (this.collapseCycle === 15) {
                var newCircle = 10 + Math.random() * 10;
                this.radius -= Math.sqrt(20);
                this.game.addEntity(new Cell(this.game, this.x, this.y, newCircle));
                this.collapseCycle = 0;
                if (this.radius < 30) {
                    if (this.radius < 0) this.radius = 1;
                    this.collapsing = false;
                    this.maxRadius = 0;
                }
            } else this.collapseCycle++;
        }
    }
};

Cell.prototype.detectCollision = function () {
    if (!this.inert) {
        var posX = this.x + this.radius;
        if (posX > 1600) {
            var diff = posX - 1600;
            this.x -= diff;
            var vectors = diff / this.vX;
            this.y -= vectors * this.vY;
            this.vX *= -1;
        }
        posX -= this.radius * 2;
        if (posX < 0) {
            var diff = 0 - posX;
            this.x += diff;
            var vectors = Math.abs(diff / this.vX);
            this.y -= vectors * this.vY;
            this.vX *= -1;
        }
        var posY = this.y + this.radius;
        if (posY > 900) {
            var diff = posY - 900;
            this.y -= diff;
            var vectors = diff / this.vY;
            this.x -= vectors * this.vX;
            this.vY *= -1;
        }
        posY -= this.radius * 2;
        if (posY < 0) {
            var diff = 0 - posY;
            this.y += diff;
            var vectors = Math.abs(diff / this.vY);
            this.x -= vectors * this.vX;
            this.vY *= -1;
        }

        for (var i = 0; i < this.game.entities.length; i++) {
            var other = this.game.entities[i];
            if (!other.collapsing) {
                var dist = distance(this, other);
                var diff = this.radius + other.radius - dist;
                if (dist <= this.radius + other.radius) {
                    if (this.radius > other.radius * 1.5) {
                        this.radius = Math.sqrt((this.radius * this.radius * Math.PI + other.radius * other.radius * Math.PI) / Math.PI);
                        other.removeFromWorld = true;
                    } else if (this.radius * 1.5 < other.radius) {
                        other.radius = Math.sqrt((this.radius * this.radius * Math.PI + other.radius * other.radius * Math.PI) / Math.PI);
                        this.removeFromWorld = true;
                    } else {
                        if (this.x > other.x) {
                            this.x += diff / 2;
                            other.x -= diff / 2;
                        } else {
                            this.x -= diff / 2;
                            other.x += diff / 2;
                        }

                        if (this.y > other.y) {
                            this.y += diff / 2;
                            other.y -= diff / 2;
                        } else {
                            this.y -= diff / 2;
                            other.y += diff / 2;
                        }

                        var newVelX1 = ((this.speed() * this.vX * (this.radius - other.radius) + (2 * other.radius * other.speed() * other.vX)) / (this.radius + other.radius)) / this.speed();
                        var newVelY1 = ((this.speed() * this.vY * (this.radius - other.radius) + (2 * other.radius * other.speed() * other.vY)) / (this.radius + other.radius)) / this.speed();
                        var newVelX2 = ((other.speed() * other.vX * (other.radius - this.radius) + (2 * this.radius * this.speed() * this.vX)) / (this.radius + other.radius)) / other.speed();
                        var newVelY2 = ((other.speed() * other.vY * (other.radius - this.radius) + (2 * this.radius * this.speed() * this.vY)) / (this.radius + other.radius)) / other.speed();

                        this.vX = newVelX1;
                        this.vY = newVelY1;

                        other.vX = newVelX2;
                        other.vY = newVelY2;

                        // this.x += this.vX * this.speed;
                        // this.y += this.vY * this.speed;
                        // other.x += other.vX * other.speed;
                        // other.y += other.vY * other.speed;
                    }
                }
            }
        }
    }
};
Cell.prototype.draw = function (ctx) {
    var color = 0xFFFFFF - Math.floor(255 * Math.min(120, this.radius) / 120) - Math.floor(255 * Math.min(120, this.radius) / 120) * 256;
    ctx.save();
    if (this.collapsing && !this.inert) {
        ctx.beginPath();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 5;
        ctx.arc(this.x, this.y, this.maxRadius, 0, Math.PI * 2, false);
        ctx.stroke();
        ctx.closePath();
        ctx.strokeStyle = "#00000000";
    }
    ctx.beginPath();
    if (this.inert) ctx.fillStyle = "#2090DF";
    else ctx.fillStyle = "#" + color.toString(16);
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
};

AM.queueDownload("./img/background.jpg");

var socket = io.connect("http://76.28.150.193:8888");
// socket.on("load", function (data) {
//     console.log(data);
// });

window.onload = function () {
    console.log("starting up da sheild");
    
    AM.downloadAll(function () {
        console.log("starting up da sheild");
        var canvas = document.getElementById("gameWorld");
        var ctx = canvas.getContext("2d");

        var gameEngine = new GameEngine();
        gameEngine.init(ctx);

        for (var i = 0; i < 10; i++) {
            gameEngine.addEntity(new Cell(gameEngine, 100 + Math.random() * 1400, 100 + Math.random() * 700));
        }
        for  (i = 0; i < 250; i++) {
            gameEngine.addEntity(new Food(gameEngine));
        }
        gameEngine.start();

        socket.on("load", function (data) {
            gameEngine.load(data.data);
            console.log(data.data);
        });
        var save = document.getElementById("save");
        var load = document.getElementById("load");

        save.onclick = function () {
            socket.emit("save", { studentname: "Michael Badgett", statename: "saveState", data: gameEngine.save()});
            console.log("dataSaved");
        };

        load.onclick = function () {
            socket.emit("load", { studentname: "Michael Badgett", statename: "saveState" });
        };
        console.log("All Done!");
    });
};