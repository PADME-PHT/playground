FROM openjdk:19

WORKDIR /workdir/data

#Copy directly to workdir, execute in data
# -> Journal is saved in the data dir and can be saved
COPY . /workdir/

EXPOSE 9999/tcp
LABEL version="latest"

CMD java -Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8 -server -Xmx4g -jar ../blazegraph.jar