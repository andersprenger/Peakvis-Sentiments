from flask import Flask, render_template, request, jsonify
import json
import datetime as dt
#import sys
from pathlib import Path
import numpy as np
import pandas as pd
from csv import DictReader
from itertools import chain
import os
import csv
import regex as re
import itertools
import networkx as nx
from networkx.algorithms.community import girvan_newman
from networkx.algorithms.community import greedy_modularity_communities
from networkx.readwrite import json_graph
import pickle
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfVectorizer
import nltk
from nltk.tokenize import TweetTokenizer
from sklearn import svm
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
app = Flask(__name__, static_url_path='/static/')
# This is a ML model which was integrate with PeakViz
dadosTreinoGeral = pd.read_excel('TweetsTreino70OversimplePreProcessados.xlsx', engine='openpyxl').fillna(' ')
dadosPositivoNegativoTreino = dadosTreinoGeral[dadosTreinoGeral['SentimentoFinal'] != 0]
tweet_tokenizer = TweetTokenizer() 
vectorizerPositivoNegativo = CountVectorizer(analyzer="word", tokenizer=tweet_tokenizer.tokenize)
tweetsParaTreinoPositivoNegativo = dadosPositivoNegativoTreino['full_text'].values
classesParaTreinoPositivoNegativo = dadosPositivoNegativoTreino['SentimentoFinal'].values
vect_tweetsTreinoPositivoNegativo = vectorizerPositivoNegativo.fit_transform(tweetsParaTreinoPositivoNegativo) 
classificadorLRPositivoNegativo = LogisticRegression(random_state=0).fit(vect_tweetsTreinoPositivoNegativo, classesParaTreinoPositivoNegativo)
dadosPositivoNeutroTreino = dadosTreinoGeral[dadosTreinoGeral['SentimentoFinal'] != 2]
vectorizerPositivoNeutro = CountVectorizer(analyzer="word", tokenizer=tweet_tokenizer.tokenize)
tweetsParaTreinoPositivoNeutro = dadosPositivoNeutroTreino['full_text'].values
classesParaTreinoPositivoNeutro = dadosPositivoNeutroTreino['SentimentoFinal'].values
vect_tweetsTreinoPositivoNeutro = vectorizerPositivoNeutro.fit_transform(tweetsParaTreinoPositivoNeutro) 
classificadorMultinomialPositivoNeutro = MultinomialNB()
classificadorMultinomialPositivoNeutro.fit(vect_tweetsTreinoPositivoNeutro, classesParaTreinoPositivoNeutro) 
dadosNegativoNeutroTreino = dadosTreinoGeral[dadosTreinoGeral['SentimentoFinal'] != 1]
vectorizerNegativoNeutro = CountVectorizer(analyzer="word", tokenizer=tweet_tokenizer.tokenize)
tweetsParaTreinoNegativoNeutro = dadosNegativoNeutroTreino['full_text'].values
classesParaTreinoNegativoNeutro = dadosNegativoNeutroTreino['SentimentoFinal'].values
vect_tweetsTreinoNegativoNeutro = vectorizerNegativoNeutro.fit_transform(tweetsParaTreinoNegativoNeutro) 
classificadorSVMNegativoNeutro = svm.SVC(kernel='linear')
classificadorSVMNegativoNeutro.fit(vect_tweetsTreinoNegativoNeutro, classesParaTreinoNegativoNeutro)  

# routes
@app.route('/sentimental', methods=['POST'])
def predict():
    # get data from Request
    data = request.get_json(force=True)

    # convert data into dataframe
    data.update((x, [y]) for x, y in data.items())
    data_df = pd.DataFrame.from_dict(data)
    # train model
    vect_positivoNegativo = vectorizerPositivoNegativo.transform(data_df["text"]) 
    rePositivoNegativo = classificadorLRPositivoNegativo.predict(vect_positivoNegativo)
    vect_positivoNeutro = vectorizerPositivoNeutro.transform(data_df["text"]) 
    rePositivoNeutro = classificadorMultinomialPositivoNeutro.predict(vect_positivoNeutro)
    vect_NegativoNeutro = vectorizerNegativoNeutro.transform(data_df["text"]) 
    reNegativoNeutro = classificadorSVMNegativoNeutro.predict(vect_NegativoNeutro)

    resultFinal = []
    # Get result of 3 model and apply our model
    if(rePositivoNeutro == 0 and reNegativoNeutro == 0):
        resultFinal.append(0)
    elif(rePositivoNeutro == 1 and rePositivoNegativo == 1):
         resultFinal.append(1)
    elif(reNegativoNeutro == 2 and  rePositivoNegativo == 2):
         resultFinal.append(2)
    else:
        resultFinal.append(0)

    
    # send back to browser
    output = {'results': int(resultFinal[0])}
    # return data
    return jsonify(results=output)

