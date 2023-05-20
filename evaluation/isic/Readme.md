## Evaluation: ISIC use case

This folder contains all files that are needed to replicate the Federated Learning (FL) version of ISIC-GEN use case as described in the paper. Before trying to replicate the use case, please setup your development environment (backend, frontend, etc.) as described in the Readme.md in the /src folder.

After your local Playground instance is running successfully, you can execute the following to replicate the use case:

## 1. Insert the schema data into Blazegraph

1. Navigate to http://localhost:9999 and switch to the 'Update' tab
2. In the 'Type' dropdown below choose "**RDF Data**" and in the 'Format' dropdown choose "**Turtle**"
3. Paste the contents from **./schema.ttl** and press "Update".
4. Now your blazegraph DB has all the data to execute this use case

## 2. Execute the use case

To execute the use case, do the following: 

1. Open your local Playground instance at http://localhost:4200. 
2. In the 'ISIC Orga', select both datasets for all three available stations. 
3. Click on 'Select Route' in the lower right corner and confirm the route
4. Wait for the environment to be created
5. Upload the following two zip files into the playground via the upload button in the upper left corner. Both zip files contain all the source code needed to execute the use case:

    5.1 Upload the file **./isic_learning.zip** when "Execution" is selected in the code editor on the left

    5.2 Select "Aggregation" in the code editor on the left and upload the file  **./isic_aggregation.zip**

Now you can press **play** in the upper left corner of the playground to execute the use case.

If you want, you can change the Hyperparameters by creating environment variables via the 'Environment variable' tab on the right (see code in main.py, line 59+ for the names of the variables) or in the code directly.

### GPU support

Please note, that **by default the code that is provided here will be executed using only the CPU**. The execution times provided in the paper steam however from a GPU-based execution. If you also want to execute the code using GPU acceleration, you have to do the following:

1. Install the [Nvidia Container Toolkit on your host machine](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)
2. Change the Docker-In-Docker (dind) container provided in the '/src/docker-compose-dev.yml' such that [the GPU is enabled in compose](https://docs.docker.com/compose/gpu-support/) and the container supports the correct cuda version of your GPU.

After executing these steps, you need to change the base image of the provided ISIC code to fit your Cuda version as well. With these steps, you should be able to execute the simulation in the Playground using GPU acceleration.

### ISIC-SAMPLE

As stated in the paper, the same code provided here for the ISIC-GEN use case can be used to execute the ISIC-SAMPLE use case. For this, you first have to setup the real data sources as described in the original use case paper by Mou et al.[^1] and [this accompanying github repository](https://github.com/rwth-i5/mie2021). You can then change the environment variables in the playground to point to the real FHIR and file dump servers instead of the simulated ones to execute the use case.

[^1]: [Mou, Yongli, et al. "Distributed skin lesion analysis across decentralised data sources." Public Health and Informatics. IOS Press, 2021. 352-356.](https://ebooks.iospress.nl/volumearticle/56886)