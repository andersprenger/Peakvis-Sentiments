let height = 860;
let width = 1200;
let margin = ({top: 0, right: 40, bottom: 34, left: 40});
let format = d3.timeFormat("%H:%M:%S")

var time = 0

function setTime() {
    video = document.getElementById("video")
    if (time < Math.trunc(video.currentTime)) {
        time = Math.trunc(video.currentTime)
        console.log("Tempo mudou", time)
        redrawTime(time);
    }

}

function handleWithVideoAndUpdateTweets(functionHandle, indiceBefore, indiceNow, splitPart, indiceActual) {
    myVar = setInterval(() => {
        video = document.getElementById("video")
        if (time < Math.trunc(video.currentTime)) {
            time = Math.trunc(video.currentTime)
            console.log("Tempo mudou", time)
            if (indiceActual <= splitPart) {
                indiceBefore = Math.trunc(indiceNow / indiceActual)
                indiceNow = Math.trunc(indiceActual * 300)
                indiceActual = indiceActual += 1
                functionHandle(time, indiceActual, indiceBefore, indiceNow, splitPart);
            }
        }
    }, 10000);
}

function call() {
    nextButton(functionHandle, indiceBefore, indiceNow, splitPart, indiceActual)
}

function hiddenElement() {
    document.getElementById("previuos").style.visibility = 'hidden';
    document.getElementById("next").style.visibility = 'hidden';
}

function nextButton(functionHandle, indiceBefore, indiceNow, splitPart, indiceActual, type) {
    if (indiceActual <= splitPart) {
        if (indiceActual <= 0) {
            indiceBefore = 0
            indiceNow = 300
        } else {
            indiceBefore = Math.trunc(indiceNow / indiceActual)
            indiceNow = Math.trunc(indiceActual * 300)
        }
        if (type == "next") {
            indiceActual = indiceActual += 1
        } else {
            indiceActual = indiceActual -= 1
        }
        console.log("Estamos aqui", indiceActual)
        functionHandle(time, indiceActual, indiceBefore, indiceNow, splitPart);
    }
}

function previousButton(functionHandle, indiceBefore, indiceNow, splitPart, indiceActual) {
    if (indiceActual <= splitPart) {
        indiceBefore = Math.trunc(indiceNow / indiceActual)
        indiceNow = Math.trunc(indiceActual * 300)
        indiceActual = indiceActual -= 1
        functionHandle(time, indiceActual, indiceBefore, indiceNow, splitPart);
    }
}


function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}

const setY = (text) => {
    if (text === "positivo") {
        return 60
    } else if (text === "neutro") {
        return 300
    } else {
        return 650
    }
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

var max_retweets = 0
//{country: 'Argentina', total: '2987', population: '38859125', perCapita: '7.687', con
const setRound = (text) => {
    let split_valor = Math.ceil(max_retweets / 5)
    if (text == 0) {
        return 5
    } else if (text <= split_valor && text > 0) {
        return 8
    } else if (text <= (split_valor + split_valor) && text > split_valor) {
        return 11
    } else if (text <= (split_valor + split_valor + split_valor) && text > (split_valor + split_valor)) {
        return 14
    } else {
        return 16
    }
}

// Colors used for circles depending on continent

// Colors used for circles depending on continent
let colors = d3.scaleOrdinal()
    .domain(["positivo", "neutro", "negativo"])
    .range(['#388E3C', '#ffff00', '#E64A19']);

d3.select("#positivoColor").style("color", colors("positivo"));
d3.select("#negativoColor").style("color", colors("negativo"));
d3.select("#neutroColor").style("color", colors("neutro"));


let svg = d3.select("#svganchor")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

let xScale = d3.scaleLinear()
    .range([margin.left, width - margin.right]);

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - margin.bottom) + ")");

// Create line that connects circle and X axis
let xLine = svg.append("line")
    .attr("stroke", "rgb(96,125,139)")
    .attr("stroke-dasharray", "1,2");

// Create tooltip div and make it invisible
let tooltip = d3.select("#svganchor").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
//size and original data
let originalData = []
var totalSize = 0
var indiceBefore = 0
var indiceNow = 300
var splitPart = 0
var indiceActual = 1

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function plot() {
    d3.json("/static/DATA/dados/" + document.formulario.dadossss.value).then(function (data) {
        fetch('/preprocesssentimental?a=' + document.formulario.dadossss.value).then((response) => {
            return response.json();
        })
        //started count
        console.log("Começou o tempo de carregamento")
        alert(`Classificação iniciada com sucesso`)
        // 10 minutos
        //sleep(1000);
        sleep(600000);
        alert(`Classificação terminada com sucesso`)
        console.log("Terminou o tempo de carregamento")
        alert(`Classificação realizada com sucesso, arquivo salvo com o nome  ${document.formulario.dadossss.value}_sentimental.json`)
    })
}