#method to predict locally without take a lot time like REST request
def predict_test(dataset):
    # get data
    data = json.loads(dataset)

    # convert data into dataframe
    data.update((x, [y]) for x, y in data.items())
    data_df = pd.DataFrame.from_dict(data)
    vect_positivoNegativo = vectorizerPositivoNegativo.transform(data_df["text"]) 
    rePositivoNegativo = classificadorLRPositivoNegativo.predict(vect_positivoNegativo)
    vect_positivoNeutro = vectorizerPositivoNeutro.transform(data_df["text"]) 
    rePositivoNeutro = classificadorMultinomialPositivoNeutro.predict(vect_positivoNeutro)
    vect_NegativoNeutro = vectorizerNegativoNeutro.transform(data_df["text"]) 
    reNegativoNeutro = classificadorSVMNegativoNeutro.predict(vect_NegativoNeutro)
    resultFinal = []
    if(rePositivoNeutro == 0 and reNegativoNeutro == 0):
        resultFinal.append(0)
    elif(rePositivoNeutro == 1 and rePositivoNegativo == 1):
         resultFinal.append(1)
    elif(reNegativoNeutro == 2 and  rePositivoNegativo == 2):
         resultFinal.append(2)
    else:
        resultFinal.append(0)

    output = {'results': int(resultFinal[0])}
    # return data
    return output

@app.route('/feelinganalysis')
def indexfelling():
    return render_template('layout_sentimental.html')

@app.route('/')
def index():
    return render_template('layout.html')

@app.route('/tweetanalytics')
def analytics():
    return render_template('sentimental.html')


@app.route('/preprocess')
def background_process_test():
    fname = request.args.get('a')
    master_script(fname)
    return 'nop'

@app.route('/preprocesssentimental')
def background_process_sentimental_test():
    fname = request.args.get('a')
    master_script_sentimental(fname)
    return 'nop'
