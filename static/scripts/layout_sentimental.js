function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function pagGithub() {
    window.location.assign("https://github.com/DAVINTLAB");
}

function pagSentimental() {
    window.location.assign("/tweet-analytics");
}

function plotVideo() {
    sessionStorage.nomeVideo = document.formulario.videoo.value;
    console.log(sessionStorage.nomeVideo)
    $("#video_container").load("static/loadVideo.html");
    document.getElementById("plot_tweets").className = "plot_tweets"
}

//function plot_test_sentimental() {
//    d3.json("/static/DATA/dados/" + document.formulario.dadoss.value).then(function (data) {
//        fetch('/preprocesssentimental?a='+document.formulario.dadoss.value).then((response) => {
//          return response.json();
//       });
//   }
// }

function plot() {
    d3.json("/static/DATA/dados/" + document.formulario.dadoss.value).then(function (data) {
        fetch('/preprocess?a=' + document.formulario.dadoss.value).then((response) => {
            return response.json();
        })
        //started count
        console.log("Começou o tempo de carregamento")
        alert(`Processing started successfully, please wait`)
        // 10 minutos
        sleep(1000);
        // {
        //     #sleep(600000);
        // #
        // }
        alert(`Ready`)
        console.log("Terminou o tempo de carregamento")
        //criação dos eixos X e Y
        horariosData = data;
        var horarios = [];
        var ex = [];
        var ey = [];
        let tweets = [];
        let wordClouds = [];
        let infos = [];
        var count = 0;

        //d3.text("static/DATA/testeWC.txt").then(function(text) {
        d3.text("static/storage/" + document.formulario.dadoss.value.split('.')[0] + "_WC.txt").then(function (text) {
            let aux = text.split("\n");

            for (let k = 0; k < aux.length; k++) {
                wordClouds.push(aux[k].split(","));
                for (let m = 1; m < 20; m += 2) {
                    wordClouds[k][m] = Number.parseInt(wordClouds[k][m]);
                }
            }
            console.log(wordClouds.length);
        });

        for (var i = horariosData.length - 1; i >= 0; i--) {
            horarios.push(new Date(horariosData[i].created_at));
        }

        var started_time = new Date(JSON.parse(JSON.stringify(horarios[0])));
        started_time.setSeconds(started_time.getSeconds() + 1);
        for (var i = 0; i < horarios.length; i++) {
            if (horarios[i] >= started_time) {
                ey.push(count);
                started_time = new Date(JSON.parse(JSON.stringify(horarios[i])));
                ex.push(started_time);
                tweets.push(horariosData[horarios.length - i - 1].text + "         [" + horariosData[horarios.length - i - 1].created_at + "]");
                infos.push("https://twitter.com/" + horariosData[horarios.length - i - 1].username + "/status/" + horariosData[horarios.length - i - 1].id)
                started_time.setSeconds(started_time.getSeconds() + 1);
                //contadorWD = contadorWD + 1;
                count = 1;
            } else {
                count = count + 1;
            }
        }

        //console.log(words);

        let testeA = [];
        let testeB = [];
        let count2 = 0;

        let testeC = new Date(JSON.parse(JSON.stringify(horarios[0])));
        testeC.setSeconds(testeC.getSeconds() + 30);
        for (let i = 0; i < horarios.length; i++) {
            if (horarios[i] >= testeC) {
                testeB.push(count2);
                count2 = 1;
                testeC = new Date(JSON.parse(JSON.stringify(horarios[i])));
                testeA.push(testeC);
                testeC.setSeconds(testeC.getSeconds() + 30);
            } else {
                count2 = count2 + 1;
            }
        }
        //plot do grafico
        let plotDiv = document.getElementById("plotly_div_id");
        //===================== Arrumar depois =======================
        console.log(ey.length);
        console.log(testeB.length);
        let valor_proporcional30_regulado = 0;
        if (testeB.length * 30 != ey.length) {
            //o valor proporcional eh a diferenca?
            valor_proporcional30_regulado = testeB.length * 30 - ey.length;
            console.log("valor " + valor_proporcional30_regulado);
        }

        let respX = [0];
        let respY = [];
        for (let i = 1; i < testeB.length; i++) {
            respX[i] = i;
            if (testeB[i] > testeB[i - 1]) {
                respY[i] = 1;
            } else {
                respY[i] = 0;
            }
        }

        let sorti = JSON.parse(JSON.stringify(testeB)).sort((a, b) => a - b);
        let reskein = math.quantileSeq(sorti, document.getElementById("slaider").value / 10)
        let marcadores = [];
        let arrResp = [];
        for (let i = 1; i < respY.length; i++) {
            if ((respY[i] == 1 && respY[i - 1] == 0) || (respY[i] == 0 && respY[i - 1] == 1 && marcadores.length % 2 != 0)) {
                marcadores.push(i - 1);
            }
        }
        marcadores.push(0);
        for (let i = 0; i < marcadores.length - 1; i++) {
            if (testeB[marcadores[i + 1]] - testeB[marcadores[i]] > reskein) {
                arrResp.push(marcadores[i] * 30 - valor_proporcional30_regulado);
            }
        }
        document.getElementById("slaider").oninput = function () {
            arrResp = [];
            let reskein = math.quantileSeq(sorti, document.getElementById("slaider").value / 10)
            for (let i = 0; i < marcadores.length - 1; i++) {
                if (testeB[marcadores[i + 1]] - testeB[marcadores[i]] > reskein) {
                    arrResp.push(marcadores[i] * 30 - valor_proporcional30_regulado);
                }
            }
            respX = [];
            respY = [];
            for (let i = 0; i < arrResp.length; i++) {
                respX[i] = ex[arrResp[i]];
                respY[i] = ey[arrResp[i]];
            }

            g3 = {
                x: respX, y: respY, name: 'Início dos Picos', mode: 'markers', marker: {
                    size: 10, color: '#7200dc'
                }
            }
            var data = [g1, g2, g3];
            indice = arrResp.length;
            Plotly.newPlot(plotDiv, data);
        };
        //============================================================
        let cnt = 0;
        let indice = arrResp.length;
        let taPausado = true;
        let media = 0;
        let eixox = [];
        let eixoy = [];

        let g1 = {
            x: ex, y: ey, mode: 'lines', name: 'Tweets', line: {color: '#999aa7'}
        }

        let g2 = {
            x: [ex[0]], y: [ey[0]], mode: 'lines', name: 'Progress', line: {color: '#0bb6e0'}
        }

        respX = [];
        respY = [];
        for (let i = 0; i < arrResp.length; i++) {
            respX[i] = ex[arrResp[i]];
            respY[i] = ey[arrResp[i]];
        }

        let g3 = {
            x: respX, y: respY, name: 'Peak Start', mode: 'markers', marker: {
                size: 10, color: '#7200dc'
            }
        }

        var data = [g1, g2, g3];

        Plotly.newPlot(plotDiv, data);
        plotVideo();

        var interval = setInterval(function () {

            if (!taPausado) {
                var time = ex[cnt];

                eixox.push(time);
                eixoy.push(ey[cnt]);

                //*****coisas usadas para gerar as wordClouds*****
                if (cnt % 15 == 0) {

                    let listaPlot = [];
                    let fatorDivisao = wordClouds[Math.round(cnt / 15)][wordClouds[Math.round(cnt / 15)].length - 1];

                    for (let k = 0; k < wordClouds[Math.round(cnt / 15)].length; k += 2) {
                        listaPlot.push([wordClouds[Math.round(cnt / 15)][k], wordClouds[Math.round(cnt / 15)][k + 1] / (fatorDivisao) / (20 / 100)]);
                    }
                    contadorWD = 0;
                    let options = {
                        list: listaPlot,
                        gridSize: 18,
                        weightFactor: 3,
                        fontFamily: 'Montserrat, cursive, sans-serif',
                        color: function (word, weight) {
                            return (Math.floor(Math.random() * weight) % 2 == 0) ? '#7200dc' : '#0bb6e0';
                        },
                        hover: window.drawBox,
                        backgroundColor: '#ffffff'
                    };
                    WordCloud(document.getElementById('wordCloudTeste'), options);
                }
                //*****final das coisas usadas para gerar as wordClouds*****

                media = cnt - Math.round(document.getElementById("video").currentTime);

                if (media == 1 || media == 0) {
                    var olderTime = time.setSeconds(time.getSeconds() - 1);
                    var futureTime = time.setSeconds(time.getSeconds() + 1);
                } else {
                    cnt = Math.round(document.getElementById("video").currentTime) + 1;

                    var olderTime = time.setSeconds(time.getSeconds() - (media * -1));
                    var futureTime = time.setSeconds(time.getSeconds() + (media * -1));

                    //====== Hotfix para a wordcloud ====== //
                    let listaPlot = [];
                    let fatorDivisao = wordClouds[Math.round(cnt / 15)][wordClouds[Math.round(cnt / 15)].length - 1];

                    for (let k = 0; k < wordClouds[Math.round(cnt / 15)].length; k += 2) {
                        listaPlot.push([wordClouds[Math.round(cnt / 15)][k], wordClouds[Math.round(cnt / 15)][k + 1] / (fatorDivisao) / (20 / 100)]);
                    }
                    contadorWD = 0;
                    let options = {
                        list: listaPlot,
                        gridSize: 18,
                        weightFactor: 3,
                        fontFamily: 'Montserrat, cursive, sans-serif',
                        color: function (word, weight) {
                            return (Math.floor(Math.random() * weight) % 2 == 0) ? '#7200dc' : '#0bb6e0';
                        },
                        hover: window.drawBox,
                        backgroundColor: '#ffffff'
                    };
                    WordCloud(document.getElementById('wordCloudTeste'), options);

                    //====== ========================== ====== //

                    //====== Hotfix para o grafico azul ====== //
                    let newX = [];
                    let newY = [];
                    for (let i = 0; i <= cnt; i++) {
                        newX.push(ex[i]);
                        newY.push(ey[i]);
                    }
                    g2 = {
                        //x: [ex[cnt]],
                        //y: [ey[cnt]],
                        x: newX, y: newY, mode: 'lines', name: 'Progresso', line: {color: '#0bb6e0'}
                    }

                    Plotly.newPlot(plotDiv, [g1, g2, g3]);
                }

                //38103981029318930120
                document.getElementById("plot_tweets").innerHTML += "<p class='write'>" + tweets[cnt] + "</p>" + "<a class='write' href=" + infos[cnt] + ">LINK</a>";
                document.getElementById("plot_tweets").scrollTop = document.getElementById("plot_tweets").scrollHeight;
                //93280192831093810239
                var minuteView = {
                    xaxis: {
                        type: 'date', range: [olderTime, futureTime]
                    }
                };

                var update = {
                    x: [[], [ex[cnt]]], y: [[], [ey[cnt]]]
                }

                Plotly.relayout(plotDiv, minuteView);
                Plotly.extendTraces(plotDiv, update, [0, 1])
                cnt = cnt + 1;

                //serve para fazer o autoscale automaticamente (porque se nao fica ilegivel)
                document.querySelector('[data-title="Autoscale"]').click()
            }

            document.getElementById("video").onpause = function () {
                taPausado = true;
            }

            document.getElementById("video").onplay = function () {
                taPausado = false;
            }

            document.getElementById("wtfbro").onclick = function () {
                document.getElementById("video").currentTime = arrResp[indice % arrResp.length] - 1;
                indice++;
            }

        }, 1000);

        plot_sentimental("static/storage/" + document.formulario.dadoss.value.split('.')[0] + "_sentimental.json")

    })


    var width = 600;
    var height = 500;
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    //document.formulario.dadoss.value
    //d3.json("static/bbb-grafo-semantico.json").then(function (graph) {
    d3.json("static/storage/" + document.formulario.dadoss.value.split('.')[0] + "_graph.json").then(function (graph) {
        var label = {
            'nodes': [], 'links': []
        };
        graph.nodes.forEach(function (d, i) {
            label.nodes.push({node: d});
            label.nodes.push({node: d});
            label.links.push({
                source: i * 2, target: i * 2 + 1
            });
        });
        var labelLayout = d3.forceSimulation(label.nodes)
            .force("charge", d3.forceManyBody().strength(-50))
            .force("link", d3.forceLink(label.links).distance(0).strength(2));
        var graphLayout = d3.forceSimulation(graph.nodes)
            .force("charge", d3.forceManyBody().strength(-3000))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX(width / 2).strength(1))
            .force("y", d3.forceY(height / 2).strength(1))
            .force("link", d3.forceLink(graph.links).id(function (d) {
                return d.id;
            }).distance(50).strength(1))
            .on("tick", ticked);
        var adjlist = [];
        graph.links.forEach(function (d) {
            adjlist[d.source.index + "-" + d.target.index] = true;
            adjlist[d.target.index + "-" + d.source.index] = true;
        });

        function neigh(a, b) {
            return a == b || adjlist[a + "-" + b];
        }

        var svg = d3.select("#viz").attr("width", width).attr("height", height);
        var container = svg.append("g");
        svg.call(d3.zoom()
            .scaleExtent([.1, 4])
            .on("zoom", function () {
                container.attr("transform", d3.event.transform);
            }));
        var link = container.append("g").attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter()
            .append("line")
            .attr("stroke", "#aaa")
            .attr("stroke-width", "1px");
        var node = container.append("g").attr("class", "nodes")
            .selectAll("g")
            .data(graph.nodes)
            .enter()
            .append("circle")
            .attr("r", 5)
            .attr("fill", function (d) {
                return color(d.group);
            })
        node.on("mouseover", focus).on("mouseout", unfocus);
        node.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
        var labelNode = container.append("g").attr("class", "labelNodes")
            .selectAll("text")
            .data(label.nodes)
            .enter()
            .append("text")
            .text(function (d, i) {
                return i % 2 == 0 ? "" : d.node.id;
            })
            .style("fill", "#555")
            .style("font-family", "Arial")
            .style("font-size", 14)
            .style("pointer-events", "none"); // to prevent mouseover/drag capture
        node.on("mouseover", focus).on("mouseout", unfocus);

        function ticked() {
            node.call(updateNode);
            link.call(updateLink);
            labelLayout.alphaTarget(0.3).restart();
            labelNode.each(function (d, i) {
                if (i % 2 == 0) {
                    d.x = d.node.x;
                    d.y = d.node.y;
                } else {
                    var b = this.getBBox();
                    var diffX = d.x - d.node.x;
                    var diffY = d.y - d.node.y;
                    var dist = Math.sqrt(diffX * diffX + diffY * diffY);
                    var shiftX = b.width * (diffX - dist) / (dist * 2);
                    shiftX = Math.max(-b.width, Math.min(0, shiftX));
                    var shiftY = 16;
                    this.setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
                }
            });
            labelNode.call(updateNode);
        }

        function fixna(x) {
            if (isFinite(x)) return x;
            return 0;
        }

        function focus(d) {
            var index = d3.select(d3.event.target).datum().index;
            node.style("opacity", function (o) {
                return neigh(index, o.index) ? 1 : 0.1;
            });
            labelNode.attr("display", function (o) {
                return neigh(index, o.node.index) ? "block" : "none";
            });
            link.style("opacity", function (o) {
                return o.source.index == index || o.target.index == index ? 1 : 0.1;
            });
        }

        function unfocus() {
            labelNode.attr("display", "block");
            node.style("opacity", 1);
            link.style("opacity", 1);
        }

        function updateLink(link) {
            link.attr("x1", function (d) {
                return fixna(d.source.x);
            })
                .attr("y1", function (d) {
                    return fixna(d.source.y);
                })
                .attr("x2", function (d) {
                    return fixna(d.target.x);
                })
                .attr("y2", function (d) {
                    return fixna(d.target.y);
                });
        }

        function updateNode(node) {
            node.attr("transform", function (d) {
                return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
            });
        }

        function dragstarted(d) {
            d3.event.sourceEvent.stopPropagation();
            if (!d3.event.active) graphLayout.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d) {
            if (!d3.event.active) graphLayout.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    });

}

