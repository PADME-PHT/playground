import pandas as pd
import numpy as np

def calculateSusScore(df, positive, negative):
  sus = []
  
  #Get the avg for all positive columns
  for i in range(0, len(positive)):
    mean = df[positive[i]][0]
    #Minus 1 for positive columns
    sus.append((mean - 1))
  
  #Get the avg for all negative columns
  for i in range(0, len(negative)):
    mean = df[negative[i]][0]
    # 5 - value for all negative rows
    sus.append(5 - mean)

  #Sum up and calculate the sus score
  return sum(sus) * 2.5


def getStatisticsForColumns(df, columns):
  statistic = {}

  #Get the avg for all positive columns
  for i in range(0, len(columns)):
    mean = df[columns[i]].mean()
    std = df[columns[i]].std()
    statistic[columns[i]] = [mean, std]
  
  #Create new data frame and store in csv
  df = pd.DataFrame(statistic)
  df.rename({0: "avg", 1: "std"}, inplace=True)
  df.sort_index(axis=1, inplace=True)
  
  return df

def convertColumnsToInt(df, columns):
  #convert all sus columns to int
  for i in range(0, len(columns)):
    df = df.astype({columns[i]: int})
  return df

file = "results.csv"

df = pd.read_csv(file, index_col=0, sep=",")

#First replace 5 (Strongly Agree) with 5 only and same for 1
df.replace(to_replace="5(Strongly Agree)", value=5, inplace=True)
df.replace(to_replace="1(Strongly Disagree)", value=1, inplace=True)

#Remove id 12 (told us afterwards that he did not understand the questions)
df.drop(index = 12, inplace=True)

#Split df in people who know PHT and not
knowPht = df[df["G01Q02"] == "Yes"]
notKnowPht = df[df["G01Q02"] == "No"]

print(f"{len(knowPht)}/{len(df)} ({round(len(knowPht)/len(df)*100, 3)}%) people know the PHT - {len(notKnowPht)}/{len(df)} ({round(len(notKnowPht)/len(df)*100, 3)}%) people do not")
print("People that know PHT do:")
print(knowPht["G01Q03"].to_numpy())

#Get columns with SUS answers
prefix = "G02Q04"
susPositive = [f"{prefix}[SQ001]", f"{prefix}[SQ003]",  f"{prefix}[SQ005]",f"{prefix}[SQ007]", f"{prefix}[SQ009]"]
susNegative = [f"{prefix}[SQ002]", f"{prefix}[SQ004]",  f"{prefix}[SQ006]",f"{prefix}[SQ008]", f"{prefix}[SQ010]"]
susUnion = susPositive + susNegative

#1. Overall sus score
sus = convertColumnsToInt(df[susUnion], susUnion)
susStats = getStatisticsForColumns(sus, susUnion)
susStats.to_csv(f"sus_overall.csv")
score = calculateSusScore(susStats, susPositive, susNegative)
print(f"Overall sus score: {round(score, 3)}")
print(susStats)

#2. sus score for people who know the pht
susPht = convertColumnsToInt(knowPht[susUnion], susUnion)
susStatsPht = getStatisticsForColumns(susPht, susUnion)
susStatsPht.to_csv(f"sus_pht.csv")
scorePht = calculateSusScore(susStatsPht, susPositive, susNegative)
print(f"PHT sus score: {round(scorePht, 3)}")
print(susStatsPht)

#3. sus score for people who do not know the pht
susNoPht = convertColumnsToInt(notKnowPht[susUnion], susUnion)
susStatsNoPht = getStatisticsForColumns(susNoPht, susUnion)
susStatsNoPht.to_csv(f"sus_no_pht.csv")
scoreNoPht = calculateSusScore(susStatsNoPht, susPositive, susNegative)
print(f"No PHT sus score: {round(scoreNoPht, 3)}")
print(susStatsNoPht)

#Value for the last questions
prefixLast = "G03Q05"
lastColumns = [f"{prefixLast}[SQ001]", f"{prefixLast}[SQ002]", f"{prefixLast}[SQ003]", f"{prefixLast}[SQ004]", f"{prefixLast}[SQ005]", f"{prefixLast}[SQ006]"]

#4. Overall custom
custom = convertColumnsToInt(df[lastColumns], lastColumns)
customStats = getStatisticsForColumns(custom, lastColumns)
customStats.to_csv(f"overall_custom.csv")
print("Overall custom")
print(customStats)

#5. PHT custom
customPHT = convertColumnsToInt(knowPht[lastColumns], lastColumns)
customPHTStats = getStatisticsForColumns(customPHT, lastColumns)
customPHTStats.to_csv(f"pht_custom.csv")
print("PHT custom")
print(customPHTStats)

#6. Not PHT custom
customNoPHT = convertColumnsToInt(notKnowPht[lastColumns], lastColumns)
customNoPHTStats = getStatisticsForColumns(customNoPHT, lastColumns)
customNoPHTStats.to_csv(f"no_pht_custom.csv")
print("No PHT custom")
print(customNoPHTStats)