def master_script_sentimental(file_name):
    f_no_ext = Path(file_name).stem
    #handle with sentimental file.
    if Path('static/DATA/dados/' + f_no_ext + "_sentimental.json").is_file():
        print('done sentimental')
    else:
        arq = open(file='static/DATA/dados/' + file_name, mode='r', encoding="utf-8")
        data = json.load(arq)
        for index in range(len(data)):
            datate = data[index]
            datate_request = json.dumps(datate)
            send_request = predict_test(datate_request)
            response =send_request
            sentimental = response['results']
            if sentimental == 1:
                datate['emotion'] = 'positivo'
            if sentimental == 0:
                datate['emotion'] = 'neutro'
            if sentimental == 2:
                datate['emotion'] = 'negativo'
            data[index] = datate
        with open('static/DATA/dados/'+ f_no_ext + "_sentimental.json", 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
def master_script(file_name):
    f_no_ext = Path(file_name).stem

    if Path('static/storage/' + f_no_ext + "_WC.txt").is_file() and Path('static/storage/' + f_no_ext + "_RT.txt").is_file() and Path('static/storage/' + f_no_ext + "_sentimental.json").is_file():
        print('done')
    else:
        arq = open(file='static/DATA/dados/' + file_name, mode='r', encoding="utf-8")
        wc = open(file='static/storage/'+ f_no_ext + "_WC.txt", mode='w', encoding="utf-8")
        toprt = open(file='static/storage/' + f_no_ext + "_RT.txt", mode='w', encoding="utf-8")

        data = json.load(arq)
        arq.close()
        count = 0
        resp = []
        auxMap = dict()
        rts = dict()

        if 'retweets' in data[0]:
            rt_key = 'retweets'
        else:
            rt_key = 'retweet_count'

        # sanitize
        stopwords_list = []
        with open('static/stopwords/stopwords.txt', 'r', encoding='utf8') as f:
            stopwords_list.append(f.read().splitlines())
        stop_words = stopwords_list[0]

        for tweet in data:
            new_str = ""
            for w in tweet['text'].split(' '):
                if w.lower() not in stop_words:
                    new_str += ' ' + w
                    # print(new_str)
                tweet['text'] = new_str

        #oi = dt.datetime.strptime(data[0]["created_at"], "%Y-%m-%d %H:%M:%S")
        #oi2 = dt.datetime.strptime(data[20176]["created_at"], "%Y-%m-%d %H:%M:%S")
        #print((oi - oi2).seconds)
        started_time = dt.datetime.strptime(
            data[len(data)-1]["created_at"], "%Y-%m-%d %H:%M:%S") + dt.timedelta(seconds=1)
        for i in range(len(data)-1, -1, -1):
            if dt.datetime.strptime(data[i]["created_at"], "%Y-%m-%d %H:%M:%S") >= started_time:
                started_time = dt.datetime.strptime(
                    data[i]["created_at"], "%Y-%m-%d %H:%M:%S") + dt.timedelta(seconds=1)
                count = count + 1

                if count % 15 == 0:
                    # word cloud
                    resp = sorted(auxMap.items(),
                                  key=lambda x: x[1], reverse=True)
                    if len(resp) < 30:
                        tam = len(resp)
                    else:
                        tam = 30

                    stringg = ""
                    for j in range(tam):
                        stringg = stringg + resp[j][0] + \
                            "," + str(resp[j][1]) + ","
                    stringg = stringg[0:-1] + "\n"
                    wc.write(stringg)
                    #wc.write(str(resp[0:10])[1:-1].replace("(", " ").replace("),", ",").replace(")", " ") +"\n")

                    # top retweets
                    resp = sorted(
                        rts.items(), key=lambda x: x[1], reverse=True)
                    if len(resp) < 30:
                        tam = len(resp)
                    else:
                        tam = 30

                    stringg = ""
                    for j in range(tam):
                        stringg = stringg + resp[j][0] + \
                            "," + str(resp[j][1]) + ","
                    stringg = stringg[0:-1] + "\n"
                    toprt.write(stringg)
                    #toprt.write(str(resp[0:10])[1:-1].replace("(", " ").replace("),", ",").replace(")", " ") +"\n")

            else:
                # word cloud
                aux = re.split(" |\n", data[i]["text"])
                for j in range(len(aux)):
                    if aux[j] not in auxMap.keys():
                        auxMap[aux[j]] = 1
                    else:
                        auxMap[aux[j]] = auxMap.get(aux[j]) + 1

                # top retweets
                if data[i]["username"] not in rts.keys():
                    rts[data[i]["username"]] = data[i][rt_key]
                else:
                    rts[data[i]["username"]] = rts.get(
                        data[i]["username"]) + data[i][rt_key]

        wc.close()
        toprt.close()
    print('done')

    if Path('static/storage/' + f_no_ext + "_sentimental.json").is_file():
        print('done sentimental')
    else:
        arq = open(file='static/DATA/dados/' + file_name, mode='r', encoding="utf-8")
        data = json.load(arq)
        for index in range(len(data)):
            datate = data[index]
            datate_request = json.dumps(datate)
            send_request = predict_test(datate_request)
            response =send_request
            sentimental = response['results']
            if sentimental == 1:
                datate['emotion'] = 'positivo'
            if sentimental == 0:
                datate['emotion'] = 'neutro'
            if sentimental == 2:
                datate['emotion'] = 'negativo'
            data[index] = datate
        with open('static/storage/'+ f_no_ext + "_sentimental.json", 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)

    if Path('static/storage/' + f_no_ext + "_graph.json").is_file():
        print('done2')
    else:
        arq_json = f_no_ext + ".json"
        arq_csv = f_no_ext + ".csv"
        arq_semantico = f_no_ext + "semantic_support.csv"
        grafo_semantico = f_no_ext + "_graph.json"

        pd_obj = pd.read_json('static/DATA/dados/' + arq_json, encoding="utf8")
        pd_obj.to_csv(arq_csv, index=False)
        file = pd.read_csv(arq_csv)
        keep_col = ['text']
        new_file = file[keep_col]
        new_file.to_csv(arq_csv, index=False)
        f = open(r"static/stopwords/stopwords.txt", 'r', encoding='utf8')
        stopwords = [name.rstrip().lower() for name in f]

        with open(arq_csv, encoding="utf8") as f:
            vTweets = [row["text"] for row in DictReader(f)]

        vFrases = []

        for idx, tweet in enumerate(vTweets):
            tweet = re.sub(r"https?:\/\/(\S+)", "", tweet)
            # tira toda a pontuação exceto arroba e jogo da velha
            emoji_pattern = re.compile("["
                                       u"\U0001F600-\U0001F64F"  # emoticons
                                       u"\U0001F300-\U0001F5FF"  # symbols & pictographs
                                       u"\U0001F680-\U0001F6FF"  # transport & map symbols
                                       u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
                                       u"\U00002702-\U000027B0"
                                       u"\U000024C2-\U0001F251"
                                       "]+", flags=re.UNICODE)

            tweet = re.sub(emoji_pattern, "", tweet)
            tweet = re.sub(r"[^\P{P}@#]+", "", tweet)
            tweet = re.sub(r"\n", "", tweet)
            # tira toda a pontuação
            # tweet = re.sub('['+string.punctuation+']', '', tweet)
            tweet = " ".join([x for x in tweet.split(
                ' ') if x.lower() not in stopwords])
            tweet = tweet.rstrip()
            tweet = tweet.strip()
            tweet = tweet.lower()
            vFrases.append(tweet)

        col1 = []
        col2 = []

        for frase in vFrases:
            vPalavras = frase.split(' ')
            nPalavras = len(vPalavras)

            if nPalavras > 2:
                nLinhas = 0
                vNumeros = []
                for i in range(nPalavras):
                    b = nPalavras-(i+1)
                    if b > 0:
                        vNumeros.append(b)
                    nLinhas = nLinhas + b

                nNumeros = len(vNumeros)
                invNumeros = vNumeros[::-1]

                c1 = []
                for i in range(nNumeros):
                    for j in range(vNumeros[i]):
                        c1.append(vPalavras[i])
                col1.extend(c1)

                ordemC2 = []
                for i in range(nNumeros):
                    for j in invNumeros:
                        ordemC2.append(j)
                    invNumeros.pop(0)

                Mposicao = []
                posicaoC2 = []
                for i in range(int(nLinhas/nPalavras)):
                    for j in range(nPalavras):
                        posicaoC2.append(vPalavras[j])
                        Mposicao.append(j)

                c2 = []
                c2[:] = [posicaoC2[i] for i in ordemC2]
                col2.extend(c2)

        #col1_array = np.array(col1)
        #col2_array = np.array(col2)

        matriz = np.c_[col1, col2]
        df = pd.DataFrame(columns=["source", "target"], data=matriz)
        df['source'].replace('', np.nan, inplace=True)
        df.dropna(subset=['source'], inplace=True)
        df['target'].replace('', np.nan, inplace=True)
        df.dropna(subset=['target'], inplace=True)
        df.to_csv(arq_semantico, index=False)

        df = pd.read_csv(arq_semantico)
        Graphtype = nx.DiGraph()
        G = nx.from_pandas_edgelist(df, create_using=Graphtype)

        for node, in_deg in dict(G.in_degree).items():
            G.nodes[node]['in_degree'] = in_deg
            # G.nodes[node]['paridade'] = (1-in_deg % 2)

        indeg = G.in_degree()

        # Mantém somente n perfis mais retuitados, mencionados
        top5 = sorted(indeg, key=lambda x: x[1], reverse=True)[:20]
        to_keep = [n for (n, deg) in top5]
        G = G.subgraph(to_keep)

        # Remover pelo grau de entrada(quantidade de rt ou mentions)
        # to_remove = [n for (n, deg) in indeg if deg < 10]
        # G.remove_nodes_from(to_remove)

        # Remove nós isolados
        G = nx.Graph(G)
        G.remove_nodes_from(list(nx.isolates(G)))
        G = nx.Graph(G)

        c = list(greedy_modularity_communities(G))

        nodes = list(G.nodes)

        group = []
        for x in nodes:
            group.extend([i for i, lst in enumerate(c) if x in lst])

        nx.set_node_attributes(G, 1, 'group')
        for i, node in enumerate(G.nodes):
            # print(node)
            G.nodes[node]['group'] = group[i]

        data = json_graph.node_link_data(G)
        with open('static/storage/' + grafo_semantico, 'w') as f:
            json.dump(data, f, indent=4)


if __name__ == '__main__':
    app.run(debug=True)
