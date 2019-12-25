const pixelWidth = 10,
    pixelsX = 100,
    pixelsY = 50,
    chartHeight = 150;

const margin = {top: 10, right: 0, bottom: 10, left: 35}

let timeStep = 64,
    minTimeStep = 4,
    maxTimeStep = 512;

let cells = [],
    cellCounts = [],
    nIterations = 0;

function initializeCells(p) {
    nIterations = 0;
    cells = [];
    for (let x = 0; x < pixelsX; x++) {
        let row = [];
        for (let y = 0; y < pixelsY; y++) {
            row.push(Math.random() < p);
        }
        cells.push(row)
    }    
}

function getNumberOfLiveCells(x, y) {
    let n = 0;
    if (isAlive(x-1,y-1)) {n++}
    if (isAlive(x,y-1)) {n++}
    if (isAlive(x+1,y-1)) {n++}

    if (isAlive(x-1,y)) {n++}
    if (isAlive(x+1,y)) {n++}

    if (isAlive(x-1,y+1)) {n++}
    if (isAlive(x,y+1)) {n++}
    if (isAlive(x+1,y+1)) {n++}
    return n;
}

function isAlive(x, y) {
    try {
        if (x < 0) x = pixelsX + x;
        if (y < 0) y = pixelsY + y;
        x = x % pixelsX;
        y = y % pixelsY;
        value = cells[x][y];    
    }
    catch(error) {
        console.log(`x: ${x}, y: ${y}`)
    }
    return cells[x][y];
}

function evolve(cells) {
    let newCells = [];
    for (let x = 0; x < pixelsX; x++) {
        let row = [];
        for (let y = 0; y < pixelsY; y++) {
            // Conway's life rules
            if (cells[x][y]) {
                // cell is currently alive
                n = getNumberOfLiveCells(x, y);
                if (n == 2 || n == 3) {
                    row.push(true);
                } else {
                    row.push(false);
                }
            } else {
                // cell is currently dead
                n = getNumberOfLiveCells(x, y);
                if (n == 3) {
                    row.push(true);
                } else {
                    row.push(false);
                }
            }
        }
        newCells.push(row)
    }        
    return newCells;
}

function sparseData(matrix) {
    sparseMatrix = matrix.map((d, x) => d.map((dd, y) => { return {x:x, y:y, alive:dd}; }))
    merged = [].concat.apply([], sparseMatrix).filter(d => d.alive);
    return merged;
}

coordToIndex = d => pixelsX * d.y + d.x;
indexToCoord = i => { return {x:i % pixelsX, y:Math.floor(i/pixelsX)}; }

let lifeSvg = d3.select("#lifeSvg")
let chartSvg = d3.select("#chartSvg").attr("width", pixelWidth * pixelsX).attr("height", chartHeight)
    .append("g")
    .attr("width", pixelWidth * pixelsX - margin.left - margin.right)
    .attr("height", chartHeight - margin.top - margin.bottom)
    .attr("transform", `translate(${margin.left},${margin.top})`);
let chart = chartSvg.append("g")

lifeSvg
    .attr("width", pixelWidth * pixelsX)
    .attr("height", pixelWidth * pixelsY)

chartSvg
    .attr("width", pixelWidth * pixelsX)
    .attr("height", chartHeight)

bg = lifeSvg.append("g")
fg = lifeSvg.append("g")

function initializePixels() {
    d3.range(pixelsX).forEach(x => d3.range(pixelsY).forEach(y => 
        bg.append("rect")
            .attr("x", pixelWidth*x + 1)
            .attr("y", pixelWidth*y + 1)
            .attr("width", pixelWidth - 2)
            .attr("height", pixelWidth - 2)
            .attr("class", "pixel")
        )
    )
}

function drawScreen(sparseCells) {
    // draw live cells
    let liveCells = fg.selectAll(".cell").data(sparseCells, d => coordToIndex(d))
    
    liveCells.enter().append("rect")
    .attr("class","cell")
    .attr("x", d => pixelWidth*d.x + 1)
    .attr("y", d => pixelWidth*d.y + 1)
        .attr("width", pixelWidth - 2)
        .attr("height", pixelWidth - 2)
    // .attr("width", 0)
    // .attr("height", 0)
    // .attr("transform", `translate(${pixelWidth/2},${pixelWidth/2})`)
    .merge(fg)
    // .transition()
        // .duration(timeStep*.25)
        // .attr("width", pixelWidth - 2)
        // .attr("height", pixelWidth - 2)
        // .attr("transform", `translate(0,0)`)

    liveCells.exit()
    // .transition()
    // .duration(timeStep*.25)
    // .attr("width", 0)
    // .attr("height", 0)
    // .attr("transform", `translate(${pixelWidth/2},${pixelWidth/2})`)
    .remove()

    var xScale = d3.scaleLinear().domain([0,1000]).range([0,pixelsX * pixelWidth - margin.left - margin.right]);
    var yScale = d3.scaleLinear().domain([0, pixelsX*pixelsY]).range([chartHeight - margin.top - margin.bottom, 0])
    var line = d3.line()
        .x((d, i) => xScale(i))
        .y(d => yScale(d))

    var yAxis = chartSvg.selectAll(".yAxis").data([0]).enter().append("g").attr("class", "yAxis")
    yAxis.call(d3.axisLeft(yScale))

    var gridlines = chart.selectAll('.grid').data([0]).enter().append("g").attr("class", "grid")
    gridlines.call(d3.axisLeft(yScale)
        .tickSize(-(pixelsX * pixelWidth - margin.left - margin.right))
        .tickFormat("")
        )

    var lineChart = chart.selectAll(".line").data([cellCounts])

    lineChart.enter()
        .append("path")
        .attr("class", "line")

    lineChart.attr("d", line);

    d3.select("#iterations").text(`${nIterations} iterations`)
    d3.select("#count").text(`${sparseCells.length} cells alive`)

}

d3.select("body").on("keydown", function(d) {
    if (['1','2','3','4','5','6','7','8','9'].includes(d3.event.key) && !pause) {
        if (d3.event.key == '1') {
            initializeCells(0.05);
        } else {
            initializeCells((+d3.event.key-1)/10);
        }
    }

    if (d3.event.key == "ArrowLeft" && timeStep < maxTimeStep) {
        timeStep = timeStep * 2;
    }

    if (d3.event.key == "ArrowRight" && timeStep > minTimeStep) {
        timeStep = timeStep * .5;
    }



    if (d3.event.key == "Escape" || d3.event.key.toLowerCase() == "p") {
        pause = !pause; 
        if (!pause) { play(); } 
    }
})

function play() {
    nIterations++;
    let sparseCells = sparseData(cells);
    cellCounts.push(sparseCells.length);
    if (cellCounts.length > 1000) {
        cellCounts = cellCounts.slice(1);
    }
    drawScreen(sparseCells);
    cells = evolve(cells);
    if (!pause) { setTimeout(play, timeStep); }
}


let pause = false;
initializeCells(0.4);
initializePixels();

play();

