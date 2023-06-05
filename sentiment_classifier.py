import pandas as pd
from nltk.tokenize import TweetTokenizer
from sklearn import svm
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB


class SentimentClassifier:

    def __init__(self):
        tweet_tokenizer = TweetTokenizer()

        self.vectorizerPositivoNegativo = CountVectorizer(analyzer="word", tokenizer=tweet_tokenizer.tokenize)
        self.vectorizerPositivoNeutro = CountVectorizer(analyzer="word", tokenizer=tweet_tokenizer.tokenize)
        self.vectorizerNegativoNeutro = CountVectorizer(analyzer="word", tokenizer=tweet_tokenizer.tokenize)

        self.classificadorLRPositivoNegativo = LogisticRegression(random_state=0)
        self.classificadorMultinomialPositivoNeutro = MultinomialNB()
        self.classificadorSVMNegativoNeutro = svm.SVC(kernel='linear')
        self.treinar_classificadores_sentimento()

    def treinar_classificadores_sentimento(self):
        dadosTreinoGeral = pd.read_excel('TweetsTreino70OversimplePreProcessados.xlsx', engine='openpyxl').fillna(' ')

        dadosPositivoNegativoTreino = dadosTreinoGeral[dadosTreinoGeral['SentimentoFinal'] != 0]
        dadosPositivoNeutroTreino = dadosTreinoGeral[dadosTreinoGeral['SentimentoFinal'] != 2]
        dadosNegativoNeutroTreino = dadosTreinoGeral[dadosTreinoGeral['SentimentoFinal'] != 1]

        tweetsParaTreinoPositivoNegativo = dadosPositivoNegativoTreino['full_text'].values
        tweetsParaTreinoPositivoNeutro = dadosPositivoNeutroTreino['full_text'].values
        tweetsParaTreinoNegativoNeutro = dadosNegativoNeutroTreino['full_text'].values

        vect_tweetsTreinoPositivoNegativo = self.vectorizerPositivoNegativo.fit_transform(
            tweetsParaTreinoPositivoNegativo)
        vect_tweetsTreinoPositivoNeutro = self.vectorizerPositivoNeutro.fit_transform(tweetsParaTreinoPositivoNeutro)
        vect_tweetsTreinoNegativoNeutro = self.vectorizerNegativoNeutro.fit_transform(tweetsParaTreinoNegativoNeutro)

        classesParaTreinoPositivoNegativo = dadosPositivoNegativoTreino['SentimentoFinal'].values
        classesParaTreinoPositivoNeutro = dadosPositivoNeutroTreino['SentimentoFinal'].values
        classesParaTreinoNegativoNeutro = dadosNegativoNeutroTreino['SentimentoFinal'].values

        self.classificadorLRPositivoNegativo.fit(vect_tweetsTreinoPositivoNegativo, classesParaTreinoPositivoNegativo)

        self.classificadorMultinomialPositivoNeutro.fit(vect_tweetsTreinoPositivoNeutro,
                                                        classesParaTreinoPositivoNeutro)
        self.classificadorSVMNegativoNeutro.fit(vect_tweetsTreinoNegativoNeutro, classesParaTreinoNegativoNeutro)

    # routes
    def predict(self, data) -> dict:
        # convert data into dataframe
        data.update((x, [y]) for x, y in data.items())
        data_df = pd.DataFrame.from_dict(data)

        # train model
        vect_positivoNegativo = self.vectorizerPositivoNegativo.transform(data_df["text"])
        rePositivoNegativo = self.classificadorLRPositivoNegativo.predict(vect_positivoNegativo)
        vect_positivoNeutro = self.vectorizerPositivoNeutro.transform(data_df["text"])
        rePositivoNeutro = self.classificadorMultinomialPositivoNeutro.predict(vect_positivoNeutro)
        vect_NegativoNeutro = self.vectorizerNegativoNeutro.transform(data_df["text"])
        reNegativoNeutro = self.classificadorSVMNegativoNeutro.predict(vect_NegativoNeutro)

        resultFinal = []
        # Get result of 3 model and apply our model
        if rePositivoNeutro == 0 and reNegativoNeutro == 0:
            resultFinal.append(0)
        elif rePositivoNeutro == 1 and rePositivoNegativo == 1:
            resultFinal.append(1)
        elif reNegativoNeutro == 2 and rePositivoNegativo == 2:
            resultFinal.append(2)
        else:
            resultFinal.append(0)

        # send back to browser
        output = {'results': int(resultFinal[0])}
        return output

    # method to predict locally without take a lot of time like REST request
    # def predict_test(self, dataset) -> dict:
    #     # get data
    #     data = json.loads(dataset)
    #
    #     return self.predict(data)
