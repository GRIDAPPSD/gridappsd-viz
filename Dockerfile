FROM node:boron

WORKDIR /viz

RUN npm install -g typescript 
RUN npm install -g typings 
RUN npm install -g webpack 

COPY ./viz/ /viz/viz/

WORKDIR /viz/viz

RUN npm install 
RUN webpack

ENV VIZ_PORT=8082
ENV PORT=${VIZ_PORT}
EXPOSE ${VIZ_PORT}

CMD ["npm", "start"]
