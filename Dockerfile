# node.js with Grunt

FROM node:19

# Define working directory.
WORKDIR /home/app

# Install Bower & Grunt
RUN npm install -g grunt-cli

# Define default command.
CMD ["bash"]
