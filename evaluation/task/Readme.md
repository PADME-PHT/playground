# Playground Evaluation task

This directory contains all the needed information to replicate the user-study as described in our paper. Overall, the directory contains the following files:

- schema.ttl -> A Turtle (RDF) file with the evaluation database schemas. The file contents should be stored into the playgrounds blazegraph instance. See the instructions in the Readme file in the /backend folder. This schema expects an empty blaze instance
- example_solution_eval.zip -> A working solution that fulfills the evaluation task. This can be 1. uploaded to the playground to test the execution (via the upload button in the UI) 2. Unziped to see what was required from evaluation participants

Moreover, we provide some files to replicate the simulated setting in a real environment:

- docker-compose.yml -> A compose file that can be used to setup the required PostgreSQL database at each institution (Hospital A & B)
- a.sql -> SQL script for initializing the real Postgres DB in Hospital A with 1000 entries per table, contains 497 patients >= 50
- b.sql -> Same as a.sql but for Hospital B, contains 503 patients >= 50

Both provided SQL files contain randomized example data that has been generated with the plugins of the playground.