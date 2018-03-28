FROM node:8.10.0-wheezy

VOLUME ["/src"]

RUN apt-get update
RUN apt-get install -y apt-transport-https ca-certificates
RUN curl -o- -L https://yarnpkg.com/install.sh | bash
RUN $HOME/.yarn/bin/yarn install

WORKDIR /src

# Install Deps
RUN yarn

EXPOSE 6006
EXPOSE 3000

ENTRYPOINT ["yarn"]
