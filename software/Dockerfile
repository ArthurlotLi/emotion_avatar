#
# A simple dockerfile to support running the web application to serve
# clients. 
#
# To build the docker container in WSL2:
#
# sudo rm /src -r; 
# sudo cp /mnt/c/src/tales_of_skits/software /src -r; sudo chmod -R 777 /src; cd /src; 
# sudo docker build --progress plain -f Dockerfile --tag tales_of_skits:1.0 .; sudo docker run --publish 80:80 -it tales_of_skits:1.0

# Start with the base nodejs container.
FROM node:16

# Port through which we'll expose the web application.
EXPOSE 80

# We will mimic the C:\src setup.
WORKDIR /src
COPY . \
  .

# All done. This command runs everything on startup. 
RUN npm install
CMD npm start