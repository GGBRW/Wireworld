var canvas = document.getElementById("canvas"),
    ctx = canvas.getContext("2d");

// De grootte van het rooster wordt automatisch aangepast aan de grootte van het venster.
canvas.height = window.innerHeight - 30;
canvas.width = window.innerWidth;
window.onresize = function() {
    canvas.height = window.innerHeight - 30;
    canvas.width = window.innerWidth;
    grid.update();
}

var prevGen = [];

ctx.imageSmoothingEnabled = false;

// Als er met de rechtermuisknop op het rooster wordt geklikt, verschijnt er geen contextmenu. 
canvas.oncontextmenu = function() {
    return false;  
} 

// De CSS van body aanpassen zodat het rooster het hele scherm vult.
document.body.style.margin = 0;
document.body.style.overflow = "hidden";

// Het rooster is een object waarin alle functies en cellen in zijn opgeslagen
var grid = {
    background: "#fff",
    color: "#ccc",
    cells: [],
    cellStates: {
        selected: "Conductor"
    },
    addCellState: function(name, properties, values) {
        grid.cellStates[name] = new Object;
        for(var i = 0; i < properties.length; i++) {
            grid.cellStates[name][properties[i]] = values[i];
        }
    },
    findCell: function(x,y,cellState) {
        if(typeof cellState == "undefined" || cellState == "*") {
            for(var i = 0, len = grid.cells.length; i < len; i++) {
                if(grid.cells[i].x == x && grid.cells[i].y == y && grid.cells[i].cellState != "empty") {
                    return i;
                }
            }
        } else {
            for(var i = 0, len = grid.cells.length; i < len; i++) {
                if(grid.cells[i].x == x && grid.cells[i].y == y && grid.cells[i].cellState == cellState) {
                    return i;
                }
            }
        }
        return -1;
    },
    findEmptyCell: function(x,y) {
        var i = grid.cells.length;
        while(--i) {
            if(grid.cells[i].x == x && grid.cells[i].y == y && grid.cells[i].cellState == "empty") {
                return i;
            }
        }
        return -1;
    },
    fill: function(x,y,color) {
        ctx.fillStyle = color;
        if(grid.color != "none") {
            x = (x + grid.offset.x) * grid.zoom + 1,
            y = (y + grid.offset.y) * grid.zoom + 1;     
            ctx.fillRect(x,y,grid.zoom - 1,grid.zoom - 1);
        } else {
            x = (x + grid.offset.x) * grid.zoom,
            y = (y + grid.offset.y) * grid.zoom;     
            ctx.fillRect(x,y,grid.zoom,grid.zoom);
        }
    },
    createCell: function(x,y,cellState) {
        if(typeof grid.cellStates[cellState] == "undefined") {
            cellState = "default";
        }
        if(grid.findCell(x,y,cellState) == -1) {
            grid.removeCell(x,y);
            
            grid.cells.unshift({
                x: x,
                y: y,
                cellState: cellState,
                neighbors: grid.countNeighbors(x,y)
            });
            
            /*for(var r = 0, len = 2 * Math.PI, incr = .25 * Math.PI; r < len; r += incr) {
                var nx = x + Math.round(Math.sin(r)),
                    ny = y + Math.round(Math.cos(r)),
                    index = grid.findCell(nx,ny);
                if(index != -1) {
                    grid.cells[index].neighbors++;
                } else {
                    grid.cells.push({
                        x: nx,
                        y: ny,
                        cellState: "empty",
                        neighbors: grid.countNeighbors(nx,ny)
                    });
                }
            }*/
            
            grid.fill(x,y,grid.cellStates[cellState].color);
        }
    },
    removeCell: function(x,y) {
        var index = grid.findCell(x,y);
        if(index != -1) {
            grid.cells.splice(index,1);
        }
        
        grid.fill(x,y,grid.cellStates["empty"].color);
    },
    countNeighbors: function(x,y,cellState) {
        neighbors = 0;
        if(typeof cellState == "undefined") {
            cellState = "default";
        }
        
        for(var r = 0, len = 2 * Math.PI, incr = .25 * Math.PI; r < len; r += incr) {
            var nx = x + Math.round(Math.sin(r)),
                ny = y + Math.round(Math.cos(r));
            if(grid.findCell(nx,ny,cellState) != -1) {
                neighbors++;
            }
        }
        return neighbors;
    },
    offset: {
        x: 0,
        y: 0
    },
    zoom: 20,
    update: function() {
        ctx.fillStyle = grid.background;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        
        for(var i = 0, len = grid.cells.length; i < len; i++) {
            var x = (grid.cells[i].x + grid.offset.x) * grid.zoom,
                y = (grid.cells[i].y + grid.offset.y) * grid.zoom;
            if(x > -grid.zoom && x < canvas.width && y > -grid.zoom && y < canvas.height && grid.cells[i].cellState != "empty") {
                ctx.fillStyle = grid.cellStates[grid.cells[i].cellState].color;
                ctx.fillRect(x + 1, y + 1, grid.zoom - 1, grid.zoom - 1);
            }
        }
        
        if(grid.color != "none") {
            ctx.fillStyle = grid.color;
            for(var x = (grid.offset.x * grid.zoom) % grid.zoom, len = canvas.width; x < len; x += grid.zoom) {
                ctx.fillRect(x,0,1,canvas.height);
            }
            for(var y = (grid.offset.y * grid.zoom) % grid.zoom, len = canvas.height; y < len; y += grid.zoom) {
                ctx.fillRect(0,y,canvas.width,1);
            }
        }
    }
}

