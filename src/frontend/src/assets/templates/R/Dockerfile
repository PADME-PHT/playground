FROM r-base:latest

# LABEL
LABEL envs=""

WORKDIR /home

#Install needed system packages
#RUN apt update && apt install -y PACKAGE

# Install requirements
COPY install_packages.R ./
RUN Rscript install_packages.R

## copy files
COPY  . .

## run the script
CMD Rscript main.R
