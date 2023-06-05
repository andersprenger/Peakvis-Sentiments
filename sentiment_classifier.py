#
# Twitter Sentiment Classifier
#
# author: Anderson Sprenger, Gustavo Duarte
# email: anderson.sprenger@edu.pucrs.br
# date: June 04, 2023
#
# This script will be used to classify the tweets by positive, negative or neutral sentiments.
#
# The script will use the following classifiers:
# - Logistic Regression
# - Multinomial Naive Bayes
# - Support Vector Machine
#

import pandas as pd
from nltk.tokenize import TweetTokenizer
from sklearn import svm
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB


class SentimentClassifier:
    # Construtor da classe...
    def __init__(self):
        # Inicializando o tokenizador de tweets...
        tweet_tokenizer = TweetTokenizer()

        # Inicializando os vetorizadores de palavras...
        self.vectorizerPositiveNegative = CountVectorizer(analyzer="word", tokenizer=tweet_tokenizer.tokenize)
        self.vectorizerPositiveNeutral = CountVectorizer(analyzer="word", tokenizer=tweet_tokenizer.tokenize)
        self.vectorizerNegativeNeutral = CountVectorizer(analyzer="word", tokenizer=tweet_tokenizer.tokenize)

        # Inicializando os classificadores...
        self.classifierLRPositiveNegative = LogisticRegression(random_state=0)
        self.classifierMultinomialPositiveNeutral = MultinomialNB()
        self.classifierSVMNegativeNeutral = svm.SVC(kernel='linear')
        self.train_sentiment_classifiers()

    # Função para treinar os classificadores de sentimento...
    def train_sentiment_classifiers(self):
        # Carregando o dataset de treinamento...
        generalTrainingData = pd.read_excel('dataset.xlsx', engine='openpyxl').fillna(
            ' ')

        # Preparando os dados para o treinamento do modelo...
        positiveNegativeTrainData = generalTrainingData[generalTrainingData['SentimentoFinal'] != 0]
        positiveNeutralTrainData = generalTrainingData[generalTrainingData['SentimentoFinal'] != 2]
        negativeNeutralTrainData = generalTrainingData[generalTrainingData['SentimentoFinal'] != 1]

        tweetsForPositiveNegativeTrain = positiveNegativeTrainData['full_text'].values
        tweetsForPositiveNeutralTrain = positiveNeutralTrainData['full_text'].values
        tweetsForNegativeNeutralTrain = negativeNeutralTrainData['full_text'].values

        # Vetorizando os dados de treinamento...
        vectPositiveNegativeTrain = self.vectorizerPositiveNegative.fit_transform(tweetsForPositiveNegativeTrain)
        vectPositiveNeutralTrain = self.vectorizerPositiveNeutral.fit_transform(tweetsForPositiveNeutralTrain)
        vectNegativeNeutralTrain = self.vectorizerNegativeNeutral.fit_transform(tweetsForNegativeNeutralTrain)

        # Obtendo as classes dos dados de treinamento...
        classesPositiveNegativeTrain = positiveNegativeTrainData['SentimentoFinal'].values
        classesPositiveNeutralTrain = positiveNeutralTrainData['SentimentoFinal'].values
        classesNegativeNeutralTrain = negativeNeutralTrainData['SentimentoFinal'].values

        # Treinando os classificadores...
        self.classifierLRPositiveNegative.fit(vectPositiveNegativeTrain, classesPositiveNegativeTrain)
        self.classifierMultinomialPositiveNeutral.fit(vectPositiveNeutralTrain, classesPositiveNeutralTrain)
        self.classifierSVMNegativeNeutral.fit(vectNegativeNeutralTrain, classesNegativeNeutralTrain)

    # Função para classificar os tweets...
    # A função recebe um dicionário com os dados do tweet e retorna um dicionário com o resultado da classificação.
    def predict(self, data) -> dict:
        # Preparando os dados para a classificação...
        data.update((x, [y]) for x, y in data.items())
        data_df = pd.DataFrame.from_dict(data)

        # Vetorizando os dados para a classificação...
        vectPositiveNegative = self.vectorizerPositiveNegative.transform(data_df["text"])
        vectPositiveNeutral = self.vectorizerPositiveNeutral.transform(data_df["text"])
        vectNegativeNeutral = self.vectorizerNegativeNeutral.transform(data_df["text"])

        # Classificando os tweets...
        resultPositiveNeutral = self.classifierMultinomialPositiveNeutral.predict(vectPositiveNeutral)
        resultNegativeNeutral = self.classifierSVMNegativeNeutral.predict(vectNegativeNeutral)
        resultPositiveNegative = self.classifierLRPositiveNegative.predict(vectPositiveNegative)

        finalResult = []

        # Verificando o resultado da classificação...
        if resultPositiveNeutral == 0 and resultNegativeNeutral == 0:
            finalResult.append(0)
        elif resultPositiveNeutral == 1 and resultPositiveNegative == 1:
            finalResult.append(1)
        elif resultNegativeNeutral == 2 and resultPositiveNegative == 2:
            finalResult.append(2)
        else:
            finalResult.append(0)

        # Retornando o resultado da classificação...
        output = {'results': int(finalResult[0])}
        return output