document.addEventListener("mousewheel", function(e) {
    var x = e.x / grid.zoom,
        y = e.y / grid.zoom;
    if(e.deltaY < 0 && grid.zoom < 200) {
        grid.offset.x -= x * (1 - (x * grid.zoom / (x * (grid.zoom + Math.round(Math.sqrt(grid.zoom)))))),
        grid.offset.y -= y * (1 - (y * grid.zoom / (y * (grid.zoom + Math.round(Math.sqrt(grid.zoom))))));
        grid.zoom += Math.round(Math.sqrt(grid.zoom));
    } else if(e.deltaY > 0 && (grid.zoom > 5 | (grid.color == "none" && grid.zoom > 1))) {
        grid.offset.x -= x * (1 - (x * grid.zoom / (x * (grid.zoom - Math.round(Math.sqrt(grid.zoom)))))),
        grid.offset.y -= y * (1 - (y * grid.zoom / (y * (grid.zoom - Math.round(Math.sqrt(grid.zoom))))));
        grid.zoom -= Math.round(Math.sqrt(grid.zoom));
    }
    grid.update();
});

document.addEventListener("keypress", function(e) {
    if(e.which == 26) {
        terug();
    } else if(e.which == 99) {
        if(confirm("Weet je zeker dat je het hele rooster wil resetten?")) {
            grid.cells = [];
            grid.update();
        }
    }
});

function createCell(e) {
    var x = Math.floor(e.x / grid.zoom - grid.offset.x),
        y = Math.floor(e.y / grid.zoom - grid.offset.y);
    grid.createCell(x,y,grid.cellStates["selected"]);
}

function changeOffset(e) {
    var x = e.x / grid.zoom,
        y = e.y / grid.zoom;
    
    grid.offset.x += x - mouse.x,
    grid.offset.y += y - mouse.y;
    mouse.x = x;
    mouse.y = y;
    grid.update();
}

function removeCell(e) {
    var x = Math.floor(e.x / grid.zoom - grid.offset.x),
        y = Math.floor(e.y / grid.zoom - grid.offset.y);
    grid.removeCell(x,y);
}

canvas.addEventListener("mousedown", function(e) {
    saveState();
    var x = e.x / grid.zoom,
        y = e.y / grid.zoom;
    if(e.which == 1) {
        if(e.shiftKey && grid.cells.length != 0) {
            var prevCell = grid.cells[0];
            if(Math.abs(Math.floor(y - grid.offset.y) - prevCell.y) + 1 > 100 || Math.abs(Math.floor(x - grid.offset.x) - prevCell.x) + 1 > 100) {
                alert("Beetje te groot man..");
            } else {
                for(var y2 = 0; y2 < Math.abs(Math.floor(y - grid.offset.y) - prevCell.y) + 1; y2++) {
                    for(var x2 = 0; x2 < Math.abs(Math.floor(x - grid.offset.x) - prevCell.x) + 1; x2++) {
                        grid.createCell(prevCell.x + x2 * (x - grid.offset.x - prevCell.x < 0 ? -1 : 1),prevCell.y + y2 * (y - grid.offset.y - prevCell.y < 0 ? -1 : 1),grid.cellStates["selected"]);
                    }
                }
            }
        } else {
            grid.createCell(Math.floor(x - grid.offset.x),Math.floor(y - grid.offset.y) ,grid.cellStates["selected"]);
            canvas.addEventListener("mousemove", createCell);
        }
    } else if(e.which == 2) {
        mouse = {
            x: x, 
            y: y
        };
        canvas.addEventListener("mousemove", changeOffset);
    } else {
        grid.removeCell(Math.floor(x - grid.offset.x),Math.floor(y - grid.offset.y));
        canvas.addEventListener("mousemove", removeCell);
    }
});

canvas.addEventListener("mouseup", function(e) {
    canvas.removeEventListener("mousemove", createCell);
    canvas.removeEventListener("mousemove", changeOffset);
    canvas.removeEventListener("mousemove", removeCell);
});

grid.addCellState("default", ["color"], ["#000"]);
grid.addCellState("empty", ["color"], [grid.background]);
grid.update();