window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

function GameEngine() {
    this.entities = [];
    this.ctx = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
}

GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.timer = new Timer();
    console.log('game initialized');
};

GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
};

GameEngine.prototype.addEntity = function (entity) {
    console.log('added entity');
    this.entities.push(entity);
};

GameEngine.prototype.removeEntity = function (entity) {
    var location = this.entities.indexOf(entity);
    this.entities.splice(location, 1);
};


GameEngine.prototype.draw = function () {
    this.ctx.clearRect(0, 0, this.surfaceWidth, this.surfaceHeight);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    this.ctx.restore();
};

GameEngine.prototype.update = function () {
    for (var i = 0; i < this.entities.length; i++) {
        var entity = this.entities[i];
        if (!entity.removeFromWorld) {
            entity.update();
            if (!entity.collapsing) entity.detectCollision();
        } else {
            this.removeEntity(entity);
            if (entity instanceof Food) {
                var chance = Math.random();
                if (this.entities.length < 260) chance = 1;
                if (chance > .95) this.addEntity(new Food(this));
            }
        }
    }
    // for (var i = 0; i < entitiesCount; i++) {
    //     var entity = this.entities[i];
    //     entity.detectCollision();
    // }
};

GameEngine.prototype.loop = function () {
    this.clockTick = this.timer.tick();
    this.update();
    this.draw();
};

GameEngine.prototype.save = function () {
    var rtn = [];
    for (var i = 0; i < this.entities.length; i++) {
        var ent = this.entities[i];
        if (ent instanceof Food) {
            var entry = {type: "Food", x: ent.x, y: ent.y};
            rtn.push(entry);
        } else {
            var entry = {type: "Cell", x: ent.x, y: ent.y, radius: ent.radius, vX: ent.vX, vY: ent.vY,
                collapsing: ent.collapsing, collapseCycle: ent.collapseCycle, inert: ent.inert, criticalMassCycles: ent.criticalMassCycles,
                maxRadius: ent.maxRadius };
            console.log(entry);
            rtn.push(entry);
        }
    }
    return rtn;
};

GameEngine.prototype.load = function (entities) {
    this.entities = [];
    for (var i = 0; i < entities.length; i++) {
        var ent = entities[i];
        if (ent.type === "Food") {
            this.addEntity(new Food(this, ent.x, ent.y));
        } else {
            var cell = new Cell(this, ent.x, ent.y, ent.radius, true);
            cell.vX = ent.vX;
            cell.vY = ent.vY;
            cell.collapsing = ent.collapsing;
            cell.collapseCycle = ent.collapseCycle;
            cell.criticalMassCycles = ent.criticalMassCycles;
            cell.inert = ent.inert;
            cell.maxRadius = ent.maxRadius;
            this.addEntity(cell);
        }
    }
};

function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function () {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
};

function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
};

Entity.prototype.draw = function (ctx) {
    if (this.game.showOutlines && this.radius) {
        this.game.ctx.beginPath();
        this.game.ctx.strokeStyle = "green";
        this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.game.ctx.stroke();
        this.game.ctx.closePath();
    }
};