let height = 860;
let width = 1200;
let margin = ({top: 0, right: 40, bottom: 34, left: 40});
let format = d3.timeFormat("%H:%M:%S")

var time = 0

function setTime() {
    video = document.getElementById("video")
    if (time < Math.trunc(video.currentTime)) {
        time = Math.trunc(video.currentTime)
        redrawTime(time);
    }

}

function handleWithVideoAndUpdateTweets(functionHandle, indiceBefore, indiceNow, splitPart, indiceActual, list) {
    myVar = setInterval(() => {
        var video = document.getElementById("video")
        if (video) {
            var currentTime = Math.ceil(video.currentTime)
            console.log("tempo corrente", currentTime)
            var valor;
            for (var i = 0; i < list.length; i++) {
                var valor1 = list[i]
                if (currentTime == valor1.time) {
                    valor = valor1
                }
            }

            if (valor && currentTime > 0) {
                indiceActual = valor.indexTime
                console.log("Valor do indice Atual", indiceActual, "Valor do split", splitPart)
                if (indiceActual < splitPart) {
                    if (indiceActual <= 1) {
                        indiceActual = 0
                        indiceBefore = 0
                        indiceNow = 400
                    } else {
                        let middle = indiceBefore
                        indiceBefore = indiceNow
                        indiceNow = indiceActual * 400
                    }

                    if (indiceActual <= 1) {
                        indiceActual = 0
                        indiceBefore = 0
                        indiceNow = 400
                    } else {
                        indiceBefore = indiceActual * 400
                        indiceNow = indiceBefore + 400
                    }

                    functionHandle(time, indiceActual, indiceBefore, indiceNow, splitPart, totalSize);
                }
            }
        }
    }, 1000);
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
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

var max_retweets = 0
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
var listTime = []

function plot_sentimental(path) {
    d3.json(path).then(function (data) {
        data = data.sort(function (x, y) {
            let segundsy = new Date(y.created_at)
            let segundsx = new Date(x.created_at)
            return segundsx - segundsy;
        })
        let dataSet = data;
        originalData = data;
        totalSize = data.length;
        splitPart = totalSize / 400;
        indiceActual = 1
        indiceNow = 400
        indiceBefore = 0

        var obj = {time: 0, indexTime: 0}
        listTime.push(obj)

        var arredondadoTime = Math.ceil(document.getElementById("video").duration)
        var areredondadoSplitPart = Math.ceil(splitPart)
        var splitSeconds = Math.ceil(arredondadoTime / areredondadoSplitPart)
        var index = 1
        var indexPart = 1

        for (var i = 1; i < arredondadoTime; i++) {
            if (indexPart < areredondadoSplitPart) {
                if (index == splitSeconds) {
                    index = 1
                    var obj = {time: i, indexTime: indexPart}
                    listTime.push(obj)
                    indexPart = indexPart + 1
                }
            }

            index = index + 1

        }

        handleWithVideoAndUpdateTweets(redrawTime, indiceBefore, indiceNow, areredondadoSplitPart, indiceActual, listTime)

        redrawTime(time, indiceActual, indiceBefore, indiceNow, splitPart, totalSize);
        // Listen to click on "scale" buttons and trigger redraw when they are clicked
        d3.selectAll(".scale").on("click", function () {
            var type = this.value
            if (indiceActual < splitPart) {
                if (type == "next") {
                    indiceActual = indiceActual += 1
                    if (indiceActual <= 1) {
                        indiceActual = 0
                        indiceBefore = 0
                        indiceNow = 400
                    } else {
                        let middle = indiceBefore
                        indiceBefore = indiceNow
                        indiceNow = indiceActual * 400
                    }
                } else {
                    if (indiceActual <= 1) {
                        indiceActual = 0
                        indiceBefore = 0
                        indiceNow = 400
                    } else {
                        indiceBefore = indiceActual * 400
                        indiceNow = indiceBefore + 400
                    }
                    indiceActual = indiceActual -= 1
                }

                redrawTime(time, indiceActual, indiceBefore, indiceNow, splitPart, totalSize);
            } else {
                indiceActual = splitPart - 1
            }
        });

        max_retweets = 100

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
                .transition()
                .duration(1000)
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
                console.log("Cheguei aqui no else")
                dataSet = originalData.slice(indiceBefore, totalSize)
                data = originalData.slice(indiceBefore, totalSize)
            } else {
                console.log("Cheguei aqui no else")
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

// Create sentimental circles
            let countriesCircles = svg.selectAll(".countries")
                .data(dataSet, function (d) {
                    return d.country
                });

            countriesCircles.exit()
                .transition()
                .duration(1000)
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
                return checkboxesChecked.length > 0 ? checkboxesChecked : null;
            }

            let checkedBoxes = getCheckedBoxes(".continent");

            let text = getText()

            let number = getNumberRetweets()


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