//preprocesssentimental
function plot_sentimental() {
// Load and process data
///static/DATA/dados/${document.formulario.dadosss.value}
    d3.json("/static/DATA/dados/" + document.formulario.dadosss.value).then(function (data) {
        data = data.sort(function (x, y) {
            let segundsy = new Date(y.created_at)
            let segundsx = new Date(x.created_at)
            return segundsx - segundsy;
        })

        //data = data.slice(0,300)


        let dataSet = data;
        originalData = data;
        totalSize = data.length;
        splitPart = Math.ceil(totalSize / 500);
        indiceActual = 1
        indiceNow = 500
        indiceBefore = 0

        if (data.length > 500) {
            alert(`Dataset will be split into, ${splitPart} because have ${data.length} and limit support is 500`)
            redrawTime(time, indiceActual, indiceBefore, indiceNow, splitPart, totalSize);
            // Listen to click on "scale" buttons and trigger redraw when they are clicked
            d3.selectAll(".scale").on("click", function () {
                var type = this.value
                if (indiceActual < splitPart) {
                    if (type == "next") {
                        console.log("Pressionei next")
                        indiceActual = indiceActual += 1
                        console.log(indiceActual)
                        if (indiceActual <= 1) {
                            indiceActual = 0
                            indiceBefore = 0
                            indiceNow = 500
                        } else {
                            let middle = indiceBefore
                            indiceBefore = indiceNow
                            indiceNow = indiceActual * 500
                        }
                    } else {
                        console.log("Pressionei previous")
                        console.log(indiceActual)
                        if (indiceActual <= 1) {
                            indiceActual = 0
                            indiceBefore = 0
                            indiceNow = 500
                        } else {
                            indiceBefore = indiceActual * 500
                            indiceNow = indiceBefore + 500
                        }
                        indiceActual = indiceActual -= 1
                    }

                    redrawTime(time, indiceActual, indiceBefore, indiceNow, splitPart, totalSize);
                } else {
                    indiceActual = splitPart - 1
                }
            });
        } else {
            alert(`Dataset completo`)
            hiddenElement()
            redraw()
        }
        //functionHandle, indiceBefore, indiceNow, splitPart, indiceActual
        //handleWithVideoAndUpdateTweets(redrawTime, indiceBefore, indiceNow, splitPart, indiceActual)
        //for(var i = 0; i < dataSet.length; i ++) {
        //    if(dataSet[i].retweets > max_retweets) {
        //        max_retweets = dataSet[i].retweets
        //   }
        //}
        max_retweets = 50

        // Set chart domain max value to the highest total value in data set
        //xScale.domain(d3.extent(data, function (d) {
        //    return  new Date(d.created_at);
        //}));

        // redraw();

        // Trigger filter function whenever checkbox is ticked/unticked
        d3.selectAll("input").on("change", filter);

        function redraw() {
            svg.selectAll('.countries').remove();

            xScale = d3.scaleLinear().range([margin.left, width - margin.right])
            xScale.domain(d3.extent(dataSet, function (d) {
                return new Date(d.created_at);
            }));

            let xAxis;
            const format = d3.timeFormat("%H:%M:%S")
            xAxis = d3.axisBottom(xScale)
                .ticks(5)
                // .tickValues(eixo_x[0])
                .tickFormat(d3.timeFormat("%H:%M:%S"))
            //funciona mais ou menos
            //.tickFormat((d,i) => eixo_x[i])
            //forEach(item =>return item);
            // .ticks(3, ".1f")
            //.tickValues([1,2,3])
            //.tickSizeOuter(0);

            d3.transition(svg).select(".x.axis")
                .transition()
                .duration(1000)
                .call(xAxis);

            // Create simulation with specified dataset
            let simulation = d3.forceSimulation(dataSet)
                // Apply positioning force to push nodes towards desired position along X axis
                .force("x", d3.forceX(function (d) {
                    // Mapping of values from total/perCapita column of dataset to range of SVG chart (<margin.left, margin.right>)
                    return xScale(new Date(d.created_at).getTime());  // This is the desired position
                }).strength(2))  // Increase velocity
                .force("y", d3.forceY(function (d) {
                    // Mapping of values from total/perCapita column of dataset to range of SVG chart (<margin.left, margin.right>)
                    return setY(d.emotion);  // This is the desired position
                }))  // // Apply positioning force to push nodes towards center along Y axis
                .force("collide", d3.forceCollide(function (d) {
                    // Mapping of values from total/perCapita column of dataset to range of SVG chart (<margin.left, margin.right>)
                    return setRound(d.retweets) // This is the desired position
                })) // Apply collision force with radius of 9 - keeps nodes centers 9 pixels apart
                .stop();  // Stop simulation from starting automatically

            // Manually run simulation
            for (let i = 0; i < dataSet.length; ++i) {
                simulation.tick(5);
            }

            // Create country circles
            let countriesCircles = svg.selectAll(".countries")
                .data(dataSet, function (d) {
                    return d.country
                });

            countriesCircles.exit()
                .attr("cx", 0)
                .attr("cy", 0)
                .remove();

            countriesCircles.enter()
                .append("circle")
                .attr("class", "countries")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", function (d) {
                    return setRound(d.retweets)
                })
                .attr("fill", function (d) {
                    return colors(d.emotion)
                })
                .merge(countriesCircles)
                .transition()
                .duration(2000)
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                });

            // Show tooltip when hovering over circle (data for respective country)
            d3.selectAll(".countries").on("mousemove", function (d) {
                tooltip.html(`Tweet: <strong>${d.text}</strong><br>
                          <span>Time:${d.created_at}</span><br>
                          <span>Retweets:${d.retweets}</span>
                          `)
                    .style('top', d3.event.pageY - 12 + 'px')
                    .style('left', d3.event.pageX + 25 + 'px')
                    .style("opacity", 0.9);

                xLine.attr("x1", d3.select(this).attr("cx"))
                    .attr("y1", d3.select(this).attr("cy"))
                    .attr("y2", (height - margin.bottom))
                    .attr("x2", d3.select(this).attr("cx"))
                    .attr("opacity", 1);

            }).on("mouseout", function (_) {
                tooltip.style("opacity", 0);
                xLine.attr("opacity", 0);
            });

        }

        function redrawTime(time, indiceActual, indiceBefore, indiceNow, splitPart, totalSize) {
            svg.selectAll('.countries').remove();
            if (indiceNow >= totalSize) {
                dataSet = originalData.slice(indiceBefore, totalSize)
                data = originalData.slice(indiceBefore, totalSize)
            } else {
                dataSet = originalData.slice(indiceBefore, indiceNow)
                data = originalData.slice(indiceBefore, indiceNow)
            }

            xScale = d3.scaleLinear().range([margin.left, width - margin.right])
            xScale.domain(d3.extent(dataSet, function (d) {
                return new Date(d.created_at);
            }));

            let xAxis;
            const format = d3.timeFormat("%H:%M:%S")
            xAxis = d3.axisBottom(xScale)
                .ticks(5)
                // .tickValues(eixo_x[0])
                .tickFormat(d3.timeFormat("%H:%M:%S"))
            //funciona mais ou menos
            //.tickFormat((d,i) => eixo_x[i])
            //forEach(item =>return item);
            // .ticks(3, ".1f")
            //.tickValues([1,2,3])
            //.tickSizeOuter(0);

            d3.transition(svg).select(".x.axis")
                .transition()
                .duration(1000)
                .call(xAxis);

// Create simulation with specified dataset
            let simulation = d3.forceSimulation(dataSet)
                // Apply positioning force to push nodes towards desired position along X axis
                .force("x", d3.forceX(function (d) {
                    // Mapping of values from total/perCapita column of dataset to range of SVG chart (<margin.left, margin.right>)
                    return xScale(new Date(d.created_at).getTime());  // This is the desired position
                }).strength(2))  // Increase velocity
                .force("y", d3.forceY(function (d) {
                    // Mapping of values from total/perCapita column of dataset to range of SVG chart (<margin.left, margin.right>)
                    return setY(d.emotion);  // This is the desired position
                }))  // // Apply positioning force to push nodes towards center along Y axis
                .force("collide", d3.forceCollide(function (d) {
                    // Mapping of values from total/perCapita column of dataset to range of SVG chart (<margin.left, margin.right>)
                    return setRound(d.retweets) // This is the desired position
                })) // Apply collision force with radius of 9 - keeps nodes centers 9 pixels apart
                .stop();  // Stop simulation from starting automatically

// Manually run simulation
            for (let i = 0; i < dataSet.length; ++i) {
                simulation.tick(5);
            }

// Create country circles
            let countriesCircles = svg.selectAll(".countries")
                .data(dataSet, function (d) {
                    return d.country
                });

            countriesCircles.exit()
                .attr("cx", 0)
                .attr("cy", 0)
                .remove();

            countriesCircles.enter()
                .append("circle")
                .attr("class", "countries")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", function (d) {
                    return setRound(d.retweets)
                })
                .attr("fill", function (d) {
                    return colors(d.emotion)
                })
                .merge(countriesCircles)
                .transition()
                .duration(2000)
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                });

