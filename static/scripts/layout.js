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

function plotVideo() {
    sessionStorage.nomeVideo = document.formulario.videoo.value;
    console.log(sessionStorage.nomeVideo)
    $("#video_container").load("static/loadVideo.html");
    document.getElementById("plot_tweets").className = "plot_tweets"
}

function plot() {
    d3.json("/static/DATA/dados/" + document.formulario.dadoss.value).then(function (data) {
        fetch('/preprocess?a=' + document.formulario.dadoss.value).then((response) => {
            return response.json();
        })
        sleep(10000);
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
    })
}