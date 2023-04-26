# Evaluation

This folder contains the answers from evaluation participants as described in the paper. Moreover, we provide the script that was used to calculate the SUS score and avg + std deviation for the custom questions. Besides this material, we provide the needed information to replicate the use-case in the 'task' subfolder.

Overall, the evaluation has been conducted with an anonymous online questionnaire with the help of [LimeSurvey](https://www.limesurvey.org/de/). The answers from all 29 participants have been exported and are provided as a CSV file named 'results.csv'. In the file, you can find three question groups (G01Q02, G02Q04, G03Q05). Group, G01Q02 contains one question asking whether participants had previous experience with DA. Group, G02Q04 contains the 10 SUS questions in the order given below. Lastly, group G03Q05 contains six custom questions, also in the order specified in the table below.

The script can be executed using Python version 3.x after installing ```numpy``` and ```pandas```. On execution, the script will create several CSV files that contain the calculated results for different sub-groups. Those results are split between the **custom questions** and the questions from the System Usability Scale (SUS). Moreover, we further distinguish each case by overall results, and results from participants with and without prior experience in DA.

As described in the paper, the responses from one participant was invalid (id=12) because the participant told us after the evaluation that he did not understand the questions and 'choose randomly'. Consequently, our script ignores the answers from this participant.

For the overall results of both the SUS and our custom questions we provide tabular visualizations in the following.

## SUS score

Average (Avg) and standard deviation (SD) per statement of the System Usability Scale (SUS) (n = 28). Each question could be answered on a scale from 1 (Strongly Disagree) to 5 (Strongly Agree).

| Question                                                                                     | Avg  | SD    |
|----------------------------------------------------------------------------------------------|------|-------|
| I think that I would like to use the Playground frequently                                   | 4.21 | ±0.79 |
| I found the Playground unnecessarily complex                                                 | 1.43 | ±0.50 |
| I thought the Playground was easy to use                                                     | 4.57 | ±0.69 |
| I think that I would need the support of a technical person to be able to use the Playground | 1.57 | ±0.84 |
| I found that the various functions in the Playground were well integrated                    | 4.64 | ±0.56 |
| I thought that there was too much inconsistency in the Playground                            | 1.14 | ±0.36 |
| I would imagine that most people would learn to use the Playground very quickly              | 4.46 | ±0.74 |
| I found the Playground very awkward to use                                                   | 1.79 | ±1.10 |
| I felt very confident using the Playground                                                   | 4.54 | ±0.58 |
| I needed to learn a lot of things before I could get going with the Playground               | 1.18 | ±0.48 |


## Custom questions

Average (Avg) and standard deviation (SD) per question regarding the Playground's comprehensiveness and usefulness (n = 28). Each question could be answered on a scale from 1 (Strongly Disagree) to 5 (Strongly Agree).

| Question                                                                                                                                                                     | Avg  | SD    |
|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|-------|
| The Playground offers the relevant tools needed to test distributed analysis algorithms                                                                                      | 4.50 | ±0.75 |
| The schema information provided in the Playground offers all the needed information to develop an analysis task on the described data before its actual execution/deployment | 4.54 | ±0.69 |
| The Playground facilitates access to the schema information, which is usually sealed within the institution                                                                  | 4.82 | ±0.39 |
| Using the Playground improves the development process - compared to deploying the analysis algorithms without the Playground                                                 | 4.50 | ±0.75 |
| The Playground helps with discovering possible problems in the execution, like differences in data schemas between Stations, before the execution                            | 4.64 | ±0.73 |
| The Playground solves the problem of testing distributed analysis algorithms                                                                                                 | 4.11 | ±0.79 |