// Show tooltip when hovering over circle (data for respective country)
            d3.selectAll(".countries").on("mousemove", function (d) {
                tooltip.html(`Tweet: <strong>${d.text}</strong><br>
                  <span>Time:${d.created_at}</span><br>
                  <span>Retweets:${d.retweets}</span>
                  `)
                    .style('top', d3.event.pageY - 12 + 'px')
                    .style('left', d3.event.pageX + 25 + 'px')
                    .style("opacity", 0.9);

                xLine.attr("x1", d3.select(this).attr("cx"))
                    .attr("y1", d3.select(this).attr("cy"))
                    .attr("y2", (height - margin.bottom))
                    .attr("x2", d3.select(this).attr("cx"))
                    .attr("opacity", 1);

            }).on("mouseout", function (_) {
                tooltip.style("opacity", 0);
                xLine.attr("opacity", 0);
            });

        }

        // Filter data based on which checkboxes are ticked
        function filter() {
            //d3.select("svg").remove();
            //svg.selectAll("*").remove();
            //svg.selectAll('*').remove();
            function getText() {
                let text = document.getElementById("fname").value;
                return text.length > 0 ? text : null;
            }

            function getNumberRetweets() {
                let number = document.getElementById("fnumber").value;
                return Number(number) ? Number(number) : null;
            }

            function getCheckedBoxes(checkboxName) {

                let checkboxes = d3.selectAll(checkboxName).nodes();
                let checkboxesChecked = [];
                for (let i = 0; i < checkboxes.length; i++) {
                    if (checkboxes[i].checked) {
                        checkboxesChecked.push(checkboxes[i].defaultValue);
                    }
                }
                console.log("Quantidade checks", checkboxesChecked.length)
                return checkboxesChecked.length > 0 ? checkboxesChecked : null;
            }

            let checkedBoxes = getCheckedBoxes(".continent");

            let text = getText()

            let number = getNumberRetweets()
            console.log("Numero dos reetweets", number)


            if (checkedBoxes == null && text == null && number == null) {
                let newData = [];
                dataSet = newData;
                redraw();
                return;
            }

            if (checkedBoxes !== null && text !== null && number === null) {
                let newData = [];
                for (let i = 0; i < checkedBoxes.length; i++) {
                    let newArray = data.filter(function (d) {
                        return d.emotion === checkedBoxes[i];
                    });
                    let newArrayText = newArray.filter(function (d) {
                        return d.text.toLowerCase().includes(text.toLowerCase());
                    });
                    Array.prototype.push.apply(newData, newArrayText);
                }
                dataSet = newData;
                redraw();
                return
            }

            if (checkedBoxes !== null && text !== null && number !== null) {
                let newData = [];

                for (let i = 0; i < checkedBoxes.length; i++) {
                    let newArray = data.filter(function (d) {
                        return d.emotion === checkedBoxes[i];
                    });
                    let newArrayText = newArray.filter(function (d) {
                        return d.text.toLowerCase().includes(text.toLowerCase());
                    });
                    let newArrayNumber = newArrayText.filter(function (d) {
                        return d.retweets >= number;
                    });
                    Array.prototype.push.apply(newData, newArrayNumber);
                }
                dataSet = newData;
                redraw();
                return
            }


            if (checkedBoxes !== null && text === null && number === null) {
                let newData = [];
                for (let i = 0; i < checkedBoxes.length; i++) {
                    let newArray = data.filter(function (d) {
                        return d.emotion === checkedBoxes[i];
                    });
                    Array.prototype.push.apply(newData, newArray);
                }
                dataSet = newData;
                redraw();
                return
            }

            if (checkedBoxes !== null && text === null && number !== null) {
                let newData = [];
                for (let i = 0; i < checkedBoxes.length; i++) {
                    let newArray = data.filter(function (d) {
                        return d.emotion === checkedBoxes[i];
                    });
                    let newArrayText = newArray.filter(function (d) {
                        return d.retweets >= number;
                    });
                    Array.prototype.push.apply(newData, newArrayText);
                }
                dataSet = newData;
                redraw();
                return
            }


            if (number !== null && checkedBoxes === null && text === null) {
                newData = [];
                let newArray = data.filter(function (d) {
                    return d.retweets >= number;
                });
                Array.prototype.push.apply(newData, newArray);

                dataSet = newData;
                redraw();

            }
        }

    }).catch(function (error) {
        if (error) throw error;
    });